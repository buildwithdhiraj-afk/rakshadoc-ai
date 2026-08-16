import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "rakshadoc-secret-key-change-in-production-2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    DATABASE_URL: str = "sqlite:///./data/rakshadoc.db"

    DATA_DIR: str = "./data"
    UPLOAD_DIR: str = "./data/uploads"
    STORAGE_DIR: str = "./data/storage"
    MAX_UPLOAD_SIZE_MB: int = 25
    MAX_PAGES: int = 100
    ALLOWED_EXTENSIONS: str = "pdf,png,jpg,jpeg,tiff,tif,bmp,webp"

    DEMO_MODE: bool = True
    DEMO_SEED: int = 42

    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: str = "http://localhost:3000"
    PUBLIC_BASE_URL: str = "http://localhost:3000"

    RETENTION_DAYS: int = 90

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

os.makedirs(settings.DATA_DIR, exist_ok=True)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
