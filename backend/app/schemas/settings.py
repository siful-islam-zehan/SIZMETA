"""ResearchMeta AI - Settings Schemas"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class UserSettingsRead(BaseModel):
    id: str
    user_id: str
    theme: str
    preferred_ai_provider: str
    preferred_ai_model: str
    default_citation_style: str
    auto_save_interval_seconds: int
    general_preferences: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserSettingsUpdate(BaseModel):
    theme: Optional[str] = Field(None, pattern="^(system|light|dark)$")
    preferred_ai_provider: Optional[str] = Field(None, pattern="^(gemini|openai)$")
    preferred_ai_model: Optional[str] = None
    default_citation_style: Optional[str] = None
    auto_save_interval_seconds: Optional[int] = Field(None, ge=1, le=60)
    general_preferences: Optional[Dict[str, Any]] = None
