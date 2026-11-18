"""ResearchMeta AI - Document Schemas"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class DocumentBase(BaseModel):
    title: str = Field(default="Untitled Research Document", max_length=255)
    project_id: Optional[str] = None
    citation_style: str = "APA 7th"

class DocumentCreate(DocumentBase):
    content: Optional[str] = ""

class DocumentUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None
    plain_text: Optional[str] = None
    word_count: Optional[int] = None
    character_count: Optional[int] = None
    status: Optional[str] = None
    citation_style: Optional[str] = None
    create_version_snapshot: bool = False
    version_summary: Optional[str] = None

class DocumentAutosave(BaseModel):
    content: str
    plain_text: Optional[str] = None
    word_count: Optional[int] = None
    character_count: Optional[int] = None
    title: Optional[str] = None

class DocumentVersionRead(BaseModel):
    id: str
    document_id: str
    version_number: int
    title: str
    content: str
    word_count: int
    change_summary: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DocumentRead(DocumentBase):
    id: str
    user_id: str
    content: str
    plain_text: str
    word_count: int
    character_count: int
    status: str
    current_version: int
    created_at: datetime
    updated_at: datetime
    versions: List[DocumentVersionRead] = []

    model_config = ConfigDict(from_attributes=True)

class DocumentListRead(BaseModel):
    id: str
    title: str
    project_id: Optional[str] = None
    word_count: int
    character_count: int
    status: str
    citation_style: str
    current_version: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AssignmentGenerateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    assignment_brief: str = Field(..., min_length=10)
    document_type: str = Field(default="Academic Essay")
    target_word_count: int = Field(default=500, ge=150, le=5000)
    academic_level: str = Field(default="Undergraduate")
    citation_style: str = Field(default="APA 7th")
    rubric_id: Optional[str] = None
    project_id: Optional[str] = None
    include_research: bool = True
