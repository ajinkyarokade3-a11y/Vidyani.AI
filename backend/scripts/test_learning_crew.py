"""Smoke test for the orchestrated learning crew workflow.

Run from the project root:

    python -m backend.scripts.test_learning_crew
"""

from __future__ import annotations

import json
import logging
import os
import re
import sys
import time

from backend.utils.console import configure_utf8_output


configure_utf8_output(sys.stdout, sys.stderr)

from backend.core.config import get_settings
from backend.crew.crew_manager import CrewManager
from backend.crew.learning_crew import LearningCrew
from backend.schemas.intent import LearnerIntent
from backend.schemas.learning_session import LearningSessionResponse
from backend.services.learning_session_service import run_learning_session


MAX_RATE_LIMIT_RETRIES = 1
DEFAULT_RETRY_SECONDS = 60


def _configure_logging() -> None:
    """Configure readable logging for the workflow smoke test."""

    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)s %(message)s",
    )


def _reset_settings_cache() -> None:
    """Clear cached settings after changing environment variables."""

    get_settings.cache_clear()


def _set_mock_mode(value: bool) -> str | None:
    """Temporarily set MOCK_MODE and return the previous value."""

    previous_value = os.environ.get("MOCK_MODE")
    os.environ["MOCK_MODE"] = "true" if value else "false"
    _reset_settings_cache()
    return previous_value


def _restore_mock_mode(previous_value: str | None) -> None:
    """Restore MOCK_MODE after a scenario."""

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


def _run_with_rate_limit_retry(user_request: str) -> LearningSessionResponse:
    """Run the workflow, waiting once if Gemini asks for quota backoff."""

    for attempt in range(MAX_RATE_LIMIT_RETRIES + 1):
        try:
            return run_learning_session(user_request)
        except Exception as exc:
            if not _is_rate_limit_error(exc) or attempt >= MAX_RATE_LIMIT_RETRIES:
                raise

            wait_seconds = _extract_retry_seconds(exc)
            print(
                "Gemini rate limit reached. "
                f"Waiting {wait_seconds} seconds before retrying the workflow."
            )
            time.sleep(wait_seconds)

    raise RuntimeError("Learning crew retry loop exited unexpectedly.")


def _print_response(response: LearningSessionResponse) -> None:
    """Print the final response as formatted JSON."""

    print(json.dumps(response.model_dump(mode="json"), indent=2))


def _run_scenario(name: str, user_request: str) -> LearningSessionResponse:
    """Run one workflow scenario and print its final response."""

    print("=" * 80)
    print(name)
    print(f"User request: {user_request}")
    response = run_learning_session(user_request)
    _print_response(response)
    return response


class _IncorrectCompletenessIntentCrew(LearningCrew):
    """Simulate an LLM response that incorrectly treats subject as required."""

    def run_intent(self, user_request: str) -> LearnerIntent:
        return LearnerIntent(
            learning_goal="Become a data scientist",
            subject=None,
            current_skill_level="Beginner",
            available_time="3 hours every day",
            target_deadline="3 months",
            preferred_learning_style=None,
            is_complete=False,
            missing_information=["subject"],
            follow_up_questions=["Which subject do you want to study?"],
        )


def _run_real_mode_scenario(user_request: str) -> int:
    """Run the optional real-mode scenario if configuration allows it."""

    print("=" * 80)
    print("Scenario 4: MOCK_MODE=False real Gemini workflow")
    try:
        settings = get_settings()
    except RuntimeError as exc:
        print("Real mode skipped because configuration is incomplete.")
        print(f"Details: {exc}")
        return 0

    if settings.mock_mode:
        print("Real mode skipped because MOCK_MODE=true.")
        print("Set MOCK_MODE=false to run the Learning Crew against Gemini.")
        return 0

    try:
        response = _run_with_rate_limit_retry(user_request)
    except Exception as exc:
        if _is_rate_limit_error(exc):
            print("Real mode stopped because Gemini quota is unavailable.")
            print(f"Details: {exc}")
            return 1

        print("Real mode workflow failed.")
        print(f"Details: {exc}")
        return 1

    _print_response(response)
    return 0


def main() -> int:
    """Demonstrate complete, incomplete, mock, and optional real workflows."""

    _configure_logging()
    complete_request = (
        "I want to learn Python from scratch in 3 months. "
        "I can study 2 hours daily."
    )

    previous_mock_mode = _set_mock_mode(True)
    try:
        scenario_1 = _run_scenario(
            "Scenario 1: Complete request reaches Nudge Agent",
            complete_request,
        )
        if not scenario_1.workflow_completed or scenario_1.nudge_report is None:
            print("Scenario 1 failed: workflow did not reach the Nudge Agent.")
            return 1

        regression_request = (
            "I want to become a data scientist in 3 months. "
            "I am a beginner. I can study 3 hours every day."
        )
        scenario_regression = CrewManager(
            learning_crew=_IncorrectCompletenessIntentCrew()
        ).run_learning_workflow(regression_request)
        _print_response(scenario_regression)
        if (
            not scenario_regression.workflow_completed
            or scenario_regression.current_stage != "completed"
            or scenario_regression.learning_plan is None
            or scenario_regression.progress_report is None
            or scenario_regression.feedback_report is None
            or scenario_regression.nudge_report is None
        ):
            print(
                "Regression scenario failed: four complete required fields did "
                "not reach every agent."
            )
            return 1

        scenario_2 = _run_scenario(
            "Scenario 2: Incomplete request stops after Intent Agent",
            "I want to learn AI.",
        )
        if scenario_2.workflow_completed or scenario_2.learning_plan is not None:
            print("Scenario 2 failed: workflow continued after incomplete intent.")
            return 1

        scenario_3 = _run_scenario(
            "Scenario 3: MOCK_MODE=True full workflow with no Gemini calls",
            complete_request,
        )
        if not scenario_3.workflow_completed:
            print("Scenario 3 failed: mock workflow did not complete.")
            return 1
    finally:
        _restore_mock_mode(previous_mock_mode)

    return _run_real_mode_scenario(complete_request)


if __name__ == "__main__":
    raise SystemExit(main())
