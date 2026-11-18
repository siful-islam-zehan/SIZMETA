"""ResearchMeta AI - Document Management, Autosave, and Versioning Routes"""
import re
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.document import Document, DocumentVersion
from app.schemas.document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentAutosave,
    DocumentRead,
    DocumentListRead,
    DocumentVersionRead,
    AssignmentGenerateRequest,
)
from app.services.documents.assignment_generator import generate_academic_assignment
from app.services.ai.base import AIProviderError

router = APIRouter(prefix="/documents", tags=["Documents"])

def _calculate_metrics(content: str) -> tuple[str, int, int]:
    """Extract plain text, word count, and character count from HTML/content."""
    if not content:
        return "", 0, 0
    # Clean HTML tags
    text = re.sub(r"<[^>]+>", " ", content)
    text = text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").strip()
    words = [w for w in text.split() if w]
    return text, len(words), len(text)

@router.get("", response_model=List[DocumentListRead])
def list_documents(
    project_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """List documents belonging to the user, optionally filtered by project."""
    query = db.query(Document).filter(Document.user_id == current_user.id)
    if project_id:
        query = query.filter(Document.project_id == project_id)
    return query.order_by(Document.updated_at.desc()).all()

@router.post("", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
def create_document(
    doc_in: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Create a new research document."""
    initial_content = doc_in.content or "<p>Start writing your research paper here...</p>"
    plain, words, chars = _calculate_metrics(initial_content)

    document = Document(
        user_id=current_user.id,
        project_id=doc_in.project_id,
        title=doc_in.title.strip() or "Untitled Research Document",
        content=initial_content,
        plain_text=plain,
        word_count=words,
        character_count=chars,
        status="draft",
        citation_style=doc_in.citation_style,
        current_version=1
    )
    db.add(document)
    db.flush()

    # Create initial version snapshot
    version = DocumentVersion(
        document_id=document.id,
        user_id=current_user.id,
        version_number=1,
        title=document.title,
        content=document.content,
        word_count=document.word_count,
        change_summary="Initial document creation"
    )
    db.add(version)
    db.commit()
    db.refresh(document)
    return document

@router.post("/generate-assignment", status_code=status.HTTP_201_CREATED)
async def generate_assignment_endpoint(
    req: AssignmentGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Generate a structured academic assignment using the scholar's AI provider."""
    try:
        result = await generate_academic_assignment(
            db=db,
            user_id=current_user.id,
            title=req.title,
            assignment_brief=req.assignment_brief,
            document_type=req.document_type,
            target_word_count=req.target_word_count,
            academic_level=req.academic_level,
            citation_style=req.citation_style,
            rubric_id=req.rubric_id,
            project_id=req.project_id,
            include_research=req.include_research
        )
        return result
    except AIProviderError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{e.provider.upper()} Provider Error: {e.message}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Assignment generation failed: {str(e)}"
        )

@router.get("/{document_id}", response_model=DocumentRead)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get full document with version history."""
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return document

@router.put("/{document_id}", response_model=DocumentRead)
def update_document(
    document_id: str,
    doc_in: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Explicit document update/save.
    Optionally creates a new version snapshot.
    """
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if doc_in.title is not None:
        document.title = doc_in.title.strip()
    if doc_in.content is not None:
        document.content = doc_in.content
        plain, words, chars = _calculate_metrics(doc_in.content)
        document.plain_text = doc_in.plain_text if doc_in.plain_text is not None else plain
        document.word_count = doc_in.word_count if doc_in.word_count is not None else words
        document.character_count = doc_in.character_count if doc_in.character_count is not None else chars
    if doc_in.status is not None:
        document.status = doc_in.status
    if doc_in.citation_style is not None:
        document.citation_style = doc_in.citation_style

    if doc_in.create_version_snapshot:
        new_version_num = document.current_version + 1
        document.current_version = new_version_num
        version = DocumentVersion(
            document_id=document.id,
            user_id=current_user.id,
            version_number=new_version_num,
            title=document.title,
            content=document.content,
            word_count=document.word_count,
            change_summary=doc_in.version_summary or f"Saved version {new_version_num}"
        )
        db.add(version)

    db.commit()
    db.refresh(document)
    return document

@router.post("/{document_id}/autosave")
def autosave_document(
    document_id: str,
    save_in: DocumentAutosave,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    High-frequency debounced autosave endpoint.
    Guarantees no data loss with minimal overhead.
    """
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    document.content = save_in.content
    plain, words, chars = _calculate_metrics(save_in.content)
    document.plain_text = save_in.plain_text if save_in.plain_text is not None else plain
    document.word_count = save_in.word_count if save_in.word_count is not None else words
    document.character_count = save_in.character_count if save_in.character_count is not None else chars
    if save_in.title is not None:
        document.title = save_in.title.strip()

    db.commit()
    return {
        "success": True,
        "saved_at": document.updated_at,
        "word_count": document.word_count,
        "character_count": document.character_count,
    }

@router.post("/{document_id}/versions", response_model=DocumentVersionRead)
def create_version_snapshot(
    document_id: str,
    summary: Optional[str] = Query("Manual checkpoint"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Create a named version snapshot of the current document state."""
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    new_version_num = document.current_version + 1
    document.current_version = new_version_num

    version = DocumentVersion(
        document_id=document.id,
        user_id=current_user.id,
        version_number=new_version_num,
        title=document.title,
        content=document.content,
        word_count=document.word_count,
        change_summary=summary
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version

@router.post("/{document_id}/versions/{version_id}/restore", response_model=DocumentRead)
def restore_version(
    document_id: str,
    version_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Restore document content from a previous version snapshot."""
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    version = (
        db.query(DocumentVersion)
        .filter(
            DocumentVersion.id == version_id,
            DocumentVersion.document_id == document.id,
            DocumentVersion.user_id == current_user.id
        )
        .first()
    )
    if not version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Version not found")

    # Restore content and title
    document.title = version.title
    document.content = version.content
    plain, words, chars = _calculate_metrics(version.content)
    document.plain_text = plain
    document.word_count = words
    document.character_count = chars

    # Add restore milestone version
    new_version_num = document.current_version + 1
    document.current_version = new_version_num
    restore_snapshot = DocumentVersion(
        document_id=document.id,
        user_id=current_user.id,
        version_number=new_version_num,
        title=document.title,
        content=document.content,
        word_count=document.word_count,
        change_summary=f"Restored from version {version.version_number}"
    )
    db.add(restore_snapshot)
    db.commit()
    db.refresh(document)
    return document

@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delete a document and its version history."""
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully"}
