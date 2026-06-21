from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import verify_password, hash_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(400, "Email already registered")
    user = User(email=payload.email, username=payload.username, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User created", "id": user.id}


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token({"sub": str(user.id), "is_admin": user.is_admin})
    return {"access_token": token, "token_type": "bearer", "username": user.username, "is_admin": user.is_admin}
