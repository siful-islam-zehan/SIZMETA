"""ResearchMeta AI - Authentication and Security Tests"""
import pytest
from fastapi import HTTPException
from app.core.security import encrypt_api_key, decrypt_api_key, mask_api_key, verify_password
from app.api.routes.auth import register, login, read_current_user
from app.api.routes.users import change_password
from app.api.routes.health import health_check
from app.schemas.auth import RegisterRequest, LoginRequest
from app.schemas.user import PasswordChangeRequest

def test_health_check(db_session):
    """Test health endpoint function."""
    res = health_check(db_session)
    assert res["status"] == "healthy"
    assert res["database_connected"] is True

def test_register_new_user(db_session):
    """Test registering a new user."""
    req = RegisterRequest(
        email="new.scholar@oxford.ac.uk",
        full_name="Scholar Smith",
        password="SecurePassword123!"
    )
    res = register(req, db_session)
    assert "access_token" in res
    assert res["token_type"] == "bearer"

def test_register_duplicate_email(db_session, test_user):
    """Test that duplicate email registration raises HTTPException 400."""
    req = RegisterRequest(
        email=test_user.email,
        full_name="Duplicate User",
        password="Password123!"
    )
    with pytest.raises(HTTPException) as exc:
        register(req, db_session)
    assert exc.value.status_code == 400
    assert "already exists" in exc.value.detail

def test_login_success(db_session, test_user):
    """Test login with valid credentials."""
    req = LoginRequest(
        email=test_user.email,
        password="ResearchMeta2026!"
    )
    res = login(req, db_session)
    assert "access_token" in res

def test_login_invalid_password(db_session, test_user):
    """Test login with incorrect password raises HTTPException 401."""
    req = LoginRequest(
        email=test_user.email,
        password="WrongPassword!"
    )
    with pytest.raises(HTTPException) as exc:
        login(req, db_session)
    assert exc.value.status_code == 401

def test_read_current_user_profile(test_user):
    """Test reading current user profile."""
    res = read_current_user(test_user)
    assert res.email == test_user.email
    assert res.full_name == test_user.full_name

def test_change_password(db_session, test_user):
    """Test password update flow."""
    req = PasswordChangeRequest(
        current_password="ResearchMeta2026!",
        new_password="NewSecurePassword2026!"
    )
    res = change_password(req, db_session, test_user)
    assert res["message"] == "Password changed successfully"
    assert verify_password("NewSecurePassword2026!", test_user.hashed_password)

def test_encryption_and_masking():
    """Verify symmetric encryption and secure key masking."""
    original_key = "AIzaSyD-FakeGeminiKey123456789ABCXYZ"
    encrypted = encrypt_api_key(original_key)
    assert encrypted != original_key
    assert "AIzaSy" not in encrypted
    
    decrypted = decrypt_api_key(encrypted)
    assert decrypted == original_key

    masked = mask_api_key(original_key)
    assert masked.startswith("AIza")
    assert masked.endswith("CXYZ")
    assert "••••••••" in masked
