from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional
from database import get_db
from models import Project, Membership, User, Task, ProjectStatus, ProjectVisibility, MembershipRole, UserRole, TaskStatus
from schemas import ProjectCreate, ProjectUpdate, ProjectResponse, MembershipResponse, UserResponse
from auth import get_current_user
from pydantic import BaseModel, ConfigDict
from datetime import datetime

router = APIRouter(tags=["Projects"])

class ProjectListResponse(ProjectResponse):
    member_count: int
    task_count: int
    progress: float

class ProjectMember(BaseModel):
    id: int
    name: str
    email: str
    role: MembershipRole
    model_config = ConfigDict(from_attributes=True)

class ProjectDetailResponse(ProjectResponse):
    members: List[ProjectMember]
    progress: float
    model_config = ConfigDict(from_attributes=True)

@router.get("", response_model=List[ProjectListResponse])
@router.get("/", response_model=List[ProjectListResponse])
async def list_projects(
    filter: Optional[str] = Query(None, description="Filter: all, my, archived"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Project)
    
    if filter == "my":
        query = query.join(Membership).where(Membership.user_id == current_user.id)
    elif filter == "archived":
        query = query.where(Project.status == ProjectStatus.archived)
    else:
        query = query.where(Project.status == ProjectStatus.active)
        
    result = await db.execute(query)
    projects = result.scalars().all()
    
    response = []
    for p in projects:
        # Calculate stats
        mem_res = await db.execute(select(func.count()).select_from(Membership).where(Membership.project_id == p.id))
        member_count = mem_res.scalar() or 0
        
        task_res = await db.execute(select(Task.status).where(Task.project_id == p.id))
        tasks = task_res.scalars().all()
        task_count = len(tasks)
        done_count = sum(1 for t in tasks if t == TaskStatus.done)
        progress = (done_count / task_count * 100.0) if task_count > 0 else 0.0
        
        response.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "status": p.status,
            "visibility": p.visibility,
            "deadline": p.deadline,
            "created_by": p.created_by,
            "created_at": p.created_at,
            "member_count": member_count,
            "task_count": task_count,
            "progress": round(progress, 2)
        })
        
    return response

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_project = Project(
        name=project_in.name,
        description=project_in.description,
        status=project_in.status,
        visibility=project_in.visibility,
        deadline=project_in.deadline,
        created_by=current_user.id
    )
    db.add(new_project)
    await db.flush() # flush to get project.id
    
    membership = Membership(
        user_id=current_user.id,
        project_id=new_project.id,
        role=MembershipRole.lead
    )
    db.add(membership)
    await db.commit()
    await db.refresh(new_project)
    return new_project

@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(project_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.memberships).joinedload(Membership.user))
        .where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    task_res = await db.execute(select(Task.status).where(Task.project_id == project.id))
    tasks = task_res.scalars().all()
    task_count = len(tasks)
    done_count = sum(1 for t in tasks if t == TaskStatus.done)
    progress = (done_count / task_count * 100.0) if task_count > 0 else 0.0
    
    members = []
    for m in project.memberships:
        members.append({
            "id": m.user.id,
            "name": m.user.name,
            "email": m.user.email,
            "role": m.role
        })
        
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "visibility": project.visibility,
        "deadline": project.deadline,
        "created_by": project.created_by,
        "created_at": project.created_at,
        "members": members,
        "progress": round(progress, 2)
    }

async def _check_project_permission(project_id: int, user: User, db: AsyncSession) -> Project:
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if user.role == UserRole.admin:
        return project
        
    mem_result = await db.execute(
        select(Membership).where(and_(Membership.project_id == project_id, Membership.user_id == user.id))
    )
    membership = mem_result.scalar_one_or_none()
    if not membership or membership.role != MembershipRole.lead:
        raise HTTPException(status_code=403, detail="Not authorized. Lead role required.")
        
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await _check_project_permission(project_id, current_user, db)
    
    update_data = project_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)
        
    await db.commit()
    await db.refresh(project)
    return project

@router.post("/{project_id}/join", response_model=MembershipResponse)
async def join_project(project_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if project.visibility != ProjectVisibility.open:
        raise HTTPException(status_code=403, detail="Project is not open to join")
        
    mem_result = await db.execute(
        select(Membership).where(and_(Membership.project_id == project_id, Membership.user_id == current_user.id))
    )
    existing_mem = mem_result.scalar_one_or_none()
    if existing_mem:
        raise HTTPException(status_code=409, detail="Already a member")
        
    membership = Membership(
        user_id=current_user.id,
        project_id=project_id,
        role=MembershipRole.member
    )
    db.add(membership)
    await db.commit()
    await db.refresh(membership)
    return membership

@router.post("/{project_id}/leave")
async def leave_project(project_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    mem_result = await db.execute(
        select(Membership).where(and_(Membership.project_id == project_id, Membership.user_id == current_user.id))
    )
    membership = mem_result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=404, detail="Not a member")
        
    await db.delete(membership)
    await db.commit()
    return {"message": "Left project"}

@router.delete("/{project_id}/members/{user_id}")
async def remove_member(
    project_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await _check_project_permission(project_id, current_user, db)
    
    mem_result = await db.execute(
        select(Membership).where(and_(Membership.project_id == project_id, Membership.user_id == user_id))
    )
    membership = mem_result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found")
        
    await db.delete(membership)
    await db.commit()
    return {"message": "Member removed"}

class UpdateRoleRequest(BaseModel):
    role: MembershipRole

class AddMemberRequest(BaseModel):
    user_id: int
    role: Optional[MembershipRole] = MembershipRole.member

@router.put("/{project_id}/members/{user_id}/role", response_model=MembershipResponse)
async def update_member_role(
    project_id: int,
    user_id: int,
    req: UpdateRoleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await _check_project_permission(project_id, current_user, db)
    
    mem_result = await db.execute(
        select(Membership).where(and_(Membership.project_id == project_id, Membership.user_id == user_id))
    )
    membership = mem_result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found in this project")
        
    # Safeguard: If demoting a lead, ensure there is at least one other lead
    if membership.role == MembershipRole.lead and req.role != MembershipRole.lead:
        leads_res = await db.execute(
            select(func.count(Membership.id)).where(
                and_(Membership.project_id == project_id, Membership.role == MembershipRole.lead)
            )
        )
        lead_count = leads_res.scalar() or 0
        if lead_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot demote the only Lead. Assign another Lead first.")
            
    membership.role = req.role
    await db.commit()
    await db.refresh(membership)
    return membership

@router.post("/{project_id}/members", response_model=MembershipResponse, status_code=status.HTTP_201_CREATED)
async def add_member(
    project_id: int,
    req: AddMemberRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await _check_project_permission(project_id, current_user, db)
    
    user_res = await db.execute(select(User).where(User.id == req.user_id))
    user_to_add = user_res.scalar_one_or_none()
    if not user_to_add:
        raise HTTPException(status_code=404, detail="User does not exist")
        
    mem_result = await db.execute(
        select(Membership).where(and_(Membership.project_id == project_id, Membership.user_id == req.user_id))
    )
    existing_mem = mem_result.scalar_one_or_none()
    if existing_mem:
        raise HTTPException(status_code=409, detail="User is already a member of this project")
        
    new_mem = Membership(
        user_id=req.user_id,
        project_id=project_id,
        role=req.role or MembershipRole.member
    )
    db.add(new_mem)
    await db.commit()
    await db.refresh(new_mem)
    return new_mem
