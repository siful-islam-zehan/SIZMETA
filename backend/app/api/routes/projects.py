"""ResearchMeta AI - Research Projects Routes"""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.document import Document
from app.models.research import ResearchSource
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectRead

router = APIRouter(prefix="/projects", tags=["Research Projects"])

@router.get("", response_model=List[ProjectRead])
def list_user_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """List all research projects owned by the authenticated user."""
    projects = (
        db.query(Project)
        .filter(Project.user_id == current_user.id)
        .order_by(Project.updated_at.desc())
        .all()
    )

    results = []
    for p in projects:
        doc_count = db.query(func.count(Document.id)).filter(Document.project_id == p.id).scalar() or 0
        src_count = db.query(func.count(ResearchSource.id)).filter(ResearchSource.project_id == p.id).scalar() or 0
        p_dict = {
            "id": p.id,
            "user_id": p.user_id,
            "title": p.title,
            "description": p.description,
            "academic_level": p.academic_level,
            "research_field": p.research_field,
            "status": p.status,
            "metadata_json": p.metadata_json or {},
            "document_count": doc_count,
            "source_count": src_count,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
        }
        results.append(p_dict)
    return results

@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Create a new research project."""
    project = Project(
        user_id=current_user.id,
        title=project_in.title.strip(),
        description=project_in.description,
        academic_level=project_in.academic_level,
        research_field=project_in.research_field,
        status=project_in.status,
        metadata_json=project_in.metadata_json,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return {
        "id": project.id,
        "user_id": project.user_id,
        "title": project.title,
        "description": project.description,
        "academic_level": project.academic_level,
        "research_field": project.research_field,
        "status": project.status,
        "metadata_json": project.metadata_json or {},
        "document_count": 0,
        "source_count": 0,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }

@router.get("/{project_id}", response_model=ProjectRead)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get project details."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    doc_count = db.query(func.count(Document.id)).filter(Document.project_id == project.id).scalar() or 0
    src_count = db.query(func.count(ResearchSource.id)).filter(ResearchSource.project_id == project.id).scalar() or 0

    return {
        "id": project.id,
        "user_id": project.user_id,
        "title": project.title,
        "description": project.description,
        "academic_level": project.academic_level,
        "research_field": project.research_field,
        "status": project.status,
        "metadata_json": project.metadata_json or {},
        "document_count": doc_count,
        "source_count": src_count,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }

@router.put("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: str,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update research project."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    update_data = project_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(project, field, val)

    db.commit()
    db.refresh(project)

    doc_count = db.query(func.count(Document.id)).filter(Document.project_id == project.id).scalar() or 0
    src_count = db.query(func.count(ResearchSource.id)).filter(ResearchSource.project_id == project.id).scalar() or 0

    return {
        "id": project.id,
        "user_id": project.user_id,
        "title": project.title,
        "description": project.description,
        "academic_level": project.academic_level,
        "research_field": project.research_field,
        "status": project.status,
        "metadata_json": project.metadata_json or {},
        "document_count": doc_count,
        "source_count": src_count,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }

@router.delete("/{project_id}")
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delete a research project and associated resources."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}
