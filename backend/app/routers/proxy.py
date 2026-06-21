from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import httpx
import time
from app.database import get_db
from app.models.request import RequestLog
from app.models.user import User
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/proxy", tags=["proxy"])


@router.post("/send")
async def send_request(payload: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    method = payload.get("method", "GET")
    url = payload.get("url", "")
    headers = {h["key"]: h["value"] for h in payload.get("headers", []) if h.get("enabled", True)}
    params = {p["key"]: p["value"] for p in payload.get("params", []) if p.get("enabled", True)}
    body = payload.get("body", None)
    body_type = payload.get("body_type", "none")
    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(method, url, headers=headers, params=params, content=body)
        elapsed = int((time.time() - start) * 1000)
        log = RequestLog(
            user_id=user.id,
            request_id=payload.get("request_id"),
            method=method,
            url=url,
            headers=payload.get("headers", []),
            params=payload.get("params", []),
            body_type=body_type,
            body_content=body or "",
            status_code=response.status_code,
            response_time_ms=elapsed,
            response_size_bytes=len(response.content),
            response_body_preview=response.text[:500],
        )
        db.add(log)
        db.commit()
        return {
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "body": response.text,
            "time_ms": elapsed,
            "size_bytes": len(response.content)
        }
    except Exception as e:
        return {"error": str(e)}
