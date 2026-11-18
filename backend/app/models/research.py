"""ResearchMeta AI - Research Source Model"""
from sqlalchemy import Column, String, Text, Integer, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, TimestampMixin

class ResearchSource(Base, TimestampMixin):
    __tablename__ = "research_sources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String(500), nullable=False)
    authors = Column(JSON, default=list, nullable=False)  # ["Author One", "Author Two"]
    publication_year = Column(Integer, nullable=True)
    venue_or_journal = Column(String(255), nullable=True)
    doi_or_url = Column(String(500), nullable=True)
    abstract = Column(Text, nullable=True)
    citation_key = Column(String(100), nullable=True)  # e.g. "Smith2024"
    credibility_score = Column(Float, nullable=True)  # 0.0 - 1.0
    verification_status = Column(String(50), default="unverified", nullable=False)  # unverified, verified, flagged
    notes = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="sources")
    project = relationship("Project", back_populates="sources")
