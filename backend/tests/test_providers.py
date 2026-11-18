"""ResearchMeta AI - AI Provider Service and Routing Tests"""
import pytest
from app.services.ai.factory import SUPPORTED_PROVIDERS, get_provider
from app.models.provider import AIProviderConfig
from app.core.security import encrypt_api_key, decrypt_api_key, mask_api_key
from app.api.routes.providers import (
    list_providers,
    delete_provider_key
)

def test_supported_providers_list():
    """Ensure both Gemini and OpenAI providers are registered."""
    assert "gemini" in SUPPORTED_PROVIDERS
    assert "openai" in SUPPORTED_PROVIDERS

def test_list_providers_empty(db_session, test_user):
    """Test listing providers before keys are configured."""
    providers = list_providers(db_session, test_user)
    assert len(providers) >= 2
    for p in providers:
        assert p["has_api_key"] is False
        assert p["key_masked"] is None

def test_save_and_retrieve_provider_key(db_session, test_user):
    """Test saving encrypted provider config, masking output, and deleting."""
    raw_key = "AIzaSyFakeValidKey123456789"
    encrypted = encrypt_api_key(raw_key)

    config = AIProviderConfig(
        user_id=test_user.id,
        provider="gemini",
        encrypted_api_key=encrypted,
        is_active=True,
        is_valid=True,
        default_model="gemini-2.0-flash",
        available_models=[
            {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash", "context_window": 1048576, "supports_vision": True}
        ]
    )
    db_session.add(config)
    db_session.commit()

    # List providers - verify safe masked output
    providers = list_providers(db_session, test_user)
    gemini_entry = next(p for p in providers if p["provider"] == "gemini")
    assert gemini_entry["has_api_key"] is True
    assert gemini_entry["is_valid"] is True
    assert gemini_entry["key_masked"].startswith("AIza")
    assert "FakeValid" not in gemini_entry["key_masked"]
    assert len(gemini_entry["available_models"]) == 1

    # Verify key can be deleted
    del_res = delete_provider_key("gemini", db_session, test_user)
    assert "Successfully removed" in del_res["message"]

    # Verify listing shows it removed
    providers_after = list_providers(db_session, test_user)
    gemini_after = next(p for p in providers_after if p["provider"] == "gemini")
    assert gemini_after["has_api_key"] is False

def test_factory_get_provider_unsupported():
    """Verify factory raises AIProviderError for unsupported providers."""
    from app.services.ai.base import AIProviderError
    with pytest.raises(AIProviderError):
        get_provider("unsupported_provider", "api_key")
