from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


class Collection(Base):
    __tablename__ = "collections"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, default="")
    owner_id = Column(Integer, ForeignKey("users.id"))
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    folders = relationship("Folder", back_populates="collection", cascade="all, delete")
    requests = relationship("Request", back_populates="collection", cascade="all, delete")


class Folder(Base):
    __tablename__ = "folders"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    collection_id = Column(Integer, ForeignKey("collections.id"))
    parent_folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    collection = relationship("Collection", back_populates="folders")
    requests = relationship("Request", back_populates="folder", cascade="all, delete")
