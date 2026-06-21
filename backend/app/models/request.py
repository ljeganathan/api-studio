from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


class Request(Base):
    __tablename__ = "requests"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    method = Column(String, default="GET")
    url = Column(Text, default="")
    headers = Column(JSON, default=[])
    params = Column(JSON, default=[])
    body_type = Column(String, default="none")  # none | raw | form-data | x-www-form-urlencoded
    body_content = Column(Text, default="")
    auth_type = Column(String, default="none")
    auth_data = Column(JSON, default={})
    collection_id = Column(Integer, ForeignKey("collections.id"), nullable=True)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    collection = relationship("Collection", back_populates="requests")
    folder = relationship("Folder", back_populates="requests")


class RequestLog(Base):
    __tablename__ = "request_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    request_id = Column(Integer, ForeignKey("requests.id"), nullable=True)

    # Snapshot of what was actually sent (for replay)
    method = Column(String, nullable=False)
    url = Column(Text, nullable=False)
    headers = Column(JSON, default=[])
    params = Column(JSON, default=[])
    body_type = Column(String, default="none")
    body_content = Column(Text, default="")

    # Response metadata
    status_code = Column(Integer, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    response_size_bytes = Column(Integer, nullable=True)
    response_body_preview = Column(Text, default="")  # first 500 chars for display

    created_at = Column(DateTime, server_default=func.now())
