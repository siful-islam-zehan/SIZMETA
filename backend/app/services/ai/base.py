"""ResearchMeta AI - Base AI Provider Interface and Exceptions"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class AIProviderError(Exception):
    """Base exception for AI provider issues."""
    def __init__(self, message: str, provider: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.message = message
        self.provider = provider
        self.status_code = status_code

class InvalidKeyError(AIProviderError):
    """Raised when the API key is invalid or expired."""
    pass

class RateLimitError(AIProviderError):
    """Raised when provider rate limit or quota is exhausted."""
    pass

class ModelUnavailableError(AIProviderError):
    """Raised when the requested model is not found or inaccessible."""
    pass

class ProviderTimeoutError(AIProviderError):
    """Raised when the provider API request times out."""
    pass

class BaseAIProvider(ABC):
    """Abstract base class for all AI model providers."""

    def __init__(self, api_key: str, base_url: Optional[str] = None):
        self.api_key = api_key.strip()
        self.base_url = base_url

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Provider identifier, e.g. 'gemini' or 'openai'."""
        pass

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        """
        Verify that the provided API key is valid and has access to models.
        Returns dict with success status, message, and discovered models.
        """
        pass

    @abstractmethod
    async def list_models(self) -> List[Dict[str, Any]]:
        """
        Dynamically list available text/chat generation models.
        """
        pass

    @abstractmethod
    async def generate_completion(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: int = 1500,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Generate completion using the verified provider.
        """
        pass
