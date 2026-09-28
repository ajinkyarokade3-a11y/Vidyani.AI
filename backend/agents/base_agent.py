"""Shared factory and execution helpers for CrewAI agents."""

from __future__ import annotations

import logging
import inspect
import time
from contextvars import ContextVar
from collections.abc import Callable
from itertools import count
from typing import TypeVar

from crewai import Agent
from crewai.llms.base_llm import BaseLLM
from google.genai import models as genai_models

from backend.core.llm import get_gemini_llm


logger = logging.getLogger(__name__)
T = TypeVar("T")
TRANSIENT_GEMINI_STATUS_CODES = ("429", "503")
TRANSIENT_GEMINI_ERROR_MARKERS = (
    "timeout",
    "timed out",
    "connection error",
    "connectionerror",
    "connecterror",
    "readtimeout",
    "service unavailable",
    "too many requests",
)
GEMINI_REQUEST_COUNTER = count(1)
CURRENT_GEMINI_AGENT: ContextVar[str | None] = ContextVar(
    "current_gemini_agent",
    default=None,
)
CURRENT_GEMINI_ATTEMPT: ContextVar[int | None] = ContextVar(
    "current_gemini_attempt",
    default=None,
)
_ORIGINAL_GENERATE_CONTENT = genai_models.Models.generate_content


class TransientLLMError(RuntimeError):
    """Raised when Gemini remains unavailable after retry attempts."""


def create_base_agent(
    *,
    role: str,
    goal: str,
    backstory: str,
    llm: BaseLLM | None = None,
    verbose: bool = False,
    allow_delegation: bool = False,
    max_iter: int = 5,
    max_retry_limit: int = 0,
) -> Agent:
    """Create a CrewAI agent with shared defaults for this project."""

    return Agent(
        role=role,
        goal=goal,
        backstory=backstory,
        llm=llm or get_gemini_llm(),
        verbose=verbose,
        allow_delegation=allow_delegation,
        max_iter=max_iter,
        max_retry_limit=max_retry_limit,
    )


def run_with_gemini_retry(
    operation: str,
    call: Callable[[], T],
    *,
    prompt: str | None = None,
    max_attempts: int = 3,
    initial_delay_seconds: float = 2.0,
) -> T:
    """Run one Gemini-backed agent call with controlled transient retries."""

    delay_seconds = initial_delay_seconds
    for attempt in range(1, max_attempts + 1):
        _log_gemini_attempt(
            operation=operation,
            attempt=attempt,
            prompt=prompt,
        )
        agent_token = CURRENT_GEMINI_AGENT.set(operation)
        attempt_token = CURRENT_GEMINI_ATTEMPT.set(attempt)
        try:
            return call()
        except Exception as exc:
            if not _is_transient_gemini_error(exc):
                raise

            if attempt == max_attempts:
                logger.error(
                    "%s failed after %s Gemini retry attempts. Reason: %s",
                    operation,
                    max_attempts - 1,
                    exc,
                )
                raise TransientLLMError(
                    "Gemini API is temporarily unavailable after retrying. "
                    "Please try again in a few minutes."
                ) from exc

            logger.warning(
                "Gemini Retry #%s for %s. Reason: %s. Retrying after %.1fs.",
                attempt,
                operation,
                exc,
                delay_seconds,
            )
            logger.warning(
                "%s hit a transient Gemini error on attempt %s/%s. Retrying in %.1fs.",
                operation,
                attempt,
                max_attempts,
                delay_seconds,
            )
            time.sleep(delay_seconds)
            delay_seconds *= 2
        finally:
            CURRENT_GEMINI_ATTEMPT.reset(attempt_token)
            CURRENT_GEMINI_AGENT.reset(agent_token)

    raise TransientLLMError("Gemini API retry loop ended unexpectedly.")


def _is_transient_gemini_error(exc: Exception) -> bool:
    """Return whether an exception represents a retryable Gemini failure."""

    error_text = f"{type(exc).__name__}: {exc}".lower()
    if any(status_code in error_text for status_code in TRANSIENT_GEMINI_STATUS_CODES):
        return True
    return any(marker in error_text for marker in TRANSIENT_GEMINI_ERROR_MARKERS)


def _log_gemini_attempt(
    *,
    operation: str,
    attempt: int,
    prompt: str | None,
) -> None:
    """Log a visible marker before each Gemini-backed agent attempt."""

    caller = _caller_name()
    prompt_tokens = _estimate_prompt_tokens(prompt)
    logger.info("========== GEMINI ATTEMPT ==========")
    logger.info("Agent: %s", operation)
    logger.info("Caller: %s", caller)
    logger.info("Attempt: %s of 3", attempt)
    logger.info("Prompt Tokens: %s", prompt_tokens if prompt_tokens is not None else "unknown")
    logger.info("====================================")


def _log_gemini_request(*, model: object | None) -> None:
    """Log the actual SDK generate_content call that reaches Gemini."""

    request_number = next(GEMINI_REQUEST_COUNTER)
    agent = CURRENT_GEMINI_AGENT.get() or "unknown"
    attempt = CURRENT_GEMINI_ATTEMPT.get()
    logger.info("========== GEMINI REQUEST ==========")
    logger.info("Request #: %s", request_number)
    logger.info("Timestamp: %s", time.strftime("%Y-%m-%d %H:%M:%S %z"))
    logger.info("Agent: %s", agent)
    logger.info("Caller: google.genai.models.Models.generate_content")
    logger.info("Model: %s", model or "unknown")
    logger.info("Attempt: %s of 3", attempt if attempt is not None else "unknown")
    logger.info("====================================")


def _estimate_prompt_tokens(prompt: str | None) -> int | None:
    """Return a lightweight token estimate for request visibility."""

    if prompt is None:
        return None
    return max(1, len(prompt) // 4)


def _caller_name() -> str:
    """Return the first non-wrapper caller for debugging Gemini invocations."""

    for frame in inspect.stack()[2:8]:
        module = inspect.getmodule(frame.frame)
        module_name = module.__name__ if module else "<unknown>"
        if module_name != __name__:
            return f"{module_name}.{frame.function}:{frame.lineno}"
    return "<unknown>"


def _instrument_generate_content() -> None:
    """Patch google-genai once so every real Gemini request is counted."""

    if getattr(genai_models.Models.generate_content, "_ai_learning_instrumented", False):
        return

    def instrumented_generate_content(self, *args, **kwargs):
        model = kwargs.get("model")
        if model is None and args:
            model = args[0]
        _log_gemini_request(model=model)
        return _ORIGINAL_GENERATE_CONTENT(self, *args, **kwargs)

    instrumented_generate_content._ai_learning_instrumented = True
    genai_models.Models.generate_content = instrumented_generate_content


_instrument_generate_content()
