"""Smoke test for the Planner Agent.

Run this script after setting GEMINI_API_KEY in the project root .env file:

    python -m backend.scripts.test_planner_agent
"""

from __future__ import annotations

import json
import os
import re
import sys
import time

from backend.utils.console import configure_utf8_output


configure_utf8_output(sys.stdout, sys.stderr)

from backend.agents.planner_agent import (
    PlannerValidationError,
    generate_learning_plan,
)
from backend.core.config import get_settings
from backend.schemas.intent import LearnerIntent
from backend.schemas.planner import LearningPlan


MAX_RATE_LIMIT_RETRIES = 1
DEFAULT_RETRY_SECONDS = 60


def _reset_settings_cache() -> None:
    """Clear cached settings after changing environment variables in this script."""

    get_settings.cache_clear()


def _set_mock_mode_for_demo(value: bool) -> str | None:
    """Temporarily set MOCK_MODE for an isolated planner demo."""

    previous_value = os.environ.get("MOCK_MODE")
    os.environ["MOCK_MODE"] = "true" if value else "false"
    _reset_settings_cache()
    return previous_value


def _restore_mock_mode_for_demo(previous_value: str | None) -> None:
    """Restore MOCK_MODE after an isolated planner demo."""

    if previous_value is None:
        os.environ.pop("MOCK_MODE", None)
    else:
        os.environ["MOCK_MODE"] = previous_value
    _reset_settings_cache()


def _extract_retry_seconds(error: Exception) -> int:
    """Extract Gemini retry guidance from an exception string when present."""

    message = str(error)
    retry_delay_match = re.search(r"retryDelay': '(\d+)s'", message)
    if retry_delay_match:
        return int(retry_delay_match.group(1)) + 2

    retry_in_match = re.search(r"retry in ([\d.]+)s", message, re.IGNORECASE)
    if retry_in_match:
        return int(float(retry_in_match.group(1))) + 2

    return DEFAULT_RETRY_SECONDS


def _is_rate_limit_error(error: Exception) -> bool:
    """Return whether an exception came from Gemini quota or rate limiting."""

    message = str(error)
    return "429" in message or "RESOURCE_EXHAUSTED" in message


def _generate_with_rate_limit_retry(intent: LearnerIntent) -> LearningPlan:
    """Generate a plan, waiting once if Gemini asks for quota backoff."""

    for attempt in range(MAX_RATE_LIMIT_RETRIES + 1):
        try:
            return generate_learning_plan(intent)
        except Exception as exc:
            if not _is_rate_limit_error(exc) or attempt >= MAX_RATE_LIMIT_RETRIES:
                raise

            wait_seconds = _extract_retry_seconds(exc)
            print(
                "Gemini rate limit reached. "
                f"Waiting {wait_seconds} seconds before retrying the plan."
            )
            time.sleep(wait_seconds)

    raise RuntimeError("Planner Agent retry loop exited unexpectedly.")


def _sample_complete_intent() -> LearnerIntent:
    """Return a complete LearnerIntent for Planner Agent validation."""

    return LearnerIntent(
        learning_goal="Become job-ready for junior data analysis roles",
        subject="Python for data analysis",
        current_skill_level="Basic programming knowledge and beginner Python",
        available_time="2 hours every weekday",
        target_deadline="12 weeks",
        preferred_learning_style="Project-based learning",
        is_complete=True,
        missing_information=[],
        follow_up_questions=[],
    )


def _sample_incomplete_intent() -> LearnerIntent:
    """Return an incomplete LearnerIntent to verify validation behavior."""

    return LearnerIntent(
        learning_goal="Learn React",
        subject="React",
        current_skill_level=None,
        available_time="1 hour every day",
        target_deadline=None,
        preferred_learning_style=None,
        is_complete=False,
        missing_information=["current_skill_level", "target_deadline"],
        follow_up_questions=[
            "What is your current JavaScript or React skill level?",
            "Do you have a target deadline for learning React?",
        ],
    )


def main() -> int:
    """Run Planner Agent validation and roadmap generation checks."""

    complete_intent = _sample_complete_intent()

    print("Validating incomplete intent handling...")
    try:
        generate_learning_plan(_sample_incomplete_intent())
    except PlannerValidationError as exc:
        print("Planner validation correctly blocked roadmap generation.")
        print(f"Validation error: {exc}")
    else:
        print("Planner validation failed: incomplete intent generated a roadmap.")
        return 1

    print("=" * 80)
    print("Mock Mode demonstration:")
    previous_mock_mode = _set_mock_mode_for_demo(True)
    try:
        mock_plan = generate_learning_plan(complete_intent)
    finally:
        _restore_mock_mode_for_demo(previous_mock_mode)

    print("Planner source: Mock Mode")
    print(json.dumps(mock_plan.model_dump(), indent=2))

    print("=" * 80)
    try:
        settings = get_settings()
    except RuntimeError as exc:
        print("Real Mode demonstration skipped because configuration is incomplete.")
        print(f"Details: {exc}")
        return 0

    if settings.mock_mode:
        print("Real Mode demonstration skipped because MOCK_MODE=true.")
        print("Set MOCK_MODE=false to run the Planner Agent against Gemini.")
        return 0

    print("Real Mode demonstration:")
    print("Planner source: Gemini")
    try:
        plan = _generate_with_rate_limit_retry(complete_intent)
    except RuntimeError as exc:
        print("Planner Agent configuration is incomplete.")
        print(f"Details: {exc}")
        return 1
    except Exception as exc:
        if _is_rate_limit_error(exc):
            print("Planner Agent smoke test stopped because Gemini quota is unavailable.")
            print(f"Details: {exc}")
            return 1

        print("Planner Agent smoke test failed.")
        print(f"Details: {exc}")
        return 1

    print("Gemini Planner Agent response:")
    print(json.dumps(plan.model_dump(), indent=2))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
