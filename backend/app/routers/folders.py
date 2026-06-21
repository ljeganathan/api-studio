from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.collection import Folder, Collection
from app.models.user import User
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/folders", tags=["folders"])


def _owned_collection_or_404(db, collection_id, user):
    col = db.query(Collection).filter(Collection.id == collection_id, Collection.owner_id == user.id).first()
    if not col:
        raise HTTPException(404, "Collection not found")
    return col


@router.get("")
def list_folders(collection_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _owned_collection_or_404(db, collection_id, user)
    return db.query(Folder).filter(Folder.collection_id == collection_id).order_by(Folder.order_index).all()


@router.post("")
def create_folder(payload: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _owned_collection_or_404(db, payload["collection_id"], user)
    folder = Folder(
        name=payload.get("name", "New Folder"),
        collection_id=payload["collection_id"],
        parent_folder_id=payload.get("parent_folder_id"),
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


@router.put("/{folder_id}")
def update_folder(folder_id: int, payload: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    folder = db.query(Folder).join(Collection).filter(Folder.id == folder_id, Collection.owner_id == user.id).first()
    if not folder:
        raise HTTPException(404, "Folder not found")
    if "name" in payload:
        folder.name = payload["name"]
    if "parent_folder_id" in payload:
        folder.parent_folder_id = payload["parent_folder_id"]
    db.commit()
    db.refresh(folder)
    return folder


@router.delete("/{folder_id}")
def delete_folder(folder_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    folder = db.query(Folder).join(Collection).filter(Folder.id == folder_id, Collection.owner_id == user.id).first()
    if not folder:
        raise HTTPException(404, "Folder not found")
    db.delete(folder)
    db.commit()
    return {"message": "Deleted"}


@router.patch("/reorder")
def reorder_folders(payload: list[dict], db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    for item in payload:
        folder = db.query(Folder).join(Collection).filter(Folder.id == item["id"], Collection.owner_id == user.id).first()
        if folder:
            folder.order_index = item["order_index"]
    db.commit()
    return {"message": "Reordered"}
