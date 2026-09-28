"""Progress Agent for analyzing learner progress through a roadmap.

The Progress Agent consumes an existing LearningPlan and current learner
progress data. It reports progress status only; it does not generate feedback,
reminders, memory entries, database updates, or crew orchestration.
"""

from __future__ import annotations

from crewai import Agent

from backend.agents.base_agent import create_base_agent, run_with_gemini_retry
from backend.core.config import get_settings
from backend.schemas.planner import LearningPlan
from backend.schemas.progress import LearnerProgress, LearnerStatus, ProgressReport


PROGRESS_PROMPT = """Analyze the learner's progress through this learning plan.

Learning plan:
{learning_plan}

Current progress:
{current_progress}

Rules:
- Use only the provided LearningPlan and current progress data.
- Do not invent completed work.
- Compute remaining topics from plan topics that are not completed.
- Choose learner_status as exactly one of: On Track, Ahead, Behind.
- Recommend one concrete next task from the remaining roadmap.
- Keep the summary brief and useful.
- Do not generate feedback coaching, reminders, memory updates, database actions, or external API calls.
- Return the result in the required structured schema.
"""


class ProgressValidationError(ValueError):
    """Raised when progress inputs are incomplete or inconsistent."""


def create_progress_agent() -> Agent:
    """Create the CrewAI agent that analyzes learning progress."""

    return create_base_agent(
        role="Learning Progress Analyst",
        goal=(
            "Analyze a learner's current progress against an existing roadmap "
            "and return an accurate structured status report."
        ),
        backstory=(
            "You are a careful learning progress analyst. You compare stated "
            "completed work against the roadmap, identify what remains, and "
            "choose the next practical task without inventing progress."
        ),
        max_iter=3,
        max_retry_limit=0,
    )


def _plan_topics(plan: LearningPlan) -> list[str]:
    """Return all roadmap topics in phase order."""

    return [
        topic
        for phase in sorted(plan.phases, key=lambda item: item.phase_number)
        for topic in phase.recommended_topics
    ]


def _plan_milestones(plan: LearningPlan) -> list[str]:
    """Return all roadmap milestones in phase order."""

    return [
        milestone
        for phase in sorted(plan.phases, key=lambda item: item.phase_number)
        for milestone in phase.milestones
    ]


def _validate_progress_inputs(
    plan: LearningPlan,
    progress: LearnerProgress,
) -> None:
    """Validate that the Progress Agent has enough information to proceed."""

    if not plan.phases:
        raise ProgressValidationError("LearningPlan must contain at least one phase.")

    phase_numbers = {phase.phase_number for phase in plan.phases}
    if progress.current_phase not in phase_numbers:
        raise ProgressValidationError(
            "current_phase must refer to an existing phase in the LearningPlan."
        )

    invalid_completed_phases = [
        phase_number
        for phase_number in progress.completed_phases
        if phase_number not in phase_numbers
    ]
    if invalid_completed_phases:
        raise ProgressValidationError(
            "completed_phases contains phase numbers that do not exist in the "
            f"LearningPlan: {invalid_completed_phases}."
        )

    has_progress_evidence = any(
        [
            progress.completed_phases,
            progress.completed_topics,
            progress.completed_milestones,
            progress.recent_activity,
        ]
    )
    if progress.completion_percentage > 0 and not has_progress_evidence:
        raise ProgressValidationError(
            "At least one completed phase, completed topic, completed milestone, "
            "or recent activity entry is required when completion_percentage is above 0."
        )

    if progress.completion_percentage == 0 and progress.completed_milestones:
        raise ProgressValidationError(
            "completed_milestones should be empty when completion_percentage is 0."
        )

    plan_topics = {topic.lower() for topic in _plan_topics(plan)}
    unknown_topics = [
        topic for topic in progress.completed_topics if topic.lower() not in plan_topics
    ]
    if unknown_topics:
        raise ProgressValidationError(
            "completed_topics contains topics that are not present in the "
            f"LearningPlan: {unknown_topics}."
        )

    plan_milestones = {milestone.lower() for milestone in _plan_milestones(plan)}
    unknown_milestones = [
        milestone
        for milestone in progress.completed_milestones
        if milestone.lower() not in plan_milestones
    ]
    if unknown_milestones:
        raise ProgressValidationError(
            "completed_milestones contains milestones that are not present in the "
            f"LearningPlan: {unknown_milestones}."
        )


def _remaining_topics(plan: LearningPlan, progress: LearnerProgress) -> list[str]:
    """Return plan topics that have not been marked complete."""

    completed_topics = {topic.lower() for topic in progress.completed_topics}
    return [
        topic
        for topic in _plan_topics(plan)
        if topic.lower() not in completed_topics
    ]


def _mock_status(progress: LearnerProgress) -> LearnerStatus:
    """Return a simple deterministic learner status for mock mode."""

    if progress.completion_percentage >= 75:
        return "Ahead"
    if progress.completion_percentage < 30:
        return "Behind"
    return "On Track"


def _generate_mock_progress_report(
    plan: LearningPlan,
    progress: LearnerProgress,
) -> ProgressReport:
    """Return a schema-valid progress report without calling Gemini."""

    remaining_topics = _remaining_topics(plan, progress)
    next_task = (
        f"Study and practice: {remaining_topics[0]}"
        if remaining_topics
        else f"Complete final milestone: {plan.final_milestone}"
    )

    return ProgressReport(
        current_phase=progress.current_phase,
        overall_completion_percentage=progress.completion_percentage,
        completed_topics=progress.completed_topics,
        remaining_topics=remaining_topics,
        completed_milestones=progress.completed_milestones,
        next_recommended_task=next_task,
        learner_status=_mock_status(progress),
        summary=(
            "Mock Mode progress report generated without calling Gemini. "
            f"The learner is in phase {progress.current_phase}, has completed "
            f"{progress.completion_percentage}% of the roadmap, and should focus "
            "on the next remaining topic."
        ),
    )


def generate_progress_report(
    plan: LearningPlan,
    progress: LearnerProgress,
    agent: Agent | None = None,
) -> ProgressReport:
    """Generate a structured progress report from plan and progress data."""

    _validate_progress_inputs(plan, progress)
    if get_settings().mock_mode:
        return _generate_mock_progress_report(plan, progress)

    progress_agent = agent or create_progress_agent()
    prompt = PROGRESS_PROMPT.format(
        learning_plan=plan.model_dump_json(indent=2),
        current_progress=progress.model_dump_json(indent=2),
    )
    result = run_with_gemini_retry(
        "Progress Agent",
        lambda: progress_agent.kickoff(
            prompt,
            response_format=ProgressReport,
        ),
        prompt=prompt,
    )
    if result.pydantic is None:
        raise ValueError("Progress Agent did not return structured output.")

    return result.pydantic
