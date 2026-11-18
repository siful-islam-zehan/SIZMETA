"""ResearchMeta AI - AI Provider Configuration and Testing Routes"""
from datetime import datetime, timezone
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.security import encrypt_api_key, decrypt_api_key, mask_api_key
from app.models.user import User
from app.models.provider import AIProviderConfig
from app.schemas.provider import (
    AIProviderConfigRead,
    AIProviderKeyUpdate,
    AIProviderTestRequest,
    AIProviderTestResponse
)
from app.services.ai.factory import get_provider, SUPPORTED_PROVIDERS

router = APIRouter(prefix="/providers", tags=["AI Providers"])

@router.get("", response_model=List[AIProviderConfigRead])
def list_providers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    List AI provider configurations for current user.
    API keys are never returned; only masked representation and status are provided.
    """
    existing_configs = {
        c.provider: c for c in db.query(AIProviderConfig).filter(AIProviderConfig.user_id == current_user.id).all()
    }
    
    results = []
    for provider_name in SUPPORTED_PROVIDERS.keys():
        cfg = existing_configs.get(provider_name)
        if cfg:
            # Decrypt momentarily only to create masked preview
            try:
                decrypted = decrypt_api_key(cfg.encrypted_api_key)
                masked = mask_api_key(decrypted)
            except Exception:
                masked = "••••••••"

            results.append({
                "id": cfg.id,
                "provider": cfg.provider,
                "has_api_key": bool(cfg.encrypted_api_key),
                "key_masked": masked,
                "api_base_url": cfg.api_base_url,
                "is_active": cfg.is_active,
                "is_valid": cfg.is_valid,
                "last_tested_at": cfg.last_tested_at,
                "last_error_message": cfg.last_error_message,
                "default_model": cfg.default_model,
                "available_models": cfg.available_models or [],
                "created_at": cfg.created_at,
                "updated_at": cfg.updated_at,
            })
        else:
            # Placeholder entry for unconfigured provider
            results.append({
                "id": f"unconfigured-{provider_name}",
                "provider": provider_name,
                "has_api_key": False,
                "key_masked": None,
                "api_base_url": None,
                "is_active": False,
                "is_valid": False,
                "last_tested_at": None,
                "last_error_message": None,
                "default_model": "gemini-2.0-flash" if provider_name == "gemini" else "gpt-4o-mini",
                "available_models": [],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            })
    return results

@router.post("/key", response_model=AIProviderConfigRead)
async def save_or_update_key(
    key_in: AIProviderKeyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Save or update an encrypted API key for a provider.
    Verifies key validity and dynamically discovers available models.
    """
    provider_name = key_in.provider.lower()
    raw_key = key_in.api_key.strip()

    # Instantiate provider to verify key
    provider_instance = get_provider(provider_name, raw_key, key_in.api_base_url)
    test_result = await provider_instance.test_connection()

    is_valid = test_result.get("success", False)
    error_msg = None if is_valid else test_result.get("message")
    models = test_result.get("available_models", [])

    # Pick default model
    default_model = key_in.default_model
    if not default_model:
        if models:
            default_model = models[0]["id"]
        else:
            default_model = "gemini-2.0-flash" if provider_name == "gemini" else "gpt-4o-mini"

    # Encrypt key
    encrypted_key = encrypt_api_key(raw_key)

    config = (
        db.query(AIProviderConfig)
        .filter(AIProviderConfig.user_id == current_user.id, AIProviderConfig.provider == provider_name)
        .first()
    )

    now = datetime.now(timezone.utc)
    if config:
        config.encrypted_api_key = encrypted_key
        config.api_base_url = key_in.api_base_url
        config.is_active = True
        config.is_valid = is_valid
        config.last_tested_at = now
        config.last_error_message = error_msg
        config.default_model = default_model
        config.available_models = models
        config.updated_at = now
    else:
        config = AIProviderConfig(
            user_id=current_user.id,
            provider=provider_name,
            encrypted_api_key=encrypted_key,
            api_base_url=key_in.api_base_url,
            is_active=True,
            is_valid=is_valid,
            last_tested_at=now,
            last_error_message=error_msg,
            default_model=default_model,
            available_models=models,
        )
        db.add(config)

    db.commit()
    db.refresh(config)

    return {
        "id": config.id,
        "provider": config.provider,
        "has_api_key": True,
        "key_masked": mask_api_key(raw_key),
        "api_base_url": config.api_base_url,
        "is_active": config.is_active,
        "is_valid": config.is_valid,
        "last_tested_at": config.last_tested_at,
        "last_error_message": config.last_error_message,
        "default_model": config.default_model,
        "available_models": config.available_models or [],
        "created_at": config.created_at,
        "updated_at": config.updated_at,
    }

@router.post("/test", response_model=AIProviderTestResponse)
async def test_provider_key(
    test_req: AIProviderTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Test connection to an AI provider.
    Can test an unsaved key passed in the request, or test an existing saved key from DB.
    """
    provider_name = test_req.provider.lower()
    raw_key = test_req.api_key

    if not raw_key:
        config = (
            db.query(AIProviderConfig)
            .filter(AIProviderConfig.user_id == current_user.id, AIProviderConfig.provider == provider_name)
            .first()
        )
        if not config or not config.encrypted_api_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No saved API key found for {provider_name}. Please provide a key to test."
            )
        try:
            raw_key = decrypt_api_key(config.encrypted_api_key)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to decrypt stored API key"
            )

    provider_instance = get_provider(provider_name, raw_key)
    res = await provider_instance.test_connection()

    # Update database record if saved config exists
    config = (
        db.query(AIProviderConfig)
        .filter(AIProviderConfig.user_id == current_user.id, AIProviderConfig.provider == provider_name)
        .first()
    )
    if config and not test_req.api_key:
        config.is_valid = res.get("success", False)
        config.last_tested_at = datetime.now(timezone.utc)
        config.last_error_message = None if res.get("success") else res.get("message")
        if res.get("available_models"):
            config.available_models = res.get("available_models")
        db.commit()

    return res

@router.delete("/{provider}")
def delete_provider_key(
    provider: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Remove stored API key configuration for a provider."""
    provider_name = provider.lower()
    config = (
        db.query(AIProviderConfig)
        .filter(AIProviderConfig.user_id == current_user.id, AIProviderConfig.provider == provider_name)
        .first()
    )
    if not config:
        return {"message": f"No configuration found for {provider_name}"}

    db.delete(config)
    db.commit()
    return {"message": f"Successfully removed API key configuration for {provider_name}"}
