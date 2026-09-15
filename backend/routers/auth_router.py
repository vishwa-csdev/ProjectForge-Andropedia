import asyncio
import smtplib
from email.message import EmailMessage

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import User, UserRole
from schemas import UserCreate, UserResponse, LoginRequest
from auth import hash_password, verify_password, get_current_user
from config import settings
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from typing import Optional, List
from pydantic import BaseModel

router = APIRouter(tags=["Auth"])

class UserUpdate(BaseModel):
    name: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

reset_serializer = URLSafeTimedSerializer(settings.SECRET_KEY)

async def send_recovery_email(recipient: str, recovery_link: str):
    if not settings.SMTP_HOST:
        return

    def deliver():
        message = EmailMessage()
        message["Subject"] = "Andropedia Hub password recovery"
        message["From"] = settings.SMTP_FROM or settings.SMTP_USER
        message["To"] = recipient
        message.set_content(f"Use this link within one hour to reset your password:\n\n{recovery_link}")
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
            smtp.starttls()
            if settings.SMTP_USER:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(message)

    await asyncio.to_thread(deliver)

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(request: Request, user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_in.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    
    hashed_pwd = hash_password(user_in.password)
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hashed_pwd,
        role=UserRole.user
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    request.session["user_id"] = new_user.id
    return new_user

@router.post("/login", response_model=UserResponse)
async def login(request: Request, login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        
    request.session["user_id"] = user.id
    return user

@router.post("/admin-login", response_model=UserResponse)
async def admin_login(request: Request, login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()

    if not user or user.role != UserRole.admin or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid administrator credentials")

    request.session["user_id"] = user.id
    return user

@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    response = {"message": "If that email is registered, recovery instructions have been generated."}

    if user:
        token = reset_serializer.dumps({"user_id": user.id, "email": user.email}, salt="password-reset")
        recovery_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        print(f"Password recovery link for {user.email}: {recovery_link}")
        await send_recovery_email(user.email, recovery_link)
        if settings.DEV_MODE:
            response["recovery_link"] = recovery_link

    return response

@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    try:
        token_data = reset_serializer.loads(payload.token, salt="password-reset", max_age=3600)
    except (BadSignature, SignatureExpired):
        raise HTTPException(status_code=400, detail="Recovery token is invalid or expired")

    result = await db.execute(
        select(User).where(User.id == token_data.get("user_id"), User.email == token_data.get("email"))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Recovery token is invalid")

    user.password_hash = hash_password(payload.new_password)
    await db.commit()
    return {"message": "Password updated. You can now authenticate with the new passcode."}

@router.post("/logout")
async def logout(request: Request):
    request.session.clear()
    return {"message": "Logged out"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_me(update_data: UserUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if update_data.name is not None:
        current_user.name = update_data.name
        
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.get("/users", response_model=List[UserResponse])
async def list_users(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.name))
    return result.scalars().all()
