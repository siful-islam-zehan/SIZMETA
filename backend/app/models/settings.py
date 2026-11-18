"""ResearchMeta AI - User Settings Model"""
from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, TimestampMixin

class UserSettings(Base, TimestampMixin):
    __tablename__ = "user_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    
    theme = Column(String(20), default="system", nullable=False)  # system, light, dark
    preferred_ai_provider = Column(String(50), default="gemini", nullable=False)  # gemini, openai
    preferred_ai_model = Column(String(100), default="gemini-2.0-flash", nullable=False)
    default_citation_style = Column(String(50), default="APA 7th", nullable=False)
    auto_save_interval_seconds = Column(Integer, default=3, nullable=False)
    general_preferences = Column(JSON, default=dict, nullable=False)

    # Relationships
    user = relationship("User", back_populates="settings")
