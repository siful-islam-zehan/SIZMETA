"""ResearchMeta AI - Security and Encryption Utilities"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import base64
import jwt
from cryptography.fernet import Fernet
import bcrypt

from app.core.config import settings

def get_password_hash(password: str) -> str:
    """Generate bcrypt hash for password directly without passlib."""
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def _get_fernet() -> Fernet:
    """Get Fernet instance using configured encryption key or derive 32-byte urlsafe key."""
    raw_key = settings.ENCRYPTION_KEY
    try:
        return Fernet(raw_key.encode("utf-8"))
    except Exception:
        padded = raw_key.ljust(32, "x")[:32].encode("utf-8")
        safe_key = base64.urlsafe_b64encode(padded)
        return Fernet(safe_key)

def encrypt_api_key(api_key: str) -> str:
    """Encrypt user API key before storing in database."""
    if not api_key:
        return ""
    fernet = _get_fernet()
    encrypted = fernet.encrypt(api_key.strip().encode("utf-8"))
    return encrypted.decode("utf-8")

def decrypt_api_key(encrypted_api_key: str) -> str:
    """Decrypt stored API key for backend use."""
    if not encrypted_api_key:
        return ""
    try:
        fernet = _get_fernet()
        decrypted = fernet.decrypt(encrypted_api_key.encode("utf-8"))
        return decrypted.decode("utf-8")
    except Exception:
        raise ValueError("Failed to decrypt API key: invalid key or corrupted data")

def mask_api_key(key: str) -> str:
    """Mask key for safe display (e.g. sk-proj-...1234). Never reveal full key."""
    if not key:
        return ""
    stripped = key.strip()
    if len(stripped) <= 8:
        return "••••••••"
    return f"{stripped[:4]}••••••••{stripped[-4:]}"
