import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite:///./data/rakshadoc.db")

    DATA_DIR: str = "./data"
    UPLOAD_DIR: str = "./data/uploads"
    STORAGE_DIR: str = "./data/storage"
    MAX_UPLOAD_SIZE_MB: int = 25
    MAX_PAGES: int = 100
    ALLOWED_EXTENSIONS: str = "pdf,png,jpg,jpeg,tiff,tif,bmp,webp"

    DEMO_MODE: bool = True
    DEMO_SEED: int = 42

    FRONTEND_URL: str = "http://localhost:3000"
    # Both hostnames are listed because the Origin header mirrors whatever the
    # user typed. 127.0.0.1 is included so the loopback-IP form works too.
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    PUBLIC_BASE_URL: str = "http://localhost:3000"

    RETENTION_DAYS: int = 90

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

if not settings.SECRET_KEY:
    if settings.ENVIRONMENT == "development":
        settings.SECRET_KEY = "dev-secret-key-change-in-production"
    else:
        raise ValueError("SECRET_KEY must be set in production environment")

os.makedirs(settings.DATA_DIR, exist_ok=True)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
