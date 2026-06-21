"""
Seed sample collection/folder/requests for the admin user (user_id 1).

Usage:
    DATABASE_URL=postgresql://apistudio:apistudio@localhost:5432/apistudio \
        python scripts/seed_data.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal  # noqa: E402
from app.models.collection import Collection, Folder  # noqa: E402
from app.models.request import Request  # noqa: E402

ADMIN_USER_ID = 1


def seed():
    db = SessionLocal()
    try:
        collection = Collection(
            name="Sample REST API",
            description="Example requests",
            owner_id=ADMIN_USER_ID,
        )
        db.add(collection)
        db.flush()

        folder = Folder(name="Users", collection_id=collection.id)
        db.add(folder)
        db.flush()

        db.add(Request(
            name="Get All Users",
            method="GET",
            url="https://jsonplaceholder.typicode.com/users",
            headers=[],
            params=[],
            collection_id=collection.id,
            folder_id=folder.id,
        ))

        db.add(Request(
            name="Get User by ID",
            method="GET",
            url="https://jsonplaceholder.typicode.com/users/1",
            headers=[],
            params=[],
            collection_id=collection.id,
            folder_id=folder.id,
        ))

        db.add(Request(
            name="Create User",
            method="POST",
            url="https://jsonplaceholder.typicode.com/users",
            headers=[{"key": "Content-Type", "value": "application/json", "enabled": True}],
            params=[],
            body_type="raw",
            body_content=json.dumps({"name": "Jane Doe", "email": "jane@example.com"}, indent=2),
            collection_id=collection.id,
            folder_id=folder.id,
        ))

        db.add(Request(
            name="Test GET",
            method="GET",
            url="https://httpbin.org/get",
            headers=[],
            params=[],
            collection_id=collection.id,
            folder_id=None,
        ))

        db.commit()
        print(f"Seeded collection '{collection.name}' (id={collection.id}) with folder '{folder.name}' and 4 requests.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
