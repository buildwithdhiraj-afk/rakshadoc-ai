import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.middleware import SecurityHeadersMiddleware
from app.models import User
from app.core.security import hash_password

from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.verify import router as verify_router
from app.api.admin import router as admin_router
from app.api.health import router as health_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rakshadoc")

app = FastAPI(
    title="RakshaDoc AI Backend",
    description="Secure and Accessible AI-Powered Document Intelligence for Multilingual Indian Documents",
    version="1.0.0"
)

# Middleware
app.add_middleware(SecurityHeadersMiddleware)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers under /api
app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(verify_router, prefix="/api")
app.include_router(admin_router, prefix="/api")

@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    if settings.ENVIRONMENT == "development":
        db = SessionLocal()
        try:
            if db.query(User).count() == 0:
                logger.info("Seeding initial development users...")
                dev_user = User(
                    email="user@rakshadoc.local",
                    hashed_password=hash_password("user12345"),
                    full_name="Demo Normal User",
                    role="user"
                )
                dev_admin = User(
                    email="admin@rakshadoc.local",
                    hashed_password=hash_password("admin12345"),
                    full_name="Demo Admin User",
                    role="admin"
                )
                db.add(dev_user)
                db.add(dev_admin)
                db.commit()
                logger.info("Dev users created: user@rakshadoc.local / user12345, admin@rakshadoc.local / admin12345")
        finally:
            db.close()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "code": "INTERNAL_SERVER_ERROR"}
    )
