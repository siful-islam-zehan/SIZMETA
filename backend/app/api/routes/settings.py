"""ResearchMeta AI - User Settings API Endpoints"""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.settings import UserSettings
from app.schemas.settings import UserSettingsRead, UserSettingsUpdate

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=UserSettingsRead)
def get_user_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get settings and preferences for the current user."""
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings:
        # Auto-create if missing
        settings = UserSettings(
            user_id=current_user.id,
            theme="system",
            preferred_ai_provider="gemini",
            preferred_ai_model="gemini-2.0-flash",
            default_citation_style="APA 7th",
            auto_save_interval_seconds=3,
            general_preferences={}
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("", response_model=UserSettingsRead)
def update_user_settings(
    settings_in: UserSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update settings and preferences for the current user."""
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)

    update_data = settings_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(settings, field, val)

    db.commit()
    db.refresh(settings)
    return settings
