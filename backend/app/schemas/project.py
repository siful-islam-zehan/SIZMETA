"""ResearchMeta AI - Project Schemas"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class ProjectBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    academic_level: str = "Undergraduate"
    research_field: str = "General Academic"
    status: str = "active"
    metadata_json: Dict[str, Any] = Field(default_factory=dict)

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    academic_level: Optional[str] = None
    research_field: Optional[str] = None
    status: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None

class ProjectRead(ProjectBase):
    id: str
    user_id: str
    document_count: Optional[int] = 0
    source_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

ProjectList = ProjectRead
