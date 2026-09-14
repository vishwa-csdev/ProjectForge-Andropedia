from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from database import get_db
from models import Contribution, Project, Membership, User
from schemas import ContributionCreate, ContributionResponse
from auth import get_current_user

router = APIRouter(tags=["Contributions"])

class ContributionListResponse(ContributionResponse):
    user_name: str
    task_title: Optional[str] = None

class ContributionSummary(BaseModel):
    user_id: int
    user_name: str
    count: int
    latest_at: Optional[datetime]

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

@router.get("/{project_id}/contributions", response_model=List[ContributionListResponse])
async def list_contributions(
    project_id: int,
    user_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await _check_membership(project_id, current_user, db)
    
    query = select(Contribution).options(
        selectinload(Contribution.user),
        selectinload(Contribution.task)
    ).where(Contribution.project_id == project_id)
    if user_id:
        query = query.where(Contribution.user_id == user_id)
        
    query = query.order_by(desc(Contribution.logged_at))
    
    result = await db.execute(query)
    contributions = result.scalars().all()
    
    response = []
    for c in contributions:
        c_dict = {
            "id": c.id, "project_id": c.project_id, "user_id": c.user_id,
            "task_id": c.task_id, "description": c.description, "logged_at": c.logged_at,
            "user_name": c.user.name if c.user else "Unknown",
            "task_title": c.task.title if c.task else None
        }
        response.append(c_dict)
        
    return response

@router.get("/{project_id}/contributions/summary", response_model=List[ContributionSummary])
async def get_contributions_summary(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await _check_membership(project_id, current_user, db)
    
    # Get all members
    mem_result = await db.execute(
        select(Membership).options(selectinload(Membership.user)).where(Membership.project_id == project_id)
    )
    memberships = mem_result.scalars().all()
    
    # Get contribution stats
    stats_result = await db.execute(
        select(
            Contribution.user_id,
            func.count(Contribution.id).label("count"),
            func.max(Contribution.logged_at).label("latest_at")
        )
        .where(Contribution.project_id == project_id)
        .group_by(Contribution.user_id)
    )
    stats_rows = stats_result.all()
    
    stats_dict = {row.user_id: {"count": row.count, "latest_at": row.latest_at} for row in stats_rows}
    
    summary = []
    for m in memberships:
        user_stats = stats_dict.get(m.user_id, {"count": 0, "latest_at": None})
        summary.append({
            "user_id": m.user_id,
            "user_name": m.user.name if m.user else "Unknown",
            "count": user_stats["count"],
            "latest_at": user_stats["latest_at"]
        })
        
    return summary

@router.post("/{project_id}/contributions", response_model=ContributionResponse, status_code=status.HTTP_201_CREATED)
async def log_contribution(
    project_id: int,
    contribution_in: ContributionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await _check_membership(project_id, current_user, db)
    
    new_contribution = Contribution(
        project_id=project_id,
        user_id=current_user.id,
        task_id=contribution_in.task_id,
        description=contribution_in.description
    )
    db.add(new_contribution)
    await db.commit()
    await db.refresh(new_contribution)
    return new_contribution

@router.delete("/{project_id}/contributions/{contribution_id}")
async def delete_contribution(
    project_id: int,
    contribution_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await _check_membership(project_id, current_user, db)
    
    result = await db.execute(
        select(Contribution).where(and_(Contribution.id == contribution_id, Contribution.project_id == project_id))
    )
    contribution = result.scalar_one_or_none()
    
    if not contribution:
        raise HTTPException(status_code=404, detail="Contribution not found")
        
    if contribution.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own contributions")
        
    await db.delete(contribution)
    await db.commit()
    return {"message": "Contribution deleted"}
