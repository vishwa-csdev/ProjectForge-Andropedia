from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
import os
import uuid
import mimetypes
from pydantic import BaseModel, ConfigDict
from database import get_db
from models import Resource, Project, Membership, User, MembershipRole, ResourceType, ResourceTag
from schemas import ResourceResponse
from auth import get_current_user
from config import settings

router = APIRouter(tags=["Resources"])

class ResourceUploader(BaseModel):
    id: int
    name: str

class ResourceListResponse(ResourceResponse):
    uploader: Optional[ResourceUploader] = None

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

@router.get("/{project_id}/resources", response_model=List[ResourceListResponse])
async def list_resources(
    project_id: int,
    tag: Optional[ResourceTag] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await _check_membership(project_id, current_user, db)
    
    query = select(Resource).options(selectinload(Resource.uploaded_by_user)).where(Resource.project_id == project_id)
    if tag:
        query = query.where(Resource.tag == tag)
        
    result = await db.execute(query)
    resources = result.scalars().all()
    
    response = []
    for r in resources:
        uploader_data = None
        if r.uploaded_by_user:
            uploader_data = ResourceUploader(id=r.uploaded_by_user.id, name=r.uploaded_by_user.name)
            
        r_dict = {
            "id": r.id, "project_id": r.project_id, "uploaded_by": r.uploaded_by,
            "type": r.type, "location": r.location, "title": r.title, "tag": r.tag,
            "added_at": r.added_at, "uploader": uploader_data
        }
        response.append(r_dict)
        
    return response

@router.post("/{project_id}/resources", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def add_resource(
    project_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await _check_membership(project_id, current_user, db)
    
    content_type = request.headers.get("content-type", "")
    
    if "application/json" in content_type:
        data = await request.json()
        r_type = data.get("type")
        location = data.get("location")
        title = data.get("title")
        tag = data.get("tag")
        
        if r_type != "link":
            raise HTTPException(status_code=400, detail="JSON body is only supported for link types")
        if not location or not title or not tag:
            raise HTTPException(status_code=400, detail="Missing required fields")
            
        new_resource = Resource(
            project_id=project_id,
            uploaded_by=current_user.id,
            type=ResourceType(r_type),
            location=location,
            title=title,
            tag=ResourceTag(tag)
        )
    elif "multipart/form-data" in content_type:
        form = await request.form()
        file_obj = form.get("file")
        r_type = form.get("type") or ("file" if file_obj else None)
        title = form.get("title") or (getattr(file_obj, "filename", None) if file_obj else None)
        tag = form.get("tag") or "doc"
        
        if not r_type or not title:
            raise HTTPException(status_code=400, detail="Missing required form fields (type, title)")
            
        if r_type == "link":
            location = form.get("location")
            if not location:
                raise HTTPException(status_code=400, detail="Location required for link")
                
            new_resource = Resource(
                project_id=project_id,
                uploaded_by=current_user.id,
                type=ResourceType.link,
                location=location,
                title=title,
                tag=ResourceTag(tag)
            )
        else:
            file: UploadFile = file_obj
            if not file:
                raise HTTPException(status_code=400, detail="File required for file type")
                
            content = await file.read()
            if len(content) > 25 * 1024 * 1024:
                raise HTTPException(status_code=413, detail="File too large (max 25MB)")
                
            safe_filename = file.filename.replace(" ", "_") if file.filename else "upload.bin"
            unique_filename = f"{uuid.uuid4()}_{safe_filename}"
            filepath = os.path.join(settings.UPLOAD_DIR, unique_filename)
            
            with open(filepath, "wb") as f:
                f.write(content)
                
            new_resource = Resource(
                project_id=project_id,
                uploaded_by=current_user.id,
                type=ResourceType.file,
                location=filepath,
                title=title,
                tag=ResourceTag(tag)
            )
    else:
        raise HTTPException(status_code=415, detail="Unsupported Media Type")
        
    db.add(new_resource)
    await db.commit()
    await db.refresh(new_resource)
    return new_resource

@router.get("/{project_id}/resources/{resource_id}/download")
async def download_resource(
    project_id: int,
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from fastapi.responses import FileResponse
    await _check_membership(project_id, current_user, db)
    result = await db.execute(select(Resource).where(and_(Resource.id == resource_id, Resource.project_id == project_id)))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if resource.type != ResourceType.file:
        raise HTTPException(status_code=400, detail="Resource is not a file")
    if not os.path.exists(resource.location):
        raise HTTPException(status_code=404, detail="File not found on disk")
        
    filename = os.path.basename(resource.location)
    if "_" in filename:
        download_name = filename.split("_", 1)[1]
    else:
        download_name = resource.title or filename
        
    return FileResponse(
        resource.location,
        filename=download_name,
        media_type=mimetypes.guess_type(download_name)[0] or "application/octet-stream",
        content_disposition_type="inline",
    )

@router.delete("/{project_id}/resources/{resource_id}")
async def delete_resource(
    project_id: int,
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    membership = await _check_membership(project_id, current_user, db)
    if membership.role != MembershipRole.lead and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete resources")
        
    result = await db.execute(select(Resource).where(and_(Resource.id == resource_id, Resource.project_id == project_id)))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    if resource.type == ResourceType.file and os.path.exists(resource.location):
        try:
            os.remove(resource.location)
        except OSError:
            pass
            
    await db.delete(resource)
    await db.commit()
    return {"message": "Resource deleted"}
