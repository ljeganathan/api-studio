from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.request import Request
from app.models.collection import Collection
from app.models.user import User
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/requests", tags=["requests"])


def _owned_collection_or_404(db, collection_id, user):
    col = db.query(Collection).filter(Collection.id == collection_id, Collection.owner_id == user.id).first()
    if not col:
        raise HTTPException(404, "Collection not found")
    return col


@router.get("")
def list_requests(collection_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _owned_collection_or_404(db, collection_id, user)
    return db.query(Request).filter(Request.collection_id == collection_id).order_by(Request.order_index).all()


@router.get("/{request_id}")
def get_request(request_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    req = db.query(Request).join(Collection).filter(Request.id == request_id, Collection.owner_id == user.id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    return req


@router.post("")
def create_request(payload: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _owned_collection_or_404(db, payload["collection_id"], user)
    req = Request(
        name=payload.get("name", "New Request"),
        method=payload.get("method", "GET"),
        url=payload.get("url", ""),
        headers=payload.get("headers", []),
        params=payload.get("params", []),
        body_type=payload.get("body_type", "none"),
        body_content=payload.get("body_content", ""),
        auth_type=payload.get("auth_type", "none"),
        auth_data=payload.get("auth_data", {}),
        collection_id=payload["collection_id"],
        folder_id=payload.get("folder_id"),
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.put("/{request_id}")
def update_request(request_id: int, payload: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    req = db.query(Request).join(Collection).filter(Request.id == request_id, Collection.owner_id == user.id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    for field in ("name", "method", "url", "headers", "params", "body_type", "body_content", "auth_type", "auth_data", "folder_id"):
        if field in payload:
            setattr(req, field, payload[field])
    db.commit()
    db.refresh(req)
    return req


@router.delete("/{request_id}")
def delete_request(request_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    req = db.query(Request).join(Collection).filter(Request.id == request_id, Collection.owner_id == user.id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    db.delete(req)
    db.commit()
    return {"message": "Deleted"}


@router.patch("/reorder")
def reorder_requests(payload: list[dict], db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    for item in payload:
        req = db.query(Request).join(Collection).filter(Request.id == item["id"], Collection.owner_id == user.id).first()
        if req:
            req.order_index = item["order_index"]
    db.commit()
    return {"message": "Reordered"}
