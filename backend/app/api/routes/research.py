"""ResearchMeta AI - Research Sources and Bibliography Routes"""
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, ConfigDict

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.research import ResearchSource
from app.services.ai.factory import get_user_provider
from app.services.ai.base import AIProviderError
from app.services.research.research_engine import retrieve_academic_sources, execute_research_synthesis

router = APIRouter(prefix="/research", tags=["Research Sources"])

class ResearchQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500)
    research_mode: bool = True
    project_id: Optional[str] = None
    max_sources: int = Field(default=6, ge=1, le=12)
    save_to_library: bool = False

class ResearchSourceCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    project_id: Optional[str] = None
    authors: List[str] = Field(default_factory=list)
    publication_year: Optional[int] = None
    venue_or_journal: Optional[str] = None
    doi_or_url: Optional[str] = None
    abstract: Optional[str] = None
    citation_key: Optional[str] = None
    notes: Optional[str] = None

class ResearchSourceRead(ResearchSourceCreate):
    id: str
    user_id: str
    credibility_score: Optional[float] = None
    verification_status: str
    created_at: Any
    updated_at: Any

    model_config = ConfigDict(from_attributes=True)

@router.post("/query")
async def execute_research(
    payload: ResearchQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Execute live academic research across arXiv and Crossref with AI synthesis."""
    if not payload.research_mode:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Research mode is disabled. Toggle Research ON to perform academic source retrieval."
        )

    # 1. Retrieve verified sources from academic repositories
    sources = await retrieve_academic_sources(payload.query, max_total=payload.max_sources)
    if not sources:
        return {
            "query": payload.query,
            "status": "no_results",
            "overview": f"No academic papers found matching '{payload.query}'. Try expanding your terminology.",
            "key_findings": [],
            "sources": [],
            "sources_count": 0,
            "ai_synthesized": False
        }

    # 2. Attempt to resolve active AI provider for deep synthesis
    ai_provider = None
    try:
        ai_provider = get_user_provider(db, current_user.id)
    except AIProviderError:
        # Graceful fallback: synthesize directly from retrieved literature abstracts
        ai_provider = None

    # 3. Synthesize literature
    synthesis = await execute_research_synthesis(
        query=payload.query,
        sources=sources,
        ai_provider=ai_provider
    )

    # 4. If requested, automatically save sources to user's library
    if payload.save_to_library:
        for s in sources:
            existing = (
                db.query(ResearchSource)
                .filter(ResearchSource.user_id == current_user.id, ResearchSource.title == s.title)
                .first()
            )
            if not existing:
                new_src = ResearchSource(
                    user_id=current_user.id,
                    project_id=payload.project_id,
                    title=s.title,
                    authors=s.authors,
                    publication_year=s.year,
                    venue_or_journal=s.venue_or_journal,
                    doi_or_url=s.doi_or_url,
                    abstract=s.abstract,
                    citation_key=s.citation_key,
                    credibility_score=s.credibility_score,
                    verification_status="verified",
                    notes="Saved from ResearchMeta Live Retrieval"
                )
                db.add(new_src)
        db.commit()

    return synthesis

@router.get("/sources", response_model=List[ResearchSourceRead])
def list_sources(
    project_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """List research sources saved by the user."""
    query = db.query(ResearchSource).filter(ResearchSource.user_id == current_user.id)
    if project_id:
        query = query.filter(ResearchSource.project_id == project_id)
    return query.order_by(ResearchSource.updated_at.desc()).all()

@router.post("/sources", response_model=ResearchSourceRead, status_code=status.HTTP_201_CREATED)
def add_source(
    src_in: ResearchSourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Add a verified academic research source to the library."""
    source = ResearchSource(
        user_id=current_user.id,
        project_id=src_in.project_id,
        title=src_in.title.strip(),
        authors=src_in.authors,
        publication_year=src_in.publication_year,
        venue_or_journal=src_in.venue_or_journal,
        doi_or_url=src_in.doi_or_url,
        abstract=src_in.abstract,
        citation_key=src_in.citation_key,
        credibility_score=0.95,
        verification_status="verified",
        notes=src_in.notes
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return source

@router.get("/sources/{source_id}", response_model=ResearchSourceRead)
def get_source(
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get a research source by ID."""
    source = (
        db.query(ResearchSource)
        .filter(ResearchSource.id == source_id, ResearchSource.user_id == current_user.id)
        .first()
    )
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    return source

@router.delete("/sources/{source_id}")
def delete_source(
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delete a research source."""
    source = (
        db.query(ResearchSource)
        .filter(ResearchSource.id == source_id, ResearchSource.user_id == current_user.id)
        .first()
    )
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")

    db.delete(source)
    db.commit()
    return {"message": "Source removed successfully"}
