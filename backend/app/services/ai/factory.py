"""ResearchMeta AI - Provider Factory and User Provider Loader"""
from typing import Optional, List
from sqlalchemy.orm import Session

from app.core.security import decrypt_api_key
from app.models.provider import AIProviderConfig
from app.models.settings import UserSettings
from app.services.ai.base import BaseAIProvider, AIProviderError
from app.services.ai.gemini_provider import GeminiProvider
from app.services.ai.openai_provider import OpenAIProvider

SUPPORTED_PROVIDERS = {
    "gemini": GeminiProvider,
    "openai": OpenAIProvider,
}

def get_provider(provider_name: str, api_key: str, base_url: Optional[str] = None) -> BaseAIProvider:
    """Create a provider instance for the specified provider and API key."""
    normalized = provider_name.lower().strip()
    provider_cls = SUPPORTED_PROVIDERS.get(normalized)
    if not provider_cls:
        raise AIProviderError(f"Unsupported AI provider: '{provider_name}'", provider=provider_name)
    return provider_cls(api_key=api_key, base_url=base_url)

def get_user_provider(
    db: Session,
    user_id: str,
    requested_provider: Optional[str] = None
) -> BaseAIProvider:
    """
    Retrieve and instantiate the active AI provider for a user.
    If requested_provider is None, uses the user's preferred provider from UserSettings.
    Decrypts the stored key securely.
    """
    target_provider = requested_provider
    if not target_provider:
        user_settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        target_provider = user_settings.preferred_ai_provider if user_settings else "gemini"

    config = (
        db.query(AIProviderConfig)
        .filter(
            AIProviderConfig.user_id == user_id,
            AIProviderConfig.provider == target_provider,
            AIProviderConfig.is_active == True
        )
        .first()
    )

    if not config or not config.encrypted_api_key:
        raise AIProviderError(
            f"No API key configured for provider '{target_provider}'. Please add your API key in Settings.",
            provider=target_provider,
            status_code=400
        )

    try:
        decrypted_key = decrypt_api_key(config.encrypted_api_key)
    except Exception as e:
        raise AIProviderError(
            f"Failed to decrypt credentials for provider '{target_provider}'",
            provider=target_provider,
            status_code=500
        )

    return get_provider(
        provider_name=target_provider,
        api_key=decrypted_key,
        base_url=config.api_base_url
    )
