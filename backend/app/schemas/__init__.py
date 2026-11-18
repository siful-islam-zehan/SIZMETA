"""ResearchMeta AI - Schemas Package"""
from app.schemas.auth import LoginRequest, RegisterRequest, Token, TokenPayload
from app.schemas.user import UserRead, UserUpdate, PasswordChangeRequest
from app.schemas.settings import UserSettingsRead, UserSettingsUpdate
from app.schemas.provider import (
    AIProviderConfigRead,
    AIProviderKeyUpdate,
    AIProviderTestRequest,
    AIProviderTestResponse,
    ModelInfo
)
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectRead, ProjectList
from app.schemas.conversation import ConversationCreate, ConversationRead, MessageCreate, MessageRead
from app.schemas.document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentAutosave,
    DocumentRead,
    DocumentListRead,
    DocumentVersionRead
)
from app.schemas.rubric import RubricCreate, RubricUpdate, RubricRead, RubricVersionRead
from app.schemas.export import ExportFormat, ExportRequest

__all__ = [
    "LoginRequest",
    "RegisterRequest",
    "Token",
    "TokenPayload",
    "UserRead",
    "UserUpdate",
    "PasswordChangeRequest",
    "UserSettingsRead",
    "UserSettingsUpdate",
    "AIProviderConfigRead",
    "AIProviderKeyUpdate",
    "AIProviderTestRequest",
    "AIProviderTestResponse",
    "ModelInfo",
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectRead",
    "ProjectList",
    "ConversationCreate",
    "ConversationRead",
    "MessageCreate",
    "MessageRead",
    "DocumentCreate",
    "DocumentUpdate",
    "DocumentAutosave",
    "DocumentRead",
    "DocumentListRead",
    "DocumentVersionRead",
    "RubricCreate",
    "RubricUpdate",
    "RubricRead",
    "RubricVersionRead",
    "ExportFormat",
    "ExportRequest",
]
