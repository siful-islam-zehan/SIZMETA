"""ResearchMeta AI - User Profile Routes"""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.security import verify_password, get_password_hash
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate, PasswordChangeRequest

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserRead)
def get_user_profile(current_user: User = Depends(get_current_user)) -> Any:
    """Return profile details for current user."""
    return current_user

@router.put("/me", response_model=UserRead)
def update_user_profile(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update profile details."""
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name.strip()
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/password")
def change_password(
    pwd_data: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Change current user's password."""
    if not verify_password(pwd_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    current_user.hashed_password = get_password_hash(pwd_data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
