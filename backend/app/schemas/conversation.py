"""ResearchMeta AI - Conversation Schemas"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class MessageCreate(BaseModel):
    role: str = Field(default="user", pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1)
    model_used: Optional[str] = None
    provider_used: Optional[str] = None
    token_count: Optional[int] = None
    metadata_json: Dict[str, Any] = Field(default_factory=dict)

class MessageRead(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    model_used: Optional[str] = None
    provider_used: Optional[str] = None
    metadata_json: Dict[str, Any] = {}
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ConversationCreate(BaseModel):
    title: Optional[str] = "Academic Inquiry"
    project_id: Optional[str] = None
    context_type: str = "general"

class ConversationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)

class ChatQueryRequest(BaseModel):
    content: str = Field(..., min_length=1)
    include_research: bool = False
    context_type: Optional[str] = None

class ConversationRead(BaseModel):
    id: str
    user_id: str
    project_id: Optional[str] = None
    title: str
    context_type: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageRead] = []

    model_config = ConfigDict(from_attributes=True)
