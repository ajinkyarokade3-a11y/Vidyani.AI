"""End-to-end real Gemini integration test for Crew Orchestration.

This script forces MOCK_MODE=false and executes the full learning workflow
through the Learning Session Service.

Run from the project root:

    python -m backend.scripts.test_learning_crew_real
"""

from __future__ import annotations

import json
import logging
import os
import sys
import time
from typing import Any

from pydantic import BaseModel, ValidationError

from backend.utils.console import configure_utf8_output


configure_utf8_output(sys.stdout, sys.stderr)

os.environ["MOCK_MODE"] = "false"

from backend.core.config import get_settings
from backend.schemas.feedback import FeedbackReport
from backend.schemas.intent import LearnerIntent
from backend.schemas.learning_session import LearningSessionResponse
from backend.schemas.nudge import NudgeReport
from backend.schemas.planner import LearningPlan
from backend.schemas.progress import ProgressReport
from backend.services.learning_session_service import run_learning_session


USER_REQUEST = """
I want to become job-ready in Python for Data Science within 4 months.

I am currently a beginner with basic programming knowledge.

I can study for 2 hours every weekday and 4 hours on weekends.

I prefer hands-on learning with projects and coding exercises over long theoretical lessons.

My goal is to build a strong portfolio, complete 3 end-to-end projects, and prepare for technical interviews for Data Science internships.
"""

STAGE_SCHEMAS: tuple[tuple[str, str, type[BaseModel]], ...] = (
    ("Intent Agent", "learner_intent", LearnerIntent),
    ("Planner Agent", "learning_plan", LearningPlan),
    ("Progress Agent", "progress_report", ProgressReport),
    ("Feedback Agent", "feedback_report", FeedbackReport),
    ("Nudge Agent", "nudge_report", NudgeReport),
)


def _configure_logging() -> None:
    """Configure stage-level logging for the real integration test."""

    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)s %(message)s",
    )


def _print_banner(message: str) -> None:
    """Print a readable section banner."""

    print("=" * 50)
    print(message)
    print("=" * 50)


def _print_json(value: Any) -> None:
    """Print any Pydantic-compatible object as formatted JSON."""

    if isinstance(value, BaseModel):
        payload = value.model_dump()
    else:
        payload = value
    print(json.dumps(payload, indent=2))


def _validate_schema(
    agent_name: str,
    output: BaseModel | None,
    schema: type[BaseModel],
) -> bool:
    """Validate an agent output against its Pydantic schema."""

    if output is None:
        print(f"{agent_name} schema validation: FAIL")
        print(f"{agent_name} output is missing.")
        return False

    try:
        schema.model_validate(output.model_dump())
    except ValidationError as exc:
        print(f"{agent_name} schema validation: FAIL")
        print(exc)
        return False

    print(f"{agent_name} schema validation: PASS")
    return True


def _print_stage_result(
    agent_name: str,
    field_name: str,
    schema: type[BaseModel],
    response: LearningSessionResponse,
) -> bool:
    """Print and validate one agent output from the workflow response."""

    output = getattr(response, field_name)
    print()
    print(f"{agent_name}")
    print("-" * len(agent_name))
    print("Structured output:")
    _print_json(output.model_dump() if output is not None else None)
    return _validate_schema(agent_name, output, schema)


def _print_stage_timeline(response: LearningSessionResponse) -> int:
    """Print the expected execution timeline based on returned outputs."""

    agents_executed = 0
    for agent_name, field_name, _schema in STAGE_SCHEMAS:
        print(f"{agent_name} Started")
        if getattr(response, field_name) is None:
            print(f"{agent_name} Failed")
            break
        agents_executed += 1
        print(f"{agent_name} Completed")
    return agents_executed


def _validate_final_conditions(response: LearningSessionResponse) -> bool:
    """Verify the required end-to-end workflow conditions."""

    checks = {
        "LearnerIntent.is_complete == True": (
            response.learner_intent is not None
            and response.learner_intent.is_complete is True
        ),
        "LearningPlan is not None": response.learning_plan is not None,
        "ProgressReport is not None": response.progress_report is not None,
        "FeedbackReport is not None": response.feedback_report is not None,
        "NudgeReport is not None": response.nudge_report is not None,
        "workflow_completed == True": response.workflow_completed is True,
    }

    print()
    print("Automatic verification:")
    for check_name, passed in checks.items():
        print(f"{check_name}: {'PASS' if passed else 'FAIL'}")

    return all(checks.values())


def main() -> int:
    """Execute the real Gemini integration test."""

    _configure_logging()
    get_settings.cache_clear()
    start_time = time.perf_counter()
    agents_executed = 0

    _print_banner("Starting Learning Workflow")
    print("MOCK_MODE=False")
    print("Input user request:")
    print(USER_REQUEST.strip())

    try:
        settings = get_settings()
        if settings.mock_mode:
            raise RuntimeError("MOCK_MODE is still true after forcing it to false.")

        response = run_learning_session(USER_REQUEST)
    except Exception as exc:
        elapsed_seconds = time.perf_counter() - start_time
        _print_banner("Workflow Failed")
        print("Stage failed: workflow_start")
        print(f"Exception: {exc}")
        print("Execution statistics:")
        print(f"Total execution time: {elapsed_seconds:.2f} seconds")
        print(f"Number of agents executed: {agents_executed}")
        print("Workflow status: Failed")
        return 1

    print()
    agents_executed = _print_stage_timeline(response)

    if response.error_message:
        elapsed_seconds = time.perf_counter() - start_time
        failed_stage = response.current_stage
        _print_banner("Workflow Failed")
        print(f"Stage failed: {failed_stage}")
        print(f"Exception: {response.error_message}")
        print("Execution statistics:")
        print(f"Total execution time: {elapsed_seconds:.2f} seconds")
        print(f"Number of agents executed: {agents_executed}")
        print("Workflow status: Failed")
        return 1

    all_stage_outputs_valid = True
    for agent_name, field_name, schema in STAGE_SCHEMAS:
        is_valid = _print_stage_result(agent_name, field_name, schema, response)
        all_stage_outputs_valid = all_stage_outputs_valid and is_valid
        if not is_valid:
            elapsed_seconds = time.perf_counter() - start_time
            _print_banner("Workflow Failed")
            print(f"Stage failed: {agent_name}")
            print("Exception: Pydantic schema validation failed.")
            print("Execution statistics:")
            print(f"Total execution time: {elapsed_seconds:.2f} seconds")
            print(f"Number of agents executed: {agents_executed}")
            print("Workflow status: Failed")
            return 1

    final_conditions_valid = _validate_final_conditions(response)

    print()
    print("Final LearningSessionResponse:")
    _print_json(response)

    elapsed_seconds = time.perf_counter() - start_time
    success = all_stage_outputs_valid and final_conditions_valid

    _print_banner(
        "Workflow Completed Successfully" if success else "Workflow Failed"
    )
    print("Execution statistics:")
    print(f"Total execution time: {elapsed_seconds:.2f} seconds")
    print(f"Number of agents executed: {agents_executed}")
    print(f"Workflow status: {'Success' if success else 'Failed'}")

    return 0 if success else 1


if __name__ == "__main__":
    raise SystemExit(main())
