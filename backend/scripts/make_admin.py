"""
Promote a user to admin by email.

Usage:
    DATABASE_URL=postgresql://apistudio:apistudio@localhost:5432/apistudio \
        python scripts/make_admin.py user@example.com
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal  # noqa: E402
from app.models.user import User  # noqa: E402


def make_admin(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"No user found with email: {email}")
            return
        user.is_admin = True
        db.commit()
        print(f"User '{user.username}' ({email}) is now an admin.")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python make_admin.py <email>")
        sys.exit(1)
    make_admin(sys.argv[1])
