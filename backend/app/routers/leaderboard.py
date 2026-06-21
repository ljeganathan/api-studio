from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.request import RequestLog
from app.models.user import User
from app.core.dependencies import get_admin_user

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("/top-users")
def top_users(db: Session = Depends(get_db), _=Depends(get_admin_user)):
    rows = db.query(User.username, func.count(RequestLog.id).label("count")) \
             .join(RequestLog, User.id == RequestLog.user_id) \
             .group_by(User.username).order_by(func.count(RequestLog.id).desc()).limit(10).all()
    return [{"username": r.username, "count": r.count} for r in rows]


@router.get("/method-stats")
def method_stats(db: Session = Depends(get_db), _=Depends(get_admin_user)):
    rows = db.query(RequestLog.method, func.count(RequestLog.id).label("count")) \
             .group_by(RequestLog.method).all()
    return [{"method": r.method, "count": r.count} for r in rows]


@router.get("/daily-trends")
def daily_trends(db: Session = Depends(get_db), _=Depends(get_admin_user)):
    rows = db.query(func.date(RequestLog.created_at).label("date"), func.count(RequestLog.id).label("count")) \
             .group_by(func.date(RequestLog.created_at)).order_by(func.date(RequestLog.created_at).desc()).limit(30).all()
    return [{"date": str(r.date), "count": r.count} for r in rows]
