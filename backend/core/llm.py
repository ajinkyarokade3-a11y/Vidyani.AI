"""Centralized LLM configuration for CrewAI agents."""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from crewai import LLM
from crewai.llms.base_llm import BaseLLM
from pydantic import PrivateAttr

from backend.core.api_key_rotation import ApiKey, StickyApiKeyPool, load_api_keys
from backend.core.config import get_settings


GEMINI_FLASH_MODEL = "gemini/gemini-3.5-flash"
RETRYABLE_GEMINI_MARKERS = (
    "resource_exhausted",
    "resource exhausted",
    "quota exceeded",
    "quota_exceeded",
    "rate limit",
    "rate_limit",
    "too many requests",
    "service unavailable",
    "internal server error",
    "bad gateway",
    "gateway timeout",
)


def is_retryable_gemini_error(exc: Exception) -> bool:
    """Return whether a Gemini failure may succeed with another API key."""

    status_code = getattr(exc, "status_code", None)
    if status_code == 429 or (
        isinstance(status_code, int) and 500 <= status_code < 600
    ):
        return True

    code = getattr(exc, "code", None)
    if code == 429 or (isinstance(code, int) and 500 <= code < 600):
        return True

    error_text = f"{type(exc).__name__}: {exc}".lower()
    if any(marker in error_text for marker in RETRYABLE_GEMINI_MARKERS):
        return True
    return any(
        status in error_text
        for status in ("429", "500", "502", "503", "504")
    )


class RotatingGeminiLLM(BaseLLM):
    """CrewAI-compatible Gemini LLM with sticky API-key fallback."""

    llm_type: str = "rotating_gemini"
    _key_pool: StickyApiKeyPool = PrivateAttr()
    _clients: dict[str, LLM] = PrivateAttr(default_factory=dict)
    _client_options: dict[str, Any] = PrivateAttr(default_factory=dict)

    def __init__(self, api_keys: list[ApiKey], **options: Any) -> None:
        super().__init__(api_key=api_keys[0].value, **options)
        self._key_pool = StickyApiKeyPool("Gemini", api_keys)
        self._client_options = options

    def call(
        self,
        messages,
        tools=None,
        callbacks=None,
        available_functions=None,
        from_task=None,
        from_agent=None,
        response_model=None,
    ):
        """Call Gemini, rotating only for quota, rate-limit, or server errors."""

        def call_with_key(api_key: str):
            client = self._clients.get(api_key)
            if client is None:
                client = LLM(api_key=api_key, **self._client_options)
                self._clients[api_key] = client
            return client.call(
                messages,
                tools=tools,
                callbacks=callbacks,
                available_functions=available_functions,
                from_task=from_task,
                from_agent=from_agent,
                response_model=response_model,
            )

        return self._key_pool.execute(
            call_with_key,
            is_retryable=is_retryable_gemini_error,
        )


@lru_cache
def get_gemini_llm() -> BaseLLM:
    """Return the shared Gemini LLM instance used by CrewAI agents."""

    settings = get_settings()
    api_keys = load_api_keys(
        "GEMINI_API_KEY",
        legacy_name="GEMINI_API_KEY",
    )
    if not settings.gemini_api_key or not api_keys:
        raise RuntimeError(
            "At least one Gemini API key is required when MOCK_MODE is false."
        )

    return RotatingGeminiLLM(
        api_keys=api_keys,
        model=GEMINI_FLASH_MODEL,
        temperature=0.2,
        timeout=120,
        max_tokens=4096,
        max_output_tokens=4096,
    )
