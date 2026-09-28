"""Mock-mode validation suite for the Nudge Agent.

This script forces MOCK_MODE=true so no Gemini API calls are made:

    python -m backend.scripts.test_nudge_agent
"""

from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass

from backend.utils.console import configure_utf8_output


configure_utf8_output(sys.stdout, sys.stderr)

from backend.agents.nudge_agent import (
    NudgeValidationError,
    generate_nudge_report,
)
from backend.core.config import get_settings
from backend.schemas.feedback import FeedbackReport
from backend.schemas.nudge import NudgeReport
from backend.schemas.planner import LearningPhase, LearningPlan
from backend.schemas.progress import ProgressReport


@dataclass(frozen=True)
class ExpectedNudge:
    """Expected NudgeReport fields for a mock test scenario."""

    intervention_required: bool
    learner_status: str
    nudge_type: str
    urgency: str


@dataclass(frozen=True)
class NudgeTestCase:
    """Complete input and expected output for one mock nudge test."""

    name: str
    plan: LearningPlan
    progress_report: ProgressReport
    feedback_report: FeedbackReport
    expected: ExpectedNudge


def _enable_mock_mode() -> str | None:
    """Force MOCK_MODE=true for this test suite and return the previous value."""

    previous_value = os.environ.get("MOCK_MODE")
    os.environ["MOCK_MODE"] = "true"
    get_settings.cache_clear()
    return previous_value


def _restore_mock_mode(previous_value: str | None) -> None:
    """Restore the previous MOCK_MODE value after the test suite finishes."""

    if previous_value is None:
        os.environ.pop("MOCK_MODE", None)
    else:
        os.environ["MOCK_MODE"] = previous_value
    get_settings.cache_clear()


def _sample_learning_plan() -> LearningPlan:
    """Return a sample LearningPlan with phases used by all mock scenarios."""

    return LearningPlan(
        learning_goal="Build job-ready Python data analysis skills",
        subject="Python for data analysis",
        learner_level="Beginner",
        total_available_time="2 hours every weekday",
        target_deadline="12 weeks",
        preferred_learning_style="Project-based learning",
        overview="A phased roadmap from Python fundamentals to portfolio work.",
        phases=[
            LearningPhase(
                phase_number=1,
                title="Python Fundamentals",
                objective="Build confidence with core Python concepts.",
                recommended_topics=[
                    "Python syntax refresh",
                    "Data structures",
                    "Working with CSV files",
                ],
                estimated_duration="3 weeks",
                milestones=["Complete Python fundamentals exercises"],
                suggested_resource_categories=[
                    "Documentation",
                    "Practice exercises",
                    "Videos",
                ],
            ),
            LearningPhase(
                phase_number=2,
                title="NumPy",
                objective="Use NumPy for numerical data operations.",
                recommended_topics=[
                    "NumPy arrays",
                    "Array operations",
                    "Basic numerical analysis",
                ],
                estimated_duration="3 weeks",
                milestones=["Complete a NumPy practice notebook"],
                suggested_resource_categories=[
                    "Documentation",
                    "Guided tutorials",
                    "Projects",
                ],
            ),
            LearningPhase(
                phase_number=3,
                title="Pandas and Visualization",
                objective="Analyze and communicate insights from datasets.",
                recommended_topics=[
                    "Pandas DataFrames",
                    "Data cleaning",
                    "Data visualization",
                ],
                estimated_duration="4 weeks",
                milestones=["Clean and visualize a real dataset"],
                suggested_resource_categories=[
                    "Projects",
                    "Official guides",
                    "Peer review checklists",
                ],
            ),
        ],
        final_milestone="Complete and present a data analysis portfolio project.",
    )


def _feedback_for(status_label: str, focus: str) -> FeedbackReport:
    """Return complete feedback tailored to a mock scenario."""

    return FeedbackReport(
        overall_performance_assessment=(
            f"The learner is {status_label} and should focus on {focus}."
        ),
        strengths=[
            "The learner has clear evidence of recent study progress.",
            "The next learning focus is specific and actionable.",
        ],
        areas_for_improvement=[
            f"Spend focused practice time on {focus}.",
            "Keep the next session limited to one measurable outcome.",
        ],
        personalized_study_recommendations=[
            f"Review notes, then complete one exercise related to {focus}.",
            "Write down what was completed before ending the session.",
        ],
        motivation_message="Consistent small sessions will keep the roadmap moving.",
        next_study_session_focus=f"Practice {focus} with one focused exercise.",
    )


def _phase_title(plan: LearningPlan, phase_number: int) -> str:
    """Return a human-readable phase title for printed test input."""

    for phase in plan.phases:
        if phase.phase_number == phase_number:
            return phase.title
    return f"Phase {phase_number}"


def _test_cases() -> list[NudgeTestCase]:
    """Build all required mock nudge test cases."""

    plan = _sample_learning_plan()

    return [
        NudgeTestCase(
            name="A. Learner On Track",
            plan=plan,
            progress_report=ProgressReport(
                current_phase=1,
                overall_completion_percentage=45,
                completed_topics=[
                    "Python syntax refresh",
                    "Data structures",
                ],
                remaining_topics=[
                    "Working with CSV files",
                    "NumPy arrays",
                    "Array operations",
                    "Basic numerical analysis",
                    "Pandas DataFrames",
                    "Data cleaning",
                    "Data visualization",
                ],
                completed_milestones=[],
                next_recommended_task="Complete Working with CSV files practice",
                learner_status="On Track",
                summary="The learner is on track in Python Fundamentals.",
            ),
            feedback_report=_feedback_for("on track", "Working with CSV files"),
            expected=ExpectedNudge(
                intervention_required=False,
                learner_status="On Track",
                nudge_type="Motivation",
                urgency="Low",
            ),
        ),
        NudgeTestCase(
            name="B. Learner Behind Schedule",
            plan=plan,
            progress_report=ProgressReport(
                current_phase=1,
                overall_completion_percentage=30,
                completed_topics=["Python syntax refresh"],
                remaining_topics=[
                    "Data structures",
                    "Working with CSV files",
                    "NumPy arrays",
                    "Array operations",
                    "Basic numerical analysis",
                    "Pandas DataFrames",
                    "Data cleaning",
                    "Data visualization",
                ],
                completed_milestones=[],
                next_recommended_task="Review and practice Data structures",
                learner_status="Behind",
                summary="The learner is behind schedule in Python Fundamentals.",
            ),
            feedback_report=_feedback_for("behind schedule", "Data structures"),
            expected=ExpectedNudge(
                intervention_required=True,
                learner_status="Behind",
                nudge_type="Reminder",
                urgency="Medium",
            ),
        ),
        NudgeTestCase(
            name="C. Learner Inactive",
            plan=plan,
            progress_report=ProgressReport(
                current_phase=1,
                overall_completion_percentage=30,
                completed_topics=["Python syntax refresh"],
                remaining_topics=[
                    "Data structures",
                    "Working with CSV files",
                    "NumPy arrays",
                    "Array operations",
                    "Basic numerical analysis",
                    "Pandas DataFrames",
                    "Data cleaning",
                    "Data visualization",
                ],
                completed_milestones=[],
                next_recommended_task="Resume with Data structures review",
                learner_status="Behind",
                summary=(
                    "The learner is in Python Fundamentals. Last activity: "
                    "10 days ago. The learner appears inactive."
                ),
            ),
            feedback_report=_feedback_for("inactive", "Data structures"),
            expected=ExpectedNudge(
                intervention_required=True,
                learner_status="Inactive",
                nudge_type="Warning",
                urgency="High",
            ),
        ),
        NudgeTestCase(
            name="D. Learner Ahead of Schedule",
            plan=plan,
            progress_report=ProgressReport(
                current_phase=2,
                overall_completion_percentage=80,
                completed_topics=[
                    "Python syntax refresh",
                    "Data structures",
                    "Working with CSV files",
                    "NumPy arrays",
                    "Array operations",
                ],
                remaining_topics=[
                    "Basic numerical analysis",
                    "Pandas DataFrames",
                    "Data cleaning",
                    "Data visualization",
                ],
                completed_milestones=[
                    "Complete Python fundamentals exercises",
                    "Complete a NumPy practice notebook",
                ],
                next_recommended_task="Deepen Basic numerical analysis practice",
                learner_status="Ahead",
                summary="The learner is ahead of schedule in the NumPy phase.",
            ),
            feedback_report=_feedback_for("ahead of schedule", "Basic numerical analysis"),
            expected=ExpectedNudge(
                intervention_required=False,
                learner_status="Ahead",
                nudge_type="Congratulations",
                urgency="Low",
            ),
        ),
    ]


def _input_snapshot(test_case: NudgeTestCase) -> dict[str, object]:
    """Return relevant input data for readable test output."""

    progress = test_case.progress_report
    return {
        "progress_percentage": progress.overall_completion_percentage,
        "current_phase": _phase_title(test_case.plan, progress.current_phase),
        "current_phase_number": progress.current_phase,
        "progress_status": progress.learner_status,
        "summary": progress.summary,
        "next_recommended_task": progress.next_recommended_task,
        "feedback_next_focus": test_case.feedback_report.next_study_session_focus,
    }


def _matches_expected(nudge: NudgeReport, expected: ExpectedNudge) -> bool:
    """Return whether a NudgeReport matches the expected mock behavior."""

    return (
        nudge.intervention_required == expected.intervention_required
        and nudge.learner_status == expected.learner_status
        and nudge.nudge_type == expected.nudge_type
        and nudge.urgency == expected.urgency
    )


def _print_result_fields(nudge: NudgeReport) -> None:
    """Print the key fields requested for every test case."""

    print(f"intervention_required: {nudge.intervention_required}")
    print(f"learner_status: {nudge.learner_status}")
    print(f"nudge_type: {nudge.nudge_type}")
    print(f"urgency: {nudge.urgency}")


def _run_test_case(test_case: NudgeTestCase) -> bool:
    """Run one mock test case and return whether it passed."""

    print("=" * 80)
    print(f"Scenario: {test_case.name}")
    print("Input data:")
    print(json.dumps(_input_snapshot(test_case), indent=2))

    try:
        nudge = generate_nudge_report(
            test_case.plan,
            test_case.progress_report,
            test_case.feedback_report,
        )
    except NudgeValidationError as exc:
        print("Generated NudgeReport: <validation failed>")
        print(f"Validation error: {exc}")
        print("Result: FAIL")
        return False

    print("Generated NudgeReport:")
    print(json.dumps(nudge.model_dump(), indent=2))
    _print_result_fields(nudge)

    passed = _matches_expected(nudge, test_case.expected)
    print(f"Result: {'PASS' if passed else 'FAIL'}")
    if not passed:
        print("Expected:")
        print(json.dumps(test_case.expected.__dict__, indent=2))
    return passed


def main() -> int:
    """Run all mock-mode Nudge Agent validation scenarios."""

    previous_mock_mode = _enable_mock_mode()
    try:
        settings = get_settings()
        print(f"MOCK_MODE={settings.mock_mode}")
        print("Gemini API calls are disabled for this test suite.")

        results = [_run_test_case(test_case) for test_case in _test_cases()]
    finally:
        _restore_mock_mode(previous_mock_mode)

    passed_count = sum(results)
    failed_count = len(results) - passed_count

    print("=" * 80)
    print("Test summary:")
    print(f"Total test cases: {len(results)}")
    print(f"Passed: {passed_count}")
    print(f"Failed: {failed_count}")

    return 0 if failed_count == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
