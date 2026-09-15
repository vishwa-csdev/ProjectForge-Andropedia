import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class Settings:
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite:///./andropedia.db")
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "dev-secret-key-fallback")
    UPLOAD_DIR: str = os.environ.get(
        "UPLOAD_DIR", "/tmp/andropedia-uploads" if os.environ.get("VERCEL") else "./uploads"
    )
    DEV_MODE: bool = os.environ.get("DEV_MODE", "true").lower() == "true"
    FRONTEND_URL: str = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    NEON_AUTH_JWKS_URL: str = os.environ.get("NEON_AUTH_JWKS_URL", "")
    SMTP_HOST: str = os.environ.get("SMTP_HOST", "")
    SMTP_PORT: int = int(os.environ.get("SMTP_PORT", "587"))
    SMTP_USER: str = os.environ.get("SMTP_USER", "")
    SMTP_PASSWORD: str = os.environ.get("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.environ.get("SMTP_FROM", "")

settings = Settings()

if settings.SECRET_KEY == "dev-secret-key-fallback":
    logger.warning("Using default dev fallback for SECRET_KEY. This is unsafe for production!")
