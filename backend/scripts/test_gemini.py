"""Smoke test for validating Gemini API connectivity.

Run this script after creating a local .env file with GEMINI_API_KEY set:

    python -m backend.scripts.test_gemini
"""

from __future__ import annotations

import sys
from pathlib import Path

from google import genai

from backend.utils.console import configure_utf8_output


configure_utf8_output(sys.stdout, sys.stderr)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.core.config import get_settings


GEMINI_MODEL = "gemini-flash-latest"


def main() -> int:
    """Send a minimal Gemini request and report the result."""

    try:
        settings = get_settings()
    except RuntimeError as exc:
        print("Gemini configuration is incomplete.")
        print(f"Details: {exc}")
        return 1

    client = genai.Client(api_key=settings.gemini_api_key)

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=(
                "Reply with exactly this sentence and nothing else: "
                "AI-Learning-Agent Gemini connection verified."
            ),
        )
    except Exception as exc:
        print("Gemini API connection test failed.")
        print("Check GEMINI_API_KEY, network connectivity, and Gemini API access.")
        print(f"Details: {exc}")
        return 1

    response_text = (response.text or "").strip()
    if not response_text:
        print("Gemini API connection test failed.")
        print("The API returned a successful response without text content.")
        return 1

    print("Gemini connection successful.")
    print(f"Model: {GEMINI_MODEL}")
    print(f"Model response: {response_text}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
