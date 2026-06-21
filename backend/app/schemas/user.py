from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    email: str
    username: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    username: str
    is_admin: bool
    is_active: bool
    created_at: datetime
