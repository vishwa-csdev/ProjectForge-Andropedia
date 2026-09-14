from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from database import get_db
from models import User, Project, Membership, Task, TaskStatus, Contribution
from auth import get_current_user
from schemas import TaskResponse

router = APIRouter(tags=["Dashboard"])

class DashboardProject(BaseModel):
    id: int
    name: str
    member_count: int
    task_count: int
    progress: float
    model_config = ConfigDict(from_attributes=True)

class UpcomingTask(TaskResponse):
    project_name: str

class RecentActivity(BaseModel):
    id: int
    user_name: str
    project_name: str
    task_id: Optional[int]
    description: str
    logged_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DashboardResponse(BaseModel):
    my_projects: List[DashboardProject]
    upcoming_tasks: List[UpcomingTask]
    recent_activity: List[RecentActivity]

@router.get("", response_model=DashboardResponse)
@router.get("/", response_model=DashboardResponse)
async def get_dashboard(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # my_projects
    proj_result = await db.execute(
        select(Project).join(Membership).where(Membership.user_id == current_user.id)
    )
    projects = proj_result.scalars().all()
    project_ids = [p.id for p in projects]
    
    my_projects = []
    for p in projects:
        mem_res = await db.execute(select(func.count()).select_from(Membership).where(Membership.project_id == p.id))
        member_count = mem_res.scalar() or 0
        
        task_res = await db.execute(select(Task.status).where(Task.project_id == p.id))
        tasks = task_res.scalars().all()
        task_count = len(tasks)
        done_count = sum(1 for t in tasks if t == TaskStatus.done)
        progress = (done_count / task_count * 100.0) if task_count > 0 else 0.0
        
        my_projects.append(
            DashboardProject(
                id=p.id,
                name=p.name,
                member_count=member_count,
                task_count=task_count,
                progress=round(progress, 2)
            )
        )
        
    # upcoming tasks
    now = datetime.utcnow()
    two_weeks = now + timedelta(days=14)
    task_result = await db.execute(
        select(Task, Project.name)
        .join(Project, Project.id == Task.project_id)
        .where(
            and_(
                Task.assignee_id == current_user.id,
                Task.status != TaskStatus.done,
                Task.due_date.isnot(None),
                Task.due_date <= two_weeks
            )
        )
        .order_by(Task.due_date)
    )
    task_rows = task_result.all()
    upcoming_tasks = []
    for t, p_name in task_rows:
        task_dict = {
            "id": t.id, "project_id": t.project_id, "title": t.title, "description": t.description,
            "assignee_id": t.assignee_id, "status": t.status, "priority": t.priority,
            "due_date": t.due_date, "parent_task_id": t.parent_task_id, "created_at": t.created_at,
            "project_name": p_name
        }
        upcoming_tasks.append(UpcomingTask(**task_dict))
        
    # recent activity
    activity_result = await db.execute(
        select(Contribution, User.name, Project.name)
        .join(User, User.id == Contribution.user_id)
        .join(Project, Project.id == Contribution.project_id)
        .where(Contribution.project_id.in_(project_ids) if project_ids else False)
        .order_by(desc(Contribution.logged_at))
        .limit(20)
    )
    activity_rows = activity_result.all()
    recent_activity = []
    for c, u_name, p_name in activity_rows:
        recent_activity.append(
            RecentActivity(
                id=c.id,
                user_name=u_name,
                project_name=p_name,
                task_id=c.task_id,
                description=c.description,
                logged_at=c.logged_at
            )
        )
        
    return DashboardResponse(
        my_projects=my_projects,
        upcoming_tasks=upcoming_tasks,
        recent_activity=recent_activity
    )

@router.get("/tasks", response_model=List[UpcomingTask])
async def get_dashboard_tasks(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    task_result = await db.execute(
        select(Task, Project.name)
        .join(Project, Project.id == Task.project_id)
        .where(Task.assignee_id == current_user.id)
        .order_by(Task.due_date.nullslast())
    )
    task_rows = task_result.all()
    
    tasks = []
    for t, p_name in task_rows:
        task_dict = {
            "id": t.id, "project_id": t.project_id, "title": t.title, "description": t.description,
            "assignee_id": t.assignee_id, "status": t.status, "priority": t.priority,
            "due_date": t.due_date, "parent_task_id": t.parent_task_id, "created_at": t.created_at,
            "project_name": p_name
        }
        tasks.append(UpcomingTask(**task_dict))
        
    return tasks
