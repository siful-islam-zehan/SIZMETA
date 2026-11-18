"""ResearchMeta AI - Export Schemas"""
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class ExportFormat(str, Enum):
    PDF = "pdf"
    DOCX = "docx"
    TXT = "txt"
    MARKDOWN = "md"

class ExportRequest(BaseModel):
    document_id: str
    format: ExportFormat
    include_metadata: bool = True
    citation_style: Optional[str] = "APA 7th"
