"""ResearchMeta AI - OpenAI Provider Implementation"""
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

class OpenAIProvider(BaseAIProvider):
    """Provider for OpenAI API."""

    BASE_URL = "https://api.openai.com/v1"

    @property
    def provider_name(self) -> str:
        return "openai"

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def list_models(self) -> List[Dict[str, Any]]:
        """Fetch list of available OpenAI chat models."""
        base_endpoint = self.base_url or self.BASE_URL
        url = f"{base_endpoint}/models"
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url, headers=self._get_headers())
                if response.status_code == 401:
                    raise InvalidKeyError("Invalid OpenAI API Key", self.provider_name, 401)
                elif response.status_code == 429:
                    raise RateLimitError("OpenAI rate limit or quota exceeded", self.provider_name, 429)
                elif response.status_code != 200:
                    raise AIProviderError(f"OpenAI API returned status {response.status_code}", self.provider_name, response.status_code)

                data = response.json()
                raw_models = data.get("data", [])
                
                # Chat/generation models filter
                relevant_prefixes = ("gpt-4", "gpt-3.5", "o1", "o3", "chatgpt")
                filtered = []
                for m in raw_models:
                    model_id = m.get("id", "")
                    if any(model_id.startswith(p) for p in relevant_prefixes):
                        filtered.append({
                            "id": model_id,
                            "name": model_id,
                            "description": f"OpenAI {model_id} model",
                            "context_window": 128000 if "gpt-4" in model_id else 16385,
                            "supports_vision": "gpt-4o" in model_id or "vision" in model_id
                        })
                # Sort models: gpt-4o first
                filtered.sort(key=lambda x: (not x["id"].startswith("gpt-4o"), x["id"]))
                return filtered
        except httpx.TimeoutException:
            raise ProviderTimeoutError("OpenAI request timed out", self.provider_name)
        except (InvalidKeyError, RateLimitError, AIProviderError):
            raise
        except Exception as e:
            raise AIProviderError(f"Failed to query OpenAI models: {str(e)}", self.provider_name)

    async def test_connection(self) -> Dict[str, Any]:
        """Verify API key and list models."""
        start = time.perf_counter()
        try:
            models = await self.list_models()
            latency = int((time.perf_counter() - start) * 1000)
            return {
                "success": True,
                "provider": self.provider_name,
                "message": f"Successfully connected to OpenAI API. Discovered {len(models)} chat models.",
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
        """Generate chat completion via OpenAI API."""
        model_name = model or "gpt-4o-mini"
        base_endpoint = self.base_url or self.BASE_URL
        url = f"{base_endpoint}/chat/completions"

        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model_name,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.post(url, headers=self._get_headers(), json=payload)
                if response.status_code == 401:
                    raise InvalidKeyError("OpenAI API key is invalid or unauthorized", self.provider_name)
                elif response.status_code == 404:
                    raise ModelUnavailableError(f"Model '{model_name}' not found in OpenAI", self.provider_name)
                elif response.status_code == 429:
                    raise RateLimitError("OpenAI rate limit or quota exceeded", self.provider_name)
                elif response.status_code != 200:
                    raise AIProviderError(f"OpenAI error: {response.text}", self.provider_name, response.status_code)

                data = response.json()
                choices = data.get("choices", [])
                if not choices:
                    return {
                        "text": "",
                        "model": model_name,
                        "finish_reason": "empty_response",
                        "usage": {}
                    }
                first_choice = choices[0]
                text = first_choice.get("message", {}).get("content", "")
                usage = data.get("usage", {})

                return {
                    "text": text,
                    "model": model_name,
                    "finish_reason": first_choice.get("finish_reason", "stop"),
                    "usage": {
                        "prompt_tokens": usage.get("prompt_tokens", 0),
                        "completion_tokens": usage.get("completion_tokens", 0),
                        "total_tokens": usage.get("total_tokens", 0)
                    }
                }
        except httpx.TimeoutException:
            raise ProviderTimeoutError("OpenAI completion request timed out", self.provider_name)
