from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from database import get_db
from models import Task, Project, Membership, Comment, User, MembershipRole, TaskStatus
from schemas import TaskCreate, TaskUpdate, TaskResponse, CommentCreate, CommentResponse
from auth import get_current_user

router = APIRouter(tags=["Tasks"])

class TaskAssignee(BaseModel):
    id: int
    name: str

class CommentUser(BaseModel):
    id: int
    name: str

class CommentWithUserResponse(CommentResponse):
    user: CommentUser

class TaskListResponse(TaskResponse):
    assignee: Optional[TaskAssignee] = None
    comment_count: int
    subtask_count: int

class TaskDetailResponse(TaskResponse):
    assignee: Optional[TaskAssignee] = None
    subtasks: List[TaskResponse] = []
    comments: List[CommentWithUserResponse] = []

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

@router.get("/{project_id}/tasks", response_model=List[TaskListResponse])
async def list_tasks(
    project_id: int,
    status: Optional[TaskStatus] = None,
    assignee_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await _check_membership(project_id, current_user, db)
    
    query = select(Task).options(selectinload(Task.assignee)).where(Task.project_id == project_id)
    if status:
        query = query.where(Task.status == status)
    if assignee_id:
        query = query.where(Task.assignee_id == assignee_id)
        
    result = await db.execute(query)
    tasks = result.scalars().all()
    
    response = []
    for t in tasks:
        # comment count
        c_res = await db.execute(select(func.count()).select_from(Comment).where(Comment.task_id == t.id))
        comment_count = c_res.scalar() or 0
        
        # subtask count
        s_res = await db.execute(select(func.count()).select_from(Task).where(Task.parent_task_id == t.id))
        subtask_count = s_res.scalar() or 0
        
        assignee_data = None
        if t.assignee:
            assignee_data = TaskAssignee(id=t.assignee.id, name=t.assignee.name)
            
        task_dict = {
            "id": t.id, "project_id": t.project_id, "title": t.title, "description": t.description,
            "assignee_id": t.assignee_id, "status": t.status, "priority": t.priority,
            "due_date": t.due_date, "parent_task_id": t.parent_task_id, "created_at": t.created_at,
            "assignee": assignee_data, "comment_count": comment_count, "subtask_count": subtask_count
        }
        response.append(task_dict)
    
    return response

@router.post("/{project_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    project_id: int,
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await _check_membership(project_id, current_user, db)
    
    new_task = Task(
        project_id=project_id,
        title=task_in.title,
        description=task_in.description,
        assignee_id=task_in.assignee_id,
        status=task_in.status,
        priority=task_in.priority,
        due_date=task_in.due_date,
        parent_task_id=task_in.parent_task_id
    )
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)
    return new_task

@router.get("/{project_id}/tasks/{task_id}", response_model=TaskDetailResponse)
async def get_task(
    project_id: int,
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await _check_membership(project_id, current_user, db)
    
    result = await db.execute(
        select(Task)
        .options(
            selectinload(Task.assignee),
            selectinload(Task.subtasks),
            selectinload(Task.comments).joinedload(Comment.user)
        )
        .where(and_(Task.id == task_id, Task.project_id == project_id))
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    assignee_data = None
    if task.assignee:
        assignee_data = TaskAssignee(id=task.assignee.id, name=task.assignee.name)
        
    return {
        "id": task.id, "project_id": task.project_id, "title": task.title, "description": task.description,
        "assignee_id": task.assignee_id, "status": task.status, "priority": task.priority,
        "due_date": task.due_date, "parent_task_id": task.parent_task_id, "created_at": task.created_at,
        "assignee": assignee_data,
        "subtasks": task.subtasks,
        "comments": task.comments
    }

@router.put("/{project_id}/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    project_id: int,
    task_id: int,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await _check_membership(project_id, current_user, db)
    
    result = await db.execute(select(Task).where(and_(Task.id == task_id, Task.project_id == project_id)))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    update_data = task_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
        
    await db.commit()
    await db.refresh(task)
    return task

@router.delete("/{project_id}/tasks/{task_id}")
async def delete_task(
    project_id: int,
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    membership = await _check_membership(project_id, current_user, db)
    if membership.role != MembershipRole.lead and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete tasks")
        
    result = await db.execute(select(Task).where(and_(Task.id == task_id, Task.project_id == project_id)))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    await db.delete(task)
    await db.commit()
    return {"message": "Task deleted"}

@router.post("/{project_id}/tasks/{task_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def add_comment(
    project_id: int,
    task_id: int,
    comment_in: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await _check_membership(project_id, current_user, db)
    
    result = await db.execute(select(Task).where(and_(Task.id == task_id, Task.project_id == project_id)))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Task not found")
        
    new_comment = Comment(
        task_id=task_id,
        user_id=current_user.id,
        content=comment_in.content
    )
    db.add(new_comment)
    await db.commit()
    await db.refresh(new_comment)
    return new_comment
