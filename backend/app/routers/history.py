from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.request import RequestLog
from app.models.user import User
from app.core.dependencies import get_current_user
import httpx
import time

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/")
def get_history(
    limit: int = Query(50, le=200),
    offset: int = 0,
    method: str = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Return paginated request history for the current user."""
    q = db.query(RequestLog).filter(RequestLog.user_id == user.id)
    if method:
        q = q.filter(RequestLog.method == method.upper())
    if search:
        q = q.filter(RequestLog.url.ilike(f"%{search}%"))
    total = q.count()
    items = q.order_by(desc(RequestLog.created_at)).offset(offset).limit(limit).all()
    return {"total": total, "items": items}


@router.delete("/")
def clear_history(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Delete all history entries for the current user."""
    db.query(RequestLog).filter(RequestLog.user_id == user.id).delete()
    db.commit()
    return {"message": "History cleared"}


@router.delete("/{log_id}")
def delete_history_item(log_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Delete a single history entry."""
    log = db.query(RequestLog).filter(RequestLog.id == log_id, RequestLog.user_id == user.id).first()
    if log:
        db.delete(log)
        db.commit()
    return {"message": "Deleted"}


@router.post("/{log_id}/replay")
async def replay_request(
    log_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Re-send the exact request stored in a history entry.
    Returns a fresh response and logs it as a new history entry.
    """
    log = db.query(RequestLog).filter(RequestLog.id == log_id, RequestLog.user_id == user.id).first()
    if not log:
        raise HTTPException(404, "History entry not found")

    headers = {h["key"]: h["value"] for h in (log.headers or []) if h.get("enabled", True)}
    params = {p["key"]: p["value"] for p in (log.params or []) if p.get("enabled", True)}
    body = log.body_content or None

    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.request(log.method, log.url, headers=headers, params=params, content=body)
        elapsed = int((time.time() - start) * 1000)

        new_log = RequestLog(
            user_id=user.id, request_id=log.request_id, method=log.method, url=log.url,
            headers=log.headers, params=log.params,
            body_type=log.body_type, body_content=log.body_content,
            status_code=resp.status_code, response_time_ms=elapsed,
            response_size_bytes=len(resp.content),
            response_body_preview=resp.text[:500]
        )
        db.add(new_log)
        db.commit()

        return {
            "status_code": resp.status_code,
            "headers": dict(resp.headers),
            "body": resp.text,
            "time_ms": elapsed,
            "size_bytes": len(resp.content)
        }
    except Exception as e:
        return {"error": str(e)}
