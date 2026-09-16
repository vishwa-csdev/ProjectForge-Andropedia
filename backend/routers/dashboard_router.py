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

class NotificationItem(BaseModel):
    id: str
    title: str
    detail: str
    href: str
    kind: str
    timestamp: Optional[datetime] = None

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
    member_counts = {}
    task_stats = {}
    if project_ids:
        mem_res = await db.execute(
            select(Membership.project_id, func.count(Membership.id))
            .where(Membership.project_id.in_(project_ids))
            .group_by(Membership.project_id)
        )
        member_counts = dict(mem_res.all())
        
        task_res = await db.execute(
            select(Task.project_id, Task.status, func.count(Task.id))
            .where(Task.project_id.in_(project_ids))
            .group_by(Task.project_id, Task.status)
        )
        for pid, t_status, cnt in task_res.all():
            if pid not in task_stats:
                task_stats[pid] = {"total": 0, "done": 0}
            task_stats[pid]["total"] += cnt
            if t_status == TaskStatus.done:
                task_stats[pid]["done"] += cnt
                
    for p in projects:
        m_count = member_counts.get(p.id, 0)
        stats = task_stats.get(p.id, {"total": 0, "done": 0})
        task_count = stats["total"]
        done_count = stats["done"]
        progress = (done_count / task_count * 100.0) if task_count > 0 else 0.0
        
        my_projects.append(
            DashboardProject(
                id=p.id,
                name=p.name,
                member_count=m_count,
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

@router.get("/notifications", response_model=List[NotificationItem])
async def get_notifications(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    two_weeks = now + timedelta(days=14)
    notifications = []

    task_result = await db.execute(
        select(Task, Project.name)
        .join(Project, Project.id == Task.project_id)
        .where(
            Task.assignee_id == current_user.id,
            Task.status != TaskStatus.done,
            Task.due_date.isnot(None),
            Task.due_date <= two_weeks,
        )
        .order_by(Task.due_date)
        .limit(10)
    )
    for task, project_name in task_result.all():
        notifications.append(NotificationItem(
            id=f"task-{task.id}",
            title="Task due soon",
            detail=f"{task.title} in {project_name}",
            href=f"/projects/{task.project_id}/tasks",
            kind="task",
            timestamp=task.due_date,
        ))

    project_result = await db.execute(
        select(Project)
        .join(Membership, Membership.project_id == Project.id)
        .where(
            Membership.user_id == current_user.id,
            Project.deadline.isnot(None),
            Project.deadline <= two_weeks,
            Project.deadline >= now,
        )
        .order_by(Project.deadline)
        .limit(10)
    )
    for project in project_result.scalars().all():
        notifications.append(NotificationItem(
            id=f"project-{project.id}",
            title="Project deadline approaching",
            detail=project.name,
            href=f"/projects/{project.id}",
            kind="deadline",
            timestamp=project.deadline,
        ))

    project_ids = select(Membership.project_id).where(Membership.user_id == current_user.id)
    activity_result = await db.execute(
        select(Contribution, User.name, Project.name)
        .join(User, User.id == Contribution.user_id)
        .join(Project, Project.id == Contribution.project_id)
        .where(Contribution.project_id.in_(project_ids))
        .order_by(desc(Contribution.logged_at))
        .limit(5)
    )
    for contribution, user_name, project_name in activity_result.all():
        if contribution.user_id == current_user.id:
            continue
        notifications.append(NotificationItem(
            id=f"contribution-{contribution.id}",
            title="New project activity",
            detail=f"{user_name} logged work in {project_name}",
            href=f"/projects/{contribution.project_id}/contributions",
            kind="activity",
            timestamp=contribution.logged_at,
        ))

    return sorted(notifications, key=lambda item: item.timestamp or now, reverse=True)
