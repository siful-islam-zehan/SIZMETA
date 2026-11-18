"""ResearchMeta AI - Model Base and Common Mixins"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime

def generate_uuid() -> str:
    """Generate string UUID4."""
    return str(uuid.uuid4())

def utc_now() -> datetime:
    """Get current UTC datetime."""
    return datetime.now(timezone.utc)

class TimestampMixin:
    """Timestamp mixin for created_at and updated_at."""
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
