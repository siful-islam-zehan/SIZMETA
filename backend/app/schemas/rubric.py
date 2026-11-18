"""ResearchMeta AI - Rubric Schemas"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class RubricCriterion(BaseModel):
    name: str
    description: Optional[str] = None
    weight_percentage: float = 0.0
    levels: List[Dict[str, Any]] = []

class RubricBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    project_id: Optional[str] = None
    criteria: List[Dict[str, Any]] = Field(default_factory=list)
    max_score: float = 100.0

class RubricCreate(RubricBase):
    pass

class RubricUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    criteria: Optional[List[Dict[str, Any]]] = None
    max_score: Optional[float] = None
    create_version_snapshot: bool = False
    version_notes: Optional[str] = None

class RubricVersionRead(BaseModel):
    id: str
    rubric_id: str
    version_number: int
    criteria: List[Dict[str, Any]]
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RubricRead(RubricBase):
    id: str
    user_id: str
    current_version: int
    created_at: datetime
    updated_at: datetime
    versions: List[RubricVersionRead] = []

    model_config = ConfigDict(from_attributes=True)
