"""ResearchMeta AI - AI Provider Schemas"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class ModelInfo(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    context_window: Optional[int] = None
    supports_vision: bool = False

class AIProviderConfigRead(BaseModel):
    id: str
    provider: str  # "gemini" or "openai"
    has_api_key: bool
    key_masked: Optional[str] = None
    api_base_url: Optional[str] = None
    is_active: bool
    is_valid: bool
    last_tested_at: Optional[datetime] = None
    last_error_message: Optional[str] = None
    default_model: Optional[str] = None
    available_models: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AIProviderKeyUpdate(BaseModel):
    provider: str = Field(..., pattern="^(gemini|openai)$")
    api_key: str = Field(..., min_length=1, description="Raw API key - encrypted before saving")
    default_model: Optional[str] = None
    api_base_url: Optional[str] = None

class AIProviderTestRequest(BaseModel):
    provider: str = Field(..., pattern="^(gemini|openai)$")
    api_key: Optional[str] = Field(None, description="Optional new key to test before saving. If omitted, tests saved key.")

class AIProviderTestResponse(BaseModel):
    success: bool
    provider: str
    message: str
    available_models: List[Dict[str, Any]] = []
    latency_ms: Optional[int] = None
