"""ResearchMeta AI - Document Export API Endpoints"""
import urllib.parse
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.export import ExportFormat
from app.services.documents.export_service import DocumentExportService

router = APIRouter(prefix="/export", tags=["Document Export"])

@router.get("/{document_id}")
def export_document(
    document_id: str,
    format: ExportFormat = Query(ExportFormat.PDF, description="Export format: pdf, docx, txt, md"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Response:
    """Export a document into PDF, DOCX, TXT, or Markdown format."""
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    safe_title = re_clean_filename(document.title)
    
    if format == ExportFormat.DOCX:
        file_bytes = DocumentExportService.export_docx(
            title=document.title,
            content_html=document.content,
            citation_style=document.citation_style
        )
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename = f"{safe_title}.docx"
    elif format == ExportFormat.PDF:
        file_bytes = DocumentExportService.export_pdf(
            title=document.title,
            content_html=document.content,
            citation_style=document.citation_style
        )
        media_type = "application/pdf"
        filename = f"{safe_title}.pdf"
    elif format == ExportFormat.MARKDOWN:
        file_bytes = DocumentExportService.export_markdown(
            title=document.title,
            content_html=document.content,
            citation_style=document.citation_style
        )
        media_type = "text/markdown; charset=utf-8"
        filename = f"{safe_title}.md"
    else:  # TXT
        file_bytes = DocumentExportService.export_txt(
            title=document.title,
            content_html=document.content,
            citation_style=document.citation_style
        )
        media_type = "text/plain; charset=utf-8"
        filename = f"{safe_title}.txt"

    encoded_filename = urllib.parse.quote(filename)
    headers = {
        "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
        "Content-Length": str(len(file_bytes)),
    }
    return Response(content=file_bytes, media_type=media_type, headers=headers)

def re_clean_filename(name: str) -> str:
    """Sanitize title for safe filename."""
    import re
    cleaned = re.sub(r'[\\/*?:"<>|]', "", name).strip()
    return cleaned or "ResearchMeta_Document"
