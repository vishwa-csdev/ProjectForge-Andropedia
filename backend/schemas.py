from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime
from models import UserRole, ProjectStatus, ProjectVisibility, MembershipRole, TaskStatus, TaskPriority, ResourceType, ResourceTag

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    joined_at: datetime
    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ProjectCreate(BaseModel):
    name: str
    description: str
    status: Optional[ProjectStatus] = ProjectStatus.active
    visibility: Optional[ProjectVisibility] = ProjectVisibility.open
    deadline: Optional[datetime] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    visibility: Optional[ProjectVisibility] = None
    deadline: Optional[datetime] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str
    status: ProjectStatus
    visibility: ProjectVisibility
    deadline: Optional[datetime]
    created_by: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class MembershipResponse(BaseModel):
    id: int
    user_id: int
    project_id: int
    role: MembershipRole
    joined_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TaskCreate(BaseModel):
    title: str
    description: str
    assignee_id: Optional[int] = None
    status: Optional[TaskStatus] = TaskStatus.todo
    priority: Optional[TaskPriority] = TaskPriority.medium
    due_date: Optional[datetime] = None
    parent_task_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee_id: Optional[int] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    parent_task_id: Optional[int] = None

class TaskResponse(BaseModel):
    id: int
    project_id: int
    title: str
    description: str
    assignee_id: Optional[int]
    status: TaskStatus
    priority: TaskPriority
    due_date: Optional[datetime]
    parent_task_id: Optional[int]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: int
    task_id: int
    user_id: int
    content: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ResourceCreate(BaseModel):
    type: ResourceType
    location: str
    title: str
    tag: ResourceTag

class ResourceResponse(BaseModel):
    id: int
    project_id: Optional[int] = None
    uploaded_by: Optional[int] = None
    type: ResourceType
    location: str
    title: str
    tag: ResourceTag
    added_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ContributionCreate(BaseModel):
    task_id: Optional[int] = None
    description: str

class ContributionResponse(BaseModel):
    id: int
    project_id: int
    user_id: int
    task_id: Optional[int]
    description: str
    logged_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DashboardResponse(BaseModel):
    projects: List[ProjectResponse]
    tasks: List[TaskResponse]
    recent_activities: List[ContributionResponse]
    model_config = ConfigDict(from_attributes=True)
