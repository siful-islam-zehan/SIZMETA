"""ResearchMeta AI - Generation History Model"""
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, utc_now

class GenerationHistory(Base):
    __tablename__ = "generation_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True, index=True)
    
    provider = Column(String(50), nullable=False)  # gemini, openai
    model = Column(String(100), nullable=False)
    prompt_type = Column(String(50), nullable=False)  # research_plan, draft_section, review, citation, rubric_check
    
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    execution_time_ms = Column(Integer, nullable=True)
    status = Column(String(50), default="success", nullable=False)  # success, failed, rate_limited
    error_message = Column(String(1000), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="generations")
    project = relationship("Project", back_populates="generations")
    document = relationship("Document", back_populates="generations")
