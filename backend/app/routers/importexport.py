from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import json

from app.database import get_db
from app.models.collection import Collection, Folder
from app.models.request import Request
from app.core.dependencies import get_current_user
from app.core.postman_converter import postman_to_internal, internal_to_postman
from app.models.user import User

router = APIRouter(prefix="/collections", tags=["import-export"])


def _persist_import(parsed: dict, db: Session) -> tuple:
    col = Collection(**parsed["collection"])
    db.add(col)
    db.flush()  # get col.id before inserting children

    folder_id_map = {}
    for f in parsed["folders"]:
        folder = Folder(name=f["name"], collection_id=col.id)
        db.add(folder)
        db.flush()
        folder_id_map[f["name"]] = folder.id

    request_count = 0
    for r in parsed["requests"]:
        r = dict(r)
        folder_name = r.pop("folder_name", None)
        folder_id = folder_id_map.get(folder_name) if folder_name else None
        db.add(Request(**r, collection_id=col.id, folder_id=folder_id))
        request_count += 1

    db.commit()
    return col, request_count


@router.post("/import")
async def import_collection(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Accept a Postman v2.1 JSON file upload and persist it as a new collection.
    Returns the created collection id and counts.
    """
    raw = await file.read()
    try:
        pm_json = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON file")

    if "info" not in pm_json or "item" not in pm_json:
        raise HTTPException(400, "File does not look like a Postman v2.1 collection")

    parsed = postman_to_internal(pm_json, user.id)
    col, request_count = _persist_import(parsed, db)

    return {
        "message": "Import successful",
        "collection_id": col.id,
        "collection_name": col.name,
        "folders_created": len(parsed["folders"]),
        "requests_created": request_count,
    }


@router.post("/import/json")
async def import_collection_json(
    payload: dict,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Accept a raw Postman JSON payload (for paste-import in the UI).
    Same logic as file import but reads from request body.
    """
    if "info" not in payload or "item" not in payload:
        raise HTTPException(400, "Invalid Postman collection JSON")

    parsed = postman_to_internal(payload, user.id)
    col, request_count = _persist_import(parsed, db)

    return {"collection_id": col.id, "collection_name": col.name, "requests_created": request_count}


@router.get("/{collection_id}/export")
def export_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Export a collection as a Postman v2.1 JSON response.
    The browser will receive it as a downloadable file.
    """
    col = db.query(Collection).filter(
        Collection.id == collection_id,
        Collection.owner_id == user.id
    ).first()
    if not col:
        raise HTTPException(404, "Collection not found")

    folders = db.query(Folder).filter(Folder.collection_id == collection_id).all()
    requests = db.query(Request).filter(Request.collection_id == collection_id).all()

    pm_json = internal_to_postman(col, folders, requests)

    filename = col.name.replace(" ", "_") + ".postman_collection.json"
    return JSONResponse(
        content=pm_json,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
