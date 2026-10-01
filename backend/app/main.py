import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal, run_lightweight_migrations
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_lightweight_migrations()
    if settings.ENVIRONMENT == "development":
        db = SessionLocal()
        try:
            dev_password = "RakshaDoc!Dev1"
            dev_accounts = [
                ("user@rakshadoc.dev", "Demo Normal User", "user"),
                ("admin@rakshadoc.dev", "Demo Admin User", "admin"),
            ]
            created = []
            for dev_email, dev_name, dev_role in dev_accounts:
                if db.query(User).filter_by(email=dev_email).first():
                    continue
                db.add(User(
                    email=dev_email,
                    hashed_password=hash_password(dev_password),
                    full_name=dev_name,
                    role=dev_role
                ))
                created.append(dev_email)
            if created:
                db.commit()
                logger.info(
                    f"Dev users created: {' / '.join(created)} "
                    f"(password: {dev_password}) — change these outside development"
                )
        finally:
            db.close()
    yield

app = FastAPI(
    title="RakshaDoc AI Backend",
    description="Secure and Accessible AI-Powered Document Intelligence for Multilingual Indian Documents",
    version="1.0.0",
    lifespan=lifespan,
)

# Middleware
app.add_middleware(SecurityHeadersMiddleware)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Register Routers under /api
app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(verify_router, prefix="/api")
app.include_router(admin_router, prefix="/api")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "code": "INTERNAL_SERVER_ERROR"}
    )