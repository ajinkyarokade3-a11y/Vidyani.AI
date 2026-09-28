"""Robustness test suite for the Intent Agent.

Run this script after setting GEMINI_API_KEY in the project root .env file:

    python -m backend.scripts.test_intent_agent
"""

from __future__ import annotations

import json
import re
import sys
import time
from dataclasses import dataclass

from backend.utils.console import configure_utf8_output


configure_utf8_output(sys.stdout, sys.stderr)

from backend.agents.intent_agent import analyze_learner_intent
from backend.schemas.intent import LearnerIntent


@dataclass(frozen=True)
class IntentTestCase:
    """A predefined Intent Agent robustness scenario."""

    name: str
    prompt: str
    expected_is_complete: bool
    expected_missing_fields: set[str]


TEST_CASES = [
    IntentTestCase(
        name="A. Complete beginner",
        prompt="I want to learn Python.",
        expected_is_complete=False,
        expected_missing_fields={
            "current_skill_level",
            "available_time",
            "target_deadline",
        },
    ),
    IntentTestCase(
        name="B. Intermediate learner",
        prompt=(
            "I know Python basics and want to learn machine learning in 4 months. "
            "I can study 2 hours every day."
        ),
        expected_is_complete=True,
        expected_missing_fields=set(),
    ),
    IntentTestCase(
        name="C. Career goal",
        prompt=(
            "I want to become a data scientist within 8 months. I know SQL and "
            "Python basics. I can study 3 hours every weekday and prefer "
            "project-based learning."
        ),
        expected_is_complete=True,
        expected_missing_fields=set(),
    ),
    IntentTestCase(
        name="D. Missing deadline",
        prompt="I want to learn React. I can study 1 hour every day.",
        expected_is_complete=False,
        expected_missing_fields={"current_skill_level", "target_deadline"},
    ),
    IntentTestCase(
        name="E. Missing available time",
        prompt="I want to become a full-stack developer in 6 months.",
        expected_is_complete=False,
        expected_missing_fields={"current_skill_level", "available_time"},
    ),
    IntentTestCase(
        name="F. Ambiguous request",
        prompt="I want to improve myself.",
        expected_is_complete=False,
        expected_missing_fields={
            "subject",
            "current_skill_level",
            "available_time",
            "target_deadline",
        },
    ),
    IntentTestCase(
        name="G. Exam preparation",
        prompt=(
            "I have my Data Structures exam in 3 weeks. I know arrays and linked "
            "lists but struggle with trees."
        ),
        expected_is_complete=False,
        expected_missing_fields={"available_time"},
    ),
    IntentTestCase(
        name="H. Upskilling",
        prompt=(
            "I'm a software engineer who wants to learn Kubernetes over the next "
            "2 months for work."
        ),
        expected_is_complete=False,
        expected_missing_fields={"available_time"},
    ),
]

SEPARATOR = "=" * 80
MAX_RATE_LIMIT_RETRIES = 1
DEFAULT_RETRY_SECONDS = 45


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


def _analyze_with_rate_limit_retry(prompt: str) -> LearnerIntent:
    """Run the Intent Agent, waiting once if Gemini asks for quota backoff."""

    for attempt in range(MAX_RATE_LIMIT_RETRIES + 1):
        try:
            return analyze_learner_intent(prompt)
        except Exception as exc:
            if not _is_rate_limit_error(exc) or attempt >= MAX_RATE_LIMIT_RETRIES:
                raise

            wait_seconds = _extract_retry_seconds(exc)
            print(
                "Gemini rate limit reached. "
                f"Waiting {wait_seconds} seconds before retrying this case."
            )
            time.sleep(wait_seconds)

    raise RuntimeError("Intent Agent retry loop exited unexpectedly.")


def _validate_response(test_case: IntentTestCase, intent: LearnerIntent) -> list[str]:
    """Return validation errors for one structured Intent Agent response."""

    errors: list[str] = []
    missing_fields = set(intent.missing_information)

    if intent.is_complete != test_case.expected_is_complete:
        errors.append(
            "Expected is_complete to be "
            f"{test_case.expected_is_complete}, got {intent.is_complete}."
        )

    missing_expected = test_case.expected_missing_fields - missing_fields
    if missing_expected:
        errors.append(
            "Expected missing fields were not reported: "
            f"{sorted(missing_expected)}."
        )

    for field_name in test_case.expected_missing_fields:
        if getattr(intent, field_name) is not None:
            errors.append(
                f"Field '{field_name}' should be null when missing, "
                f"got {getattr(intent, field_name)!r}."
            )

    if not intent.is_complete and not intent.follow_up_questions:
        errors.append("Incomplete intent should include follow-up questions.")

    return errors


def main() -> int:
    """Run the Intent Agent against predefined learner request scenarios."""

    failures = 0

    for index, test_case in enumerate(TEST_CASES, start=1):
        print(SEPARATOR)
        print(f"Test Case {index}: {test_case.name}")
        print(f"Input Prompt: {test_case.prompt}")

        try:
            intent = _analyze_with_rate_limit_retry(test_case.prompt)
        except RuntimeError as exc:
            print("Intent Agent configuration is incomplete.")
            print(f"Details: {exc}")
            return 1
        except Exception as exc:
            if _is_rate_limit_error(exc):
                print("Intent Agent test suite stopped because Gemini quota is unavailable.")
                print(f"Details: {exc}")
                return 1

            print("Intent Agent test case failed.")
            print(f"Details: {exc}")
            failures += 1
            continue

        response = intent.model_dump()
        print("Structured JSON Response:")
        print(json.dumps(response, indent=2))
        print(f"is_complete: {intent.is_complete}")

        if not intent.is_complete:
            print("Missing information identified:")
            for item in intent.missing_information:
                print(f"- {item}")

            print("Follow-up questions:")
            for question in intent.follow_up_questions:
                print(f"- {question}")

        validation_errors = _validate_response(test_case, intent)
        if validation_errors:
            failures += 1
            print("Validation result: FAILED")
            for error in validation_errors:
                print(f"- {error}")
        else:
            print("Validation result: PASSED")

    print(SEPARATOR)
    print(f"Intent Agent test suite completed with {failures} execution failure(s).")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
