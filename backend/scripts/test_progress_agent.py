"""Smoke test for the Progress Agent.

Run this script after setting GEMINI_API_KEY in the project root .env file:

    python -m backend.scripts.test_progress_agent
"""

from __future__ import annotations

import json
import os
import re
import sys
import time

from backend.utils.console import configure_utf8_output


configure_utf8_output(sys.stdout, sys.stderr)

from backend.agents.progress_agent import (
    ProgressValidationError,
    generate_progress_report,
)
from backend.core.config import get_settings
from backend.schemas.planner import LearningPhase, LearningPlan
from backend.schemas.progress import LearnerProgress, ProgressReport


MAX_RATE_LIMIT_RETRIES = 1
DEFAULT_RETRY_SECONDS = 60


def _reset_settings_cache() -> None:
    """Clear cached settings after changing environment variables in this script."""

    get_settings.cache_clear()


def _set_mock_mode_for_demo(value: bool) -> str | None:
    """Temporarily set MOCK_MODE for an isolated progress demo."""

    previous_value = os.environ.get("MOCK_MODE")
    os.environ["MOCK_MODE"] = "true" if value else "false"
    _reset_settings_cache()
    return previous_value


def _restore_mock_mode_for_demo(previous_value: str | None) -> None:
    """Restore MOCK_MODE after an isolated progress demo."""

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


def _generate_with_rate_limit_retry(
    plan: LearningPlan,
    progress: LearnerProgress,
) -> ProgressReport:
    """Generate a report, waiting once if Gemini asks for quota backoff."""

    for attempt in range(MAX_RATE_LIMIT_RETRIES + 1):
        try:
            return generate_progress_report(plan, progress)
        except Exception as exc:
            if not _is_rate_limit_error(exc) or attempt >= MAX_RATE_LIMIT_RETRIES:
                raise

            wait_seconds = _extract_retry_seconds(exc)
            print(
                "Gemini rate limit reached. "
                f"Waiting {wait_seconds} seconds before retrying the report."
            )
            time.sleep(wait_seconds)

    raise RuntimeError("Progress Agent retry loop exited unexpectedly.")


def _sample_learning_plan() -> LearningPlan:
    """Return a sample LearningPlan for Progress Agent validation."""

    return LearningPlan(
        learning_goal="Become job-ready for junior data analysis roles",
        subject="Python for data analysis",
        learner_level="Basic programming knowledge and beginner Python",
        total_available_time="2 hours every weekday",
        target_deadline="12 weeks",
        preferred_learning_style="Project-based learning",
        overview="A phased roadmap for learning Python data analysis skills.",
        phases=[
            LearningPhase(
                phase_number=1,
                title="Python Data Foundations",
                objective="Build comfort with Python data analysis basics.",
                recommended_topics=[
                    "Python syntax refresh",
                    "Data structures",
                    "Working with CSV files",
                ],
                estimated_duration="2 weeks",
                milestones=["Load and inspect a CSV dataset"],
                suggested_resource_categories=[
                    "Documentation",
                    "Practice exercises",
                    "Videos",
                ],
            ),
            LearningPhase(
                phase_number=2,
                title="Data Analysis Libraries",
                objective="Analyze datasets using standard Python libraries.",
                recommended_topics=[
                    "NumPy basics",
                    "Pandas DataFrames",
                    "Data cleaning",
                ],
                estimated_duration="4 weeks",
                milestones=["Clean and summarize a real dataset"],
                suggested_resource_categories=[
                    "Documentation",
                    "Guided tutorials",
                    "Projects",
                ],
            ),
            LearningPhase(
                phase_number=3,
                title="Visualization and Portfolio Project",
                objective="Communicate insights with visuals and a project.",
                recommended_topics=[
                    "Data visualization",
                    "Exploratory analysis",
                    "Portfolio project writeup",
                ],
                estimated_duration="6 weeks",
                milestones=["Publish a portfolio-style analysis project"],
                suggested_resource_categories=[
                    "Projects",
                    "Official guides",
                    "Peer review checklists",
                ],
            ),
        ],
        final_milestone="Complete and present a data analysis portfolio project.",
    )


def _sample_complete_progress() -> LearnerProgress:
    """Return complete progress data for report generation."""

    return LearnerProgress(
        completed_phases=[1],
        completed_topics=[
            "Python syntax refresh",
            "Data structures",
            "Working with CSV files",
            "NumPy basics",
        ],
        current_phase=2,
        completed_milestones=["Load and inspect a CSV dataset"],
        completion_percentage=38,
        recent_activity="Finished NumPy array practice and started Pandas notes.",
    )


def _sample_incomplete_progress() -> LearnerProgress:
    """Return inconsistent progress data to verify validation behavior."""

    return LearnerProgress(
        completed_phases=[],
        completed_topics=[],
        current_phase=2,
        completed_milestones=[],
        completion_percentage=25,
        recent_activity=None,
    )


def main() -> int:
    """Run Progress Agent validation, mock mode, and optional real mode checks."""

    plan = _sample_learning_plan()
    progress = _sample_complete_progress()

    print("Validating incomplete progress handling...")
    try:
        generate_progress_report(plan, _sample_incomplete_progress())
    except ProgressValidationError as exc:
        print("Progress validation correctly blocked report generation.")
        print(f"Validation error: {exc}")
    else:
        print("Progress validation failed: incomplete progress generated a report.")
        return 1

    print("=" * 80)
    print("Mock Mode demonstration:")
    previous_mock_mode = _set_mock_mode_for_demo(True)
    try:
        mock_report = generate_progress_report(plan, progress)
    finally:
        _restore_mock_mode_for_demo(previous_mock_mode)

    print("Progress source: Mock Mode")
    print(json.dumps(mock_report.model_dump(), indent=2))

    print("=" * 80)
    try:
        settings = get_settings()
    except RuntimeError as exc:
        print("Real Mode demonstration skipped because configuration is incomplete.")
        print(f"Details: {exc}")
        return 0

    if settings.mock_mode:
        print("Real Mode demonstration skipped because MOCK_MODE=true.")
        print("Set MOCK_MODE=false to run the Progress Agent against Gemini.")
        return 0

    print("Real Mode demonstration:")
    print("Progress source: Gemini")
    try:
        report = _generate_with_rate_limit_retry(plan, progress)
    except RuntimeError as exc:
        print("Progress Agent configuration is incomplete.")
        print(f"Details: {exc}")
        return 1
    except Exception as exc:
        if _is_rate_limit_error(exc):
            print("Progress Agent smoke test stopped because Gemini quota is unavailable.")
            print(f"Details: {exc}")
            return 1

        print("Progress Agent smoke test failed.")
        print(f"Details: {exc}")
        return 1

    print("Gemini Progress Agent response:")
    print(json.dumps(report.model_dump(), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
