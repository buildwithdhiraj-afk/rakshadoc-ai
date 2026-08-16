import time
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["health"])

START_TIME = time.time()

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "demo_mode": settings.DEMO_MODE,
        "version": "1.0.0",
        "model_available": False,
        "uptime_s": round(time.time() - START_TIME, 1)
    }
