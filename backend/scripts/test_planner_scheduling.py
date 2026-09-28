"""Deterministic tests for backend planner scheduling."""

from __future__ import annotations

from datetime import date, timedelta

from backend.schemas.intent import LearnerIntent
from backend.schemas.planner import LearningPhase, LearningPlan
from backend.services.planner_scheduling_service import (
    PlannerSchedulingError,
    allocate_phase_days,
    estimate_available_study_hours,
    parse_target_date,
    schedule_learning_plan,
    validate_planning_feasibility,
)


REFERENCE_DATE = date(2026, 7, 24)
TARGET_DATE = date(2026, 9, 30)


def main() -> int:
    checks = [
        _test_four_phase_schedule(),
        _test_three_phase_allocation(),
        _test_relative_deadline(),
        _test_mixed_study_schedule(),
        _test_impossible_plan(),
    ]
    passed = all(checks)
    print(f"Planner scheduling tests: {'PASS' if passed else 'FAIL'}")
    return 0 if passed else 1


def _test_four_phase_schedule() -> bool:
    scheduled = schedule_learning_plan(
        _plan(4),
        _intent("30 September 2026", "2 hours daily"),
        reference_date=REFERENCE_DATE,
    )
    durations = [phase.duration_days for phase in scheduled.phases]
    passed = (
        durations == [17, 17, 17, 18]
        and scheduled.phases[0].start_date == REFERENCE_DATE
        and scheduled.phases[-1].end_date == TARGET_DATE
        and sum(duration or 0 for duration in durations)
        == (TARGET_DATE - REFERENCE_DATE).days + 1
        and _has_no_overlaps(scheduled)
    )
    _print_result("Four-phase deadline fit", passed)
    return passed


def _test_three_phase_allocation() -> bool:
    allocations = allocate_phase_days(70, 3)
    passed = allocations == [24, 24, 22] and sum(allocations) == 70
    _print_result("Three-phase 35/35/30 allocation", passed)
    return passed


def _test_relative_deadline() -> bool:
    passed = (
        parse_target_date("in six months", REFERENCE_DATE)
        == date(2027, 1, 24)
    )
    _print_result("Natural-language month deadline", passed)
    return passed


def _test_mixed_study_schedule() -> bool:
    available_hours = estimate_available_study_hours(
        "2 hours every weekday and 4 hours on weekends",
        start_date=REFERENCE_DATE,
        target_date=REFERENCE_DATE + timedelta(days=6),
    )
    passed = available_hours == 18
    _print_result("Mixed weekday/weekend study time", passed)
    return passed


def _test_impossible_plan() -> bool:
    try:
        validate_planning_feasibility(
            _intent("in 5 days", "1 hour every day"),
            reference_date=REFERENCE_DATE,
        )
    except PlannerSchedulingError as exc:
        passed = "study hours" in str(exc)
    else:
        passed = False
    _print_result("Impossible five-day plan rejected", passed)
    return passed


def _intent(target_deadline: str, available_time: str) -> LearnerIntent:
    return LearnerIntent(
        learning_goal="Become a Data Scientist",
        subject="Data Science",
        current_skill_level="Beginner",
        available_time=available_time,
        target_deadline=target_deadline,
        preferred_learning_style="Hands-on Projects",
        is_complete=True,
        missing_information=[],
        follow_up_questions=[],
    )


def _plan(phase_count: int) -> LearningPlan:
    phases = [
        LearningPhase(
            phase_number=index,
            title=f"Phase {index}",
            objective=f"Complete phase {index}.",
            recommended_topics=[
                f"Topic {index}.1",
                f"Topic {index}.2",
                f"Topic {index}.3",
            ],
            estimated_duration="LLM duration ignored",
            milestones=[f"Milestone {index}"],
            suggested_resource_categories=["Documentation", "Projects"],
        )
        for index in range(1, phase_count + 1)
    ]
    return LearningPlan(
        learning_goal="Become a Data Scientist",
        subject="Data Science",
        learner_level="Beginner",
        total_available_time="2 hours daily",
        target_deadline="30 September 2026",
        preferred_learning_style="Hands-on Projects",
        overview="Structured learning plan.",
        phases=phases,
        final_milestone="Complete a portfolio project.",
    )


def _has_no_overlaps(plan: LearningPlan) -> bool:
    for current, following in zip(plan.phases, plan.phases[1:]):
        if current.end_date is None or following.start_date is None:
            return False
        if following.start_date != current.end_date + timedelta(days=1):
            return False
    return True


def _print_result(label: str, passed: bool) -> None:
    print(f"{label}: {'PASS' if passed else 'FAIL'}")


if __name__ == "__main__":
    raise SystemExit(main())
