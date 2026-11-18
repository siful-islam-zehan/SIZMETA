"""ResearchMeta AI - Test Configuration and Fixtures"""
import os
import pytest
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DB_FILE = "./test_researchmeta.db"
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

from app.core.database import Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.settings import UserSettings
import app.models  # Ensure all models are registered with Base

TEST_ENGINE = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)

@pytest.fixture(scope="session", autouse=True)
def init_test_database():
    """Create all tables in test database file and clean up after session."""
    Base.metadata.drop_all(bind=TEST_ENGINE)
    Base.metadata.create_all(bind=TEST_ENGINE)
    yield
    Base.metadata.drop_all(bind=TEST_ENGINE)
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass

@pytest.fixture
def db_session():
    """Provide a database session per test."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def test_user(db_session) -> User:
    """Create and return a primary test user with default settings."""
    # Check if already exists in test db
    existing = db_session.query(User).filter(User.email == "researcher@university.edu").first()
    if existing:
        return existing

    user = User(
        email="researcher@university.edu",
        full_name="Dr. Eleanor Vance",
        hashed_password=get_password_hash("ResearchMeta2026!"),
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()

    settings = UserSettings(
        user_id=user.id,
        theme="light",
        preferred_ai_provider="gemini",
        preferred_ai_model="gemini-2.0-flash",
        default_citation_style="APA 7th",
        auto_save_interval_seconds=3,
        general_preferences={}
    )
    db_session.add(settings)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def other_user(db_session) -> User:
    """Create and return a second test user to verify user isolation."""
    existing = db_session.query(User).filter(User.email == "colleague@institute.org").first()
    if existing:
        return existing

    user = User(
        email="colleague@institute.org",
        full_name="Prof. David Chen",
        hashed_password=get_password_hash("DifferentPass2026!"),
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()

    settings = UserSettings(
        user_id=user.id,
        theme="dark",
        preferred_ai_provider="openai",
        preferred_ai_model="gpt-4o",
        default_citation_style="MLA 9th",
        auto_save_interval_seconds=5,
        general_preferences={}
    )
    db_session.add(settings)
    db_session.commit()
    db_session.refresh(user)
    return user
