"""ResearchMeta AI - AI Provider Configuration Model"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, TimestampMixin

class AIProviderConfig(Base, TimestampMixin):
    __tablename__ = "ai_provider_configs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    
    provider = Column(String(50), nullable=False, index=True)  # "gemini", "openai"
    encrypted_api_key = Column(String(512), nullable=False)  # Fernet encrypted
    api_base_url = Column(String(255), nullable=True)  # Custom endpoint if applicable
    
    is_active = Column(Boolean, default=True, nullable=False)
    is_valid = Column(Boolean, default=False, nullable=False)
    last_tested_at = Column(DateTime(timezone=True), nullable=True)
    last_error_message = Column(String(1000), nullable=True)
    
    default_model = Column(String(100), nullable=True)
    available_models = Column(JSON, default=list, nullable=False)

    # Relationships
    user = relationship("User", back_populates="providers")

    __table_args__ = (
        UniqueConstraint("user_id", "provider", name="uq_user_provider"),
    )
