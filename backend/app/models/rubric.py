"""ResearchMeta AI - Rubric and Version Models"""
from sqlalchemy import Column, String, Text, Integer, Float, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, utc_now, TimestampMixin

class Rubric(Base, TimestampMixin):
    __tablename__ = "rubrics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    criteria = Column(JSON, default=list, nullable=False)  # List of criteria objects
    max_score = Column(Float, default=100.0, nullable=False)
    current_version = Column(Integer, default=1, nullable=False)

    # Relationships
    user = relationship("User", back_populates="rubrics")
    project = relationship("Project", back_populates="rubrics")
    versions = relationship("RubricVersion", back_populates="rubric", cascade="all, delete-orphan", order_by="RubricVersion.version_number.desc()")

class RubricVersion(Base):
    __tablename__ = "rubric_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    rubric_id = Column(String(36), ForeignKey("rubrics.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    
    version_number = Column(Integer, nullable=False)
    criteria = Column(JSON, default=list, nullable=False)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    rubric = relationship("Rubric", back_populates="versions")
