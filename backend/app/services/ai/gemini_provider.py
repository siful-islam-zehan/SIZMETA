"""ResearchMeta AI - Google Gemini Provider Implementation"""
import time
from typing import List, Dict, Any, Optional
import httpx
from app.services.ai.base import (
    BaseAIProvider,
    AIProviderError,
    InvalidKeyError,
    RateLimitError,
    ModelUnavailableError,
    ProviderTimeoutError,
)

class GeminiProvider(BaseAIProvider):
    """Provider for Google Gemini API."""

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

    @property
    def provider_name(self) -> str:
        return "gemini"

    async def list_models(self) -> List[Dict[str, Any]]:
        """Fetch list of supported Gemini generation models dynamically."""
        url = f"{self.BASE_URL}/models?key={self.api_key}"
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url)
                
                if response.status_code == 400 or response.status_code == 403:
                    data = response.json()
                    msg = data.get("error", {}).get("message", "Invalid Gemini API Key")
                    raise InvalidKeyError(f"Gemini authentication failed: {msg}", self.provider_name, response.status_code)
                elif response.status_code == 429:
                    raise RateLimitError("Gemini rate limit or quota exceeded", self.provider_name, 429)
                elif response.status_code != 200:
                    raise AIProviderError(f"Gemini API returned status {response.status_code}", self.provider_name, response.status_code)

                data = response.json()
                raw_models = data.get("models", [])
                filtered = []
                for m in raw_models:
                    # Filter for models supporting generateContent
                    methods = m.get("supportedGenerationMethods", [])
                    if "generateContent" in methods:
                        name = m.get("name", "").replace("models/", "")
                        display_name = m.get("displayName", name)
                        desc = m.get("description", "")
                        input_token_limit = m.get("inputTokenLimit")
                        filtered.append({
                            "id": name,
                            "name": display_name,
                            "description": desc,
                            "context_window": input_token_limit,
                            "supports_vision": True
                        })
                return filtered
        except httpx.TimeoutException:
            raise ProviderTimeoutError("Gemini request timed out", self.provider_name)
        except (InvalidKeyError, RateLimitError, AIProviderError):
            raise
        except Exception as e:
            raise AIProviderError(f"Failed to query Gemini models: {str(e)}", self.provider_name)

    async def test_connection(self) -> Dict[str, Any]:
        """Verify API key and return discovered models."""
        start = time.perf_counter()
        try:
            models = await self.list_models()
            latency = int((time.perf_counter() - start) * 1000)
            return {
                "success": True,
                "provider": self.provider_name,
                "message": f"Successfully connected to Gemini API. Discovered {len(models)} generative models.",
                "available_models": models,
                "latency_ms": latency
            }
        except (InvalidKeyError, RateLimitError, ProviderTimeoutError, AIProviderError) as e:
            return {
                "success": False,
                "provider": self.provider_name,
                "message": str(e.message),
                "available_models": [],
                "latency_ms": None
            }

    async def generate_completion(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: int = 1500,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """Generate content via Gemini API."""
        model_name = model or "gemini-2.0-flash"
        clean_model = model_name.replace("models/", "")
        url = f"{self.BASE_URL}/models/{clean_model}:generateContent?key={self.api_key}"

        payload: Dict[str, Any] = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens
            }
        }
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.post(url, json=payload)
                if response.status_code == 400 or response.status_code == 403:
                    raise InvalidKeyError("Gemini API key is invalid or lacks access to this model", self.provider_name)
                elif response.status_code == 404:
                    raise ModelUnavailableError(f"Model '{clean_model}' not found in Gemini", self.provider_name)
                elif response.status_code == 429:
                    raise RateLimitError("Gemini rate limit exceeded", self.provider_name)
                elif response.status_code != 200:
                    raise AIProviderError(f"Gemini API error: {response.text}", self.provider_name, response.status_code)

                data = response.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    return {
                        "text": "",
                        "model": clean_model,
                        "finish_reason": "empty_response",
                        "usage": {}
                    }
                first_part = candidates[0].get("content", {}).get("parts", [{}])[0]
                text = first_part.get("text", "")
                usage_metadata = data.get("usageMetadata", {})

                return {
                    "text": text,
                    "model": clean_model,
                    "finish_reason": candidates[0].get("finishReason", "STOP"),
                    "usage": {
                        "prompt_tokens": usage_metadata.get("promptTokenCount", 0),
                        "completion_tokens": usage_metadata.get("candidatesTokenCount", 0),
                        "total_tokens": usage_metadata.get("totalTokenCount", 0)
                    }
                }
        except httpx.TimeoutException:
            raise ProviderTimeoutError("Gemini completion request timed out", self.provider_name)
