from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserOut
from app.core.dependencies import get_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=List[UserOut])
def get_users(db: Session = Depends(get_db), _=Depends(get_admin_user)):
    return db.query(User).all()


@router.patch("/users/{user_id}/toggle")
def toggle_user(user_id: int, db: Session = Depends(get_db), _=Depends(get_admin_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"active": user.is_active}


@router.patch("/users/{user_id}/make-admin")
def make_admin(user_id: int, db: Session = Depends(get_db), _=Depends(get_admin_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.is_admin = True
    db.commit()
    return {"message": "User promoted to admin"}
