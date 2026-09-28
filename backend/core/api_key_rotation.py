"""Reusable sticky API-key rotation helpers for provider integrations."""

from __future__ import annotations

import logging
from threading import Lock
from dataclasses import dataclass
from typing import Callable, TypeVar


logger = logging.getLogger(__name__)
T = TypeVar("T")


@dataclass(frozen=True)
class ApiKey:
    """A configured API key with its environment-variable slot number."""

    slot: int
    value: str


class StickyApiKeyPool:
    """Try keys from the active slot and rotate only after retryable failures."""

    def __init__(self, provider: str, keys: list[ApiKey]) -> None:
        if not keys:
            raise RuntimeError(f"No valid {provider} API keys are configured.")
        self.provider = provider
        self.keys = tuple(keys)
        self.active_index = 0
        self._lock = Lock()
        logger.info("Loaded %s %s API keys.", len(self.keys), provider)

    def execute(
        self,
        operation: Callable[[str], T],
        *,
        is_retryable: Callable[[Exception], bool],
    ) -> T:
        """Execute an operation against each available key at most once."""

        first_error: Exception | None = None
        with self._lock:
            start_index = self.active_index
        for offset in range(len(self.keys)):
            index = (start_index + offset) % len(self.keys)
            api_key = self.keys[index]
            try:
                result = operation(api_key.value)
                with self._lock:
                    self.active_index = index
                return result
            except Exception as exc:
                if not is_retryable(exc):
                    raise
                first_error = first_error or exc
                logger.warning(
                    "%s quota/rate limit on key #%s.",
                    self.provider,
                    api_key.slot,
                )
                if offset < len(self.keys) - 1:
                    next_index = (start_index + offset + 1) % len(self.keys)
                    next_key = self.keys[next_index]
                    with self._lock:
                        self.active_index = next_index
                    logger.warning(
                        "Switching to %s key #%s.",
                        self.provider,
                        next_key.slot,
                    )

        assert first_error is not None
        raise first_error


def load_api_keys(
    prefix: str,
    *,
    legacy_name: str | None = None,
) -> list[ApiKey]:
    """Load numbered keys, optionally falling back to one legacy variable."""

    import os

    keys: list[ApiKey] = []
    for slot in range(1, 5):
        value = os.getenv(f"{prefix}_{slot}", "").strip()
        if value:
            keys.append(ApiKey(slot=slot, value=value))

    if not keys and legacy_name:
        legacy_value = os.getenv(legacy_name, "").strip()
        if legacy_value:
            keys.append(ApiKey(slot=1, value=legacy_value))
    return keys
