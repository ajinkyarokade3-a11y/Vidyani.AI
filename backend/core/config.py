"""Application configuration loaded from environment variables.

This module is intentionally small at the scaffold stage. It loads local
environment variables, validates required secrets, and exposes a cached settings
object that future backend modules can import.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

from backend.core.api_key_rotation import load_api_keys

PROJECT_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = PROJECT_ROOT / ".env"

load_dotenv(dotenv_path=ENV_FILE)


@dataclass(frozen=True)
class Settings:
    """Runtime settings shared across the backend application."""

    gemini_api_key: str | None
    gemini_api_keys: tuple[str, ...] = ()
    mock_mode: bool = False
    database_url: str | None = None
    redis_url: str | None = None
    youtube_api_key: str | None = None
    youtube_api_keys: tuple[str, ...] = ()
    google_client_id: str | None = None
    google_client_secret: str | None = None


def _required_env(name: str) -> str:
    """Return a required environment variable or raise a clear setup error."""

    value = os.getenv(name)
    if value is not None:
        value = value.strip()
    if not value:
        raise RuntimeError(
            f"{name} is required. Add it to {ENV_FILE} or your environment."
        )
    return value


def _optional_env(name: str) -> str | None:
    """Return an optional environment variable with blank values normalized."""

    value = os.getenv(name)
    if value is not None:
        value = value.strip()
    return value or None


def _env_bool(name: str, default: bool = False) -> bool:
    """Parse a boolean environment variable."""

    value = os.getenv(name)
    if value is None:
        return default

    normalized_value = value.strip().lower()
    if normalized_value in {"1", "true", "yes", "y", "on"}:
        return True
    if normalized_value in {"0", "false", "no", "n", "off"}:
        return False

    raise RuntimeError(
        f"{name} must be a boolean value such as true or false. "
        f"Update {ENV_FILE} or your environment."
    )


@lru_cache
def get_settings() -> Settings:
    """Create and cache application settings for reuse across modules."""

    mock_mode = _env_bool("MOCK_MODE", default=False)
    gemini_keys = load_api_keys(
        "GEMINI_API_KEY",
        legacy_name="GEMINI_API_KEY",
    )
    if not gemini_keys and not mock_mode:
        raise RuntimeError(
            "At least one Gemini API key is required. Configure "
            "GEMINI_API_KEY_1 through GEMINI_API_KEY_4."
        )
    youtube_keys = load_api_keys(
        "YOUTUBE_API_KEY",
        legacy_name="YOUTUBE_API_KEY",
    )
    return Settings(
        gemini_api_key=gemini_keys[0].value if gemini_keys else None,
        gemini_api_keys=tuple(key.value for key in gemini_keys),
        mock_mode=mock_mode,
        database_url=os.getenv("DATABASE_URL"),
        redis_url=os.getenv("REDIS_URL"),
        youtube_api_key=youtube_keys[0].value if youtube_keys else None,
        youtube_api_keys=tuple(key.value for key in youtube_keys),
        google_client_id=os.getenv("GOOGLE_CLIENT_ID"),
        google_client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    )
