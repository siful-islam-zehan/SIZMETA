"""ResearchMeta AI - Core Configuration"""
import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "ResearchMeta AI"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=True)
    
    # Security
    SECRET_KEY: str = Field(
        default="researchmeta-super-secret-key-change-in-production-2026-xyz1234567890",
        description="Key used to sign JWTs"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Key Encryption (Fernet requires 32 url-safe base64-encoded bytes)
    # Default provided for out-of-the-box local dev, customizable via env
    ENCRYPTION_KEY: str = Field(
        default="gA_VzV1lKx0iR8_aO4K2c2sU5v9eY8bQ7n3m6p1q4w0=",
        description="Fernet key for encrypting user API keys at rest"
    )
    
    # Database
    # Defaults to SQLite for local development/testing if PostgreSQL is not active,
    # or PostgreSQL when DATABASE_URL is set in environment.
    DATABASE_URL: str = Field(
        default="sqlite:///./researchmeta.db",
        description="Database connection string (PostgreSQL or SQLite)"
    )
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]
    
    # Redis / Celery (Optional background tasks)
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    
    # File Storage
    UPLOAD_DIR: str = Field(default="./uploads")
    MAX_UPLOAD_SIZE_MB: int = 25

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
