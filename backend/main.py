import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import engine, Base, get_db
from models import User
from auth import get_current_user
from config import settings

from routers.auth_router import router as auth_router
from routers.projects_router import router as projects_router
from routers.tasks_router import router as tasks_router
from routers.resources_router import router as resources_router
from routers.contributions_router import router as contributions_router
from routers.reports_router import router as reports_router
from routers.dashboard_router import router as dashboard_router
from routers.admin_router import router as admin_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    session_cookie="session",
    max_age=14 * 24 * 60 * 60,  # 14 days
    same_site="lax",
    https_only=not settings.DEV_MODE,
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
assets_dir = os.path.join(frontend_dist, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

app.include_router(auth_router, prefix="/api/auth")
app.include_router(projects_router, prefix="/api/projects")
app.include_router(tasks_router, prefix="/api/projects")
app.include_router(resources_router, prefix="/api/projects")
app.include_router(contributions_router, prefix="/api/projects")
app.include_router(reports_router, prefix="/api/projects")
app.include_router(dashboard_router, prefix="/api/dashboard")
app.include_router(admin_router, prefix="/api/admin")

@app.get("/api/users")
async def get_all_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).order_by(User.name))
    users = result.scalars().all()
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role} for u in users]

@app.api_route("/api/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def catch_all_api(path_name: str):
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="API route not found")

@app.get("/")
@app.get("/{path_name:path}")
async def catch_all_spa(path_name: str = ""):
    if path_name.startswith("api/") or path_name == "api":
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="API route not found")
        
    if path_name:
        file_path = os.path.join(frontend_dist, path_name)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
    index_file = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return HTMLResponse("<h1>Frontend not built yet</h1>")
