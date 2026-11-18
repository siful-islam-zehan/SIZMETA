"""ResearchMeta AI - Research Project Model"""
from sqlalchemy import Column, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, TimestampMixin

class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    academic_level = Column(String(100), default="Undergraduate", nullable=False)
    research_field = Column(String(100), default="General Academic", nullable=False)
    status = Column(String(50), default="active", nullable=False)  # active, archived, completed
    metadata_json = Column(JSON, default=dict, nullable=False)

    # Relationships
    user = relationship("User", back_populates="projects")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="project", cascade="all, delete-orphan")
    files = relationship("UploadedFile", back_populates="project", cascade="all, delete-orphan")
    sources = relationship("ResearchSource", back_populates="project", cascade="all, delete-orphan")
    rubrics = relationship("Rubric", back_populates="project", cascade="all, delete-orphan")
    generations = relationship("GenerationHistory", back_populates="project", cascade="all, delete-orphan")
