from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from datetime import datetime
from database import get_db
from models import Project, Membership, User, Task, TaskStatus, Contribution, Resource
from auth import get_current_user
from services.report_pdf import generate_project_pdf

router = APIRouter(tags=["Reports"])

async def _check_membership(project_id: int, user: User, db: AsyncSession) -> Membership:
    result = await db.execute(
        select(Membership).where(
            and_(Membership.project_id == project_id, Membership.user_id == user.id)
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this project")
    return membership

async def generate_report_data(project_id: int, db: AsyncSession) -> dict:
    # Get project
    p_res = await db.execute(select(Project).where(Project.id == project_id))
    project = p_res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Get Tasks
    t_res = await db.execute(select(Task).options(selectinload(Task.assignee)).where(Task.project_id == project_id))
    tasks = t_res.scalars().all()
    
    total = len(tasks)
    todo = sum(1 for t in tasks if t.status == TaskStatus.todo)
    in_progress = sum(1 for t in tasks if t.status == TaskStatus.in_progress)
    blocked = sum(1 for t in tasks if t.status == TaskStatus.blocked)
    done = sum(1 for t in tasks if t.status == TaskStatus.done)
    progress = (done / total * 100.0) if total > 0 else 0.0
    
    task_summary = {
        "total": total,
        "todo": todo,
        "in_progress": in_progress,
        "blocked": blocked,
        "done": done
    }
    
    task_list = []
    for t in tasks:
        task_list.append({
            "id": t.id,
            "title": t.title,
            "status": t.status.value if hasattr(t.status, "value") else t.status,
            "priority": t.priority.value if hasattr(t.priority, "value") else t.priority,
            "assignee_name": t.assignee.name if t.assignee else None,
            "due_date": t.due_date.isoformat() if t.due_date else None
        })
        
    # Get Members
    m_res = await db.execute(
        select(Membership, User)
        .join(User, User.id == Membership.user_id)
        .where(Membership.project_id == project_id)
    )
    memberships = m_res.all()
    
    # Get Contribution Counts
    c_count_res = await db.execute(
        select(Contribution.user_id, func.count(Contribution.id).label("count"))
        .where(Contribution.project_id == project_id)
        .group_by(Contribution.user_id)
    )
    c_counts = {row.user_id: row.count for row in c_count_res.all()}
    
    member_list = []
    for m, u in memberships:
        member_list.append({
            "id": u.id,
            "name": u.name,
            "role": m.role.value if hasattr(m.role, "value") else m.role,
            "contribution_count": c_counts.get(u.id, 0)
        })
        
    # Get Contributions
    c_res = await db.execute(
        select(Contribution)
        .options(selectinload(Contribution.user), selectinload(Contribution.task))
        .where(Contribution.project_id == project_id)
        .order_by(desc(Contribution.logged_at))
    )
    contributions = c_res.scalars().all()
    
    contributions_list = []
    for c in contributions:
        contributions_list.append({
            "id": c.id,
            "user_name": c.user.name if c.user else "Unknown",
            "description": c.description,
            "logged_at": c.logged_at.isoformat() if c.logged_at else None,
            "task_title": c.task.title if c.task else None
        })
        
    # Get Resources
    r_res = await db.execute(
        select(Resource)
        .options(selectinload(Resource.uploaded_by_user))
        .where(Resource.project_id == project_id)
    )
    resources = r_res.scalars().all()
    
    resources_list = []
    for r in resources:
        resources_list.append({
            "id": r.id,
            "title": r.title,
            "type": r.type.value if hasattr(r.type, "value") else r.type,
            "tag": r.tag.value if hasattr(r.tag, "value") else r.tag,
            "added_at": r.added_at.isoformat() if r.added_at else None,
            "uploaded_by_name": r.uploaded_by_user.name if r.uploaded_by_user else None
        })
        
    return {
        "project": {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "status": project.status.value if hasattr(project.status, "value") else project.status,
            "deadline": project.deadline.isoformat() if project.deadline else None,
            "created_at": project.created_at.isoformat() if project.created_at else None
        },
        "progress": round(progress, 2),
        "task_summary": task_summary,
        "members": member_list,
        "tasks": task_list,
        "contributions": contributions_list,
        "resources": resources_list,
        "generated_at": datetime.now().isoformat()
    }


@router.get("/{project_id}/report")
async def get_report_json(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await _check_membership(project_id, current_user, db)
    return await generate_report_data(project_id, db)

@router.get("/{project_id}/report/pdf")
async def get_report_pdf(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await _check_membership(project_id, current_user, db)
    report_data = await generate_report_data(project_id, db)
    
    pdf_buffer = generate_project_pdf(report_data)
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=project_{project_id}_report.pdf"}
    )
