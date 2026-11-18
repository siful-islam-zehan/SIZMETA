"""ResearchMeta AI - Rubrics and Criteria Management Routes"""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.rubric import Rubric, RubricVersion
from app.schemas.rubric import RubricCreate, RubricUpdate, RubricRead

router = APIRouter(prefix="/rubrics", tags=["Rubrics"])

@router.get("", response_model=List[RubricRead])
def list_rubrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """List all rubrics created by the user."""
    return (
        db.query(Rubric)
        .filter(Rubric.user_id == current_user.id)
        .order_by(Rubric.updated_at.desc())
        .all()
    )

@router.post("", response_model=RubricRead, status_code=status.HTTP_201_CREATED)
def create_rubric(
    rubric_in: RubricCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Create a new academic grading rubric."""
    rubric = Rubric(
        user_id=current_user.id,
        project_id=rubric_in.project_id,
        title=rubric_in.title.strip(),
        description=rubric_in.description,
        criteria=rubric_in.criteria,
        max_score=rubric_in.max_score,
        current_version=1
    )
    db.add(rubric)
    db.flush()

    # Initial version snapshot
    version = RubricVersion(
        rubric_id=rubric.id,
        user_id=current_user.id,
        version_number=1,
        criteria=rubric.criteria,
        notes="Initial rubric creation"
    )
    db.add(version)
    db.commit()
    db.refresh(rubric)
    return rubric

@router.get("/{rubric_id}", response_model=RubricRead)
def get_rubric(
    rubric_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get rubric details and criteria."""
    rubric = (
        db.query(Rubric)
        .filter(Rubric.id == rubric_id, Rubric.user_id == current_user.id)
        .first()
    )
    if not rubric:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rubric not found")
    return rubric

@router.put("/{rubric_id}", response_model=RubricRead)
def update_rubric(
    rubric_id: str,
    rubric_in: RubricUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update rubric criteria."""
    rubric = (
        db.query(Rubric)
        .filter(Rubric.id == rubric_id, Rubric.user_id == current_user.id)
        .first()
    )
    if not rubric:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rubric not found")

    if rubric_in.title is not None:
        rubric.title = rubric_in.title.strip()
    if rubric_in.description is not None:
        rubric.description = rubric_in.description
    if rubric_in.criteria is not None:
        rubric.criteria = rubric_in.criteria
    if rubric_in.max_score is not None:
        rubric.max_score = rubric_in.max_score

    if rubric_in.create_version_snapshot:
        new_version_num = rubric.current_version + 1
        rubric.current_version = new_version_num
        version = RubricVersion(
            rubric_id=rubric.id,
            user_id=current_user.id,
            version_number=new_version_num,
            criteria=rubric.criteria,
            notes=rubric_in.version_notes or f"Updated version {new_version_num}"
        )
        db.add(version)

    db.commit()
    db.refresh(rubric)
    return rubric

@router.delete("/{rubric_id}")
def delete_rubric(
    rubric_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delete a rubric."""
    rubric = (
        db.query(Rubric)
        .filter(Rubric.id == rubric_id, Rubric.user_id == current_user.id)
        .first()
    )
    if not rubric:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rubric not found")

    db.delete(rubric)
    db.commit()
    return {"message": "Rubric deleted successfully"}
