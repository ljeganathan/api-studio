from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.collection import Collection
from app.models.user import User
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/collections", tags=["collections"])


@router.get("")
def list_collections(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Collection).filter(Collection.owner_id == user.id).order_by(Collection.order_index).all()


@router.post("")
def create_collection(payload: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    col = Collection(name=payload.get("name", "New Collection"), description=payload.get("description", ""), owner_id=user.id)
    db.add(col)
    db.commit()
    db.refresh(col)
    return col


@router.put("/{collection_id}")
def update_collection(collection_id: int, payload: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    col = db.query(Collection).filter(Collection.id == collection_id, Collection.owner_id == user.id).first()
    if not col:
        raise HTTPException(404, "Collection not found")
    if "name" in payload:
        col.name = payload["name"]
    if "description" in payload:
        col.description = payload["description"]
    db.commit()
    db.refresh(col)
    return col


@router.delete("/{collection_id}")
def delete_collection(collection_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    col = db.query(Collection).filter(Collection.id == collection_id, Collection.owner_id == user.id).first()
    if not col:
        raise HTTPException(404, "Collection not found")
    db.delete(col)
    db.commit()
    return {"message": "Deleted"}


@router.patch("/reorder")
def reorder_collections(payload: list[dict], db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    for item in payload:
        col = db.query(Collection).filter(Collection.id == item["id"], Collection.owner_id == user.id).first()
        if col:
            col.order_index = item["order_index"]
    db.commit()
    return {"message": "Reordered"}
