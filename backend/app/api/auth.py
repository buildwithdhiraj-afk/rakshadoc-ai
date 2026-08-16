import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_user_payload
from app.models import User
from app.schemas import UserRegister, UserLogin, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter_by(email=data.email).first():
        raise HTTPException(status_code=409, detail="User with this email already exists")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role="user"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role, "guest": False})
    return TokenResponse(
        token=token,
        user=UserOut(id=user.id, email=user.email, full_name=user.full_name, role=user.role)
    )

@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(email=data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.id, "role": user.role, "guest": False})
    return TokenResponse(
        token=token,
        user=UserOut(id=user.id, email=user.email, full_name=user.full_name, role=user.role)
    )

@router.post("/guest", response_model=TokenResponse)
def guest_login():
    guest_id = str(uuid.uuid4())
    token = create_access_token({"sub": guest_id, "role": "guest", "guest": True})
    return TokenResponse(
        token=token,
        user=UserOut(id=guest_id, email=f"guest_{guest_id[:6]}@rakshadoc.local", full_name="Guest User", role="guest")
    )

@router.get("/me", response_model=UserOut)
def get_me(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = payload.get("sub")
    if payload.get("guest"):
        return UserOut(id=user_id, email=f"guest_{user_id[:6]}@rakshadoc.local", full_name="Guest User", role="guest")

    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut(id=user.id, email=user.email, full_name=user.full_name, role=user.role)
