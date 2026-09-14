from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import require_admin
from database import get_db
from models import Comment, Contribution, Membership, MembershipRole, Project, ProjectStatus, Resource, Task, TaskStatus, User, UserRole

router = APIRouter(tags=["Admin"])


class RoleUpdate(BaseModel):
    role: UserRole


class AdminUser(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    joined_at: object
    project_count: int
    model_config = ConfigDict(from_attributes=True)


class ProjectControlUpdate(BaseModel):
    status: Optional[ProjectStatus] = None
    lead_user_id: Optional[int] = None


class WorkspaceResetRequest(BaseModel):
    confirmation: str


@router.get("/stats")
async def get_stats(_: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    async def count(model):
        return (await db.execute(select(func.count()).select_from(model))).scalar() or 0

    total_tasks = await count(Task)
    completed_tasks = (await db.execute(select(func.count()).select_from(Task).where(Task.status == TaskStatus.done))).scalar() or 0
    return {
        "operatives": await count(User),
        "projects": await count(Project),
        "active_projects": (await db.execute(select(func.count()).select_from(Project).where(Project.status == ProjectStatus.active))).scalar() or 0,
        "archived_projects": (await db.execute(select(func.count()).select_from(Project).where(Project.status == ProjectStatus.archived))).scalar() or 0,
        "milestones": total_tasks,
        "completed_milestones": completed_tasks,
        "completion_rate": round((completed_tasks / total_tasks * 100) if total_tasks else 0, 2),
        "resources": await count(Resource),
        "contributions": await count(Contribution),
    }


@router.get("/users")
async def list_admin_users(
    search: Optional[str] = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(User).order_by(User.name).offset(offset).limit(limit)
    if search:
        term = f"%{search}%"
        query = query.where(or_(User.name.ilike(term), User.email.ilike(term)))
    users = (await db.execute(query)).scalars().all()
    rows = []
    for user in users:
        project_count = (await db.execute(select(func.count()).select_from(Membership).where(Membership.user_id == user.id))).scalar() or 0
        rows.append({"id": user.id, "name": user.name, "email": user.email, "role": user.role, "joined_at": user.joined_at, "project_count": project_count})
    total_query = select(func.count()).select_from(User)
    if search:
        total_query = total_query.where(or_(User.name.ilike(term), User.email.ilike(term)))
    total = (await db.execute(total_query)).scalar() or 0
    return {"items": rows, "total": total, "offset": offset, "limit": limit}


@router.put("/users/{user_id}/role")
async def update_user_role(user_id: int, payload: RoleUpdate, current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Operative not found")
    if user.role == UserRole.admin and payload.role == UserRole.user:
        admin_count = (await db.execute(select(func.count()).select_from(User).where(User.role == UserRole.admin))).scalar() or 0
        if admin_count <= 1:
            raise HTTPException(status_code=409, detail="The last remaining admin cannot be demoted")
    user.role = payload.role
    await db.commit()
    project_count = (await db.execute(select(func.count()).select_from(Membership).where(Membership.user_id == user.id))).scalar() or 0
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "joined_at": user.joined_at, "project_count": project_count}


@router.delete("/users/{user_id}")
async def delete_user(user_id: int, current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Operative not found")
    if user.role == UserRole.admin:
        admin_count = (await db.execute(select(func.count()).select_from(User).where(User.role == UserRole.admin))).scalar() or 0
        if admin_count <= 1:
            raise HTTPException(status_code=409, detail="The last remaining admin cannot be deleted")
    owned_projects = (await db.execute(select(Project).where(Project.created_by == user_id))).scalars().all()
    for project in owned_projects:
        await db.delete(project)
    await db.execute(Membership.__table__.delete().where(Membership.user_id == user_id))
    await db.execute(Task.__table__.update().where(Task.assignee_id == user_id).values(assignee_id=None))
    await db.execute(Resource.__table__.update().where(Resource.uploaded_by == user_id).values(uploaded_by=None))
    await db.delete(user)
    await db.commit()
    return {"message": "Operative account deleted"}


@router.post("/reset-workspace")
async def reset_workspace(
    payload: WorkspaceResetRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if payload.confirmation != "RESET ANDROPEDIA":
        raise HTTPException(status_code=400, detail="Type RESET ANDROPEDIA to confirm this destructive action")

    await db.execute(Comment.__table__.delete())
    await db.execute(Contribution.__table__.delete())
    await db.execute(Resource.__table__.delete())
    await db.execute(Task.__table__.delete())
    await db.execute(Membership.__table__.delete())
    await db.execute(Project.__table__.delete())
    await db.execute(User.__table__.delete().where(User.id != current_user.id))

    test_project = Project(
        name="Andropedia Test Project",
        description="A clean verification project for testing tasks, resources, contributions, and reports.",
        status=ProjectStatus.active,
        created_by=current_user.id,
    )
    db.add(test_project)
    await db.flush()
    db.add(Membership(user_id=current_user.id, project_id=test_project.id, role=MembershipRole.lead))
    await db.commit()
    return {"message": "Workspace reset complete", "project_id": test_project.id}


@router.get("/projects")
async def list_admin_projects(_: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    projects = (await db.execute(select(Project, User.name).join(User, User.id == Project.created_by).order_by(Project.created_at.desc()))).all()
    response = []
    for project, creator_name in projects:
        member_count = (await db.execute(select(func.count()).select_from(Membership).where(Membership.project_id == project.id))).scalar() or 0
        task_count = (await db.execute(select(func.count()).select_from(Task).where(Task.project_id == project.id))).scalar() or 0
        member_rows = (await db.execute(select(User.id, User.name, Membership.role).join(Membership, Membership.user_id == User.id).where(Membership.project_id == project.id).order_by(User.name))).all()
        response.append({"id": project.id, "name": project.name, "status": project.status, "visibility": project.visibility, "creator_name": creator_name, "member_count": member_count, "task_count": task_count, "members": [{"id": member_id, "name": member_name, "role": role} for member_id, member_name, role in member_rows]})
    return response


@router.put("/projects/{project_id}")
async def update_project_control(project_id: int, payload: ProjectControlUpdate, _: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if payload.status is not None:
        project.status = payload.status
    if payload.lead_user_id is not None:
        membership = (await db.execute(select(Membership).where(Membership.project_id == project_id, Membership.user_id == payload.lead_user_id))).scalar_one_or_none()
        if not membership:
            raise HTTPException(status_code=400, detail="Lead must be a project member")
        await db.execute(Membership.__table__.update().where(Membership.project_id == project_id).values(role=MembershipRole.member))
        membership.role = MembershipRole.lead
    await db.commit()
    return {"message": "Mission controls updated"}


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: int, _: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
    await db.commit()