from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, ForeignKey, DateTime, func, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"

class ProjectStatus(str, enum.Enum):
    active = "active"
    archived = "archived"

class ProjectVisibility(str, enum.Enum):
    open = "open"
    invite = "invite"

class MembershipRole(str, enum.Enum):
    lead = "lead"
    member = "member"

class TaskStatus(str, enum.Enum):
    todo = "todo"
    in_progress = "in_progress"
    blocked = "blocked"
    done = "done"

class TaskPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"

class ResourceType(str, enum.Enum):
    file = "file"
    link = "link"

class ResourceTag(str, enum.Enum):
    doc = "doc"
    link = "link"
    code = "code"
    design = "design"

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(200))
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole), default=UserRole.user)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    projects: Mapped[List["Project"]] = relationship(back_populates="creator")
    memberships: Mapped[List["Membership"]] = relationship(back_populates="user")
    tasks_assigned: Mapped[List["Task"]] = relationship(back_populates="assignee")
    comments: Mapped[List["Comment"]] = relationship(back_populates="user")
    resources_uploaded: Mapped[List["Resource"]] = relationship(back_populates="uploaded_by_user")
    contributions: Mapped[List["Contribution"]] = relationship(back_populates="user")


class Project(Base):
    __tablename__ = "projects"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    description: Mapped[str] = mapped_column(String)
    status: Mapped[ProjectStatus] = mapped_column(SQLEnum(ProjectStatus), default=ProjectStatus.active)
    visibility: Mapped[ProjectVisibility] = mapped_column(SQLEnum(ProjectVisibility), default=ProjectVisibility.open)
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    creator: Mapped["User"] = relationship(back_populates="projects")
    memberships: Mapped[List["Membership"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    tasks: Mapped[List["Task"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    resources: Mapped[List["Resource"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    contributions: Mapped[List["Contribution"]] = relationship(back_populates="project", cascade="all, delete-orphan")


class Membership(Base):
    __tablename__ = "memberships"
    __table_args__ = (UniqueConstraint("user_id", "project_id", name="uq_user_project"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    role: Mapped[MembershipRole] = mapped_column(SQLEnum(MembershipRole), default=MembershipRole.member)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    user: Mapped["User"] = relationship(back_populates="memberships")
    project: Mapped["Project"] = relationship(back_populates="memberships")


class Task(Base):
    __tablename__ = "tasks"
    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(String)
    assignee_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[TaskStatus] = mapped_column(SQLEnum(TaskStatus), default=TaskStatus.todo)
    priority: Mapped[TaskPriority] = mapped_column(SQLEnum(TaskPriority), default=TaskPriority.medium)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    parent_task_id: Mapped[Optional[int]] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    project: Mapped["Project"] = relationship(back_populates="tasks")
    assignee: Mapped[Optional["User"]] = relationship(back_populates="tasks_assigned")
    parent_task: Mapped[Optional["Task"]] = relationship(back_populates="subtasks", remote_side=[id])
    subtasks: Mapped[List["Task"]] = relationship(back_populates="parent_task")
    comments: Mapped[List["Comment"]] = relationship(back_populates="task", cascade="all, delete-orphan")
    contributions: Mapped[List["Contribution"]] = relationship(back_populates="task", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"
    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    content: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    task: Mapped["Task"] = relationship(back_populates="comments")
    user: Mapped["User"] = relationship(back_populates="comments")


class Resource(Base):
    __tablename__ = "resources"
    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    uploaded_by: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    type: Mapped[ResourceType] = mapped_column(SQLEnum(ResourceType))
    location: Mapped[str] = mapped_column(String(500))
    title: Mapped[str] = mapped_column(String(200))
    tag: Mapped[ResourceTag] = mapped_column(SQLEnum(ResourceTag))
    added_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    project: Mapped["Project"] = relationship(back_populates="resources")
    uploaded_by_user: Mapped[Optional["User"]] = relationship(back_populates="resources_uploaded")


class Contribution(Base):
    __tablename__ = "contributions"
    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    task_id: Mapped[Optional[int]] = mapped_column(ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    description: Mapped[str] = mapped_column(String)
    logged_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    project: Mapped["Project"] = relationship(back_populates="contributions")
    user: Mapped["User"] = relationship(back_populates="contributions")
    task: Mapped[Optional["Task"]] = relationship(back_populates="contributions")
