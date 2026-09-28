"""Nudge Agent for deciding whether a learner needs intervention.

The Nudge Agent consumes an existing LearningPlan, latest ProgressReport, and
latest FeedbackReport. It only decides if a nudge is appropriate and drafts the
message/action; it does not send notifications, write to databases, integrate
with calendars, or orchestrate other agents.
"""

from __future__ import annotations

from crewai import Agent

from backend.agents.base_agent import create_base_agent, run_with_gemini_retry
from backend.core.config import get_settings
from backend.schemas.feedback import FeedbackReport
from backend.schemas.nudge import NudgeLearnerStatus, NudgeReport, NudgeType, NudgeUrgency
from backend.schemas.planner import LearningPlan
from backend.schemas.progress import ProgressReport


NUDGE_PROMPT = """Decide whether this learner needs a nudge.

Learning plan:
{learning_plan}

Latest progress report:
{progress_report}

Latest feedback report:
{feedback_report}

Rules:
- Use only the provided LearningPlan, ProgressReport, and FeedbackReport.
- Do not invent activity, missed deadlines, inactivity, or personal context.
- Decide whether intervention_required should be true.
- learner_status must be exactly one of: On Track, Ahead, Behind, Inactive.
- nudge_type must be exactly one of: Reminder, Motivation, Congratulations, Warning, Study Suggestion.
- urgency must be exactly one of: Low, Medium, High.
- If the learner is Ahead, prefer congratulations or a low-urgency study suggestion.
- If the learner is Behind, prefer motivation, warning, or a medium/high-urgency study suggestion.
- If evidence indicates inactivity, use Inactive and prefer a reminder or warning.
- Do not send notifications, emails, calendar events, database updates, or a new roadmap.
- Return the result in the required structured schema.
"""


class NudgeValidationError(ValueError):
    """Raised when nudge inputs are incomplete or inconsistent."""


def create_nudge_agent() -> Agent:
    """Create the CrewAI agent that decides whether a learner needs a nudge."""

    return create_base_agent(
        role="Learning Intervention and Nudge Strategist",
        goal=(
            "Assess progress and feedback signals to decide whether a learner "
            "needs encouragement, a reminder, congratulations, or intervention."
        ),
        backstory=(
            "You are a thoughtful learning success coach. You use concrete "
            "progress evidence to decide when a learner needs help, and you keep "
            "nudges respectful, practical, and grounded in the supplied reports."
        ),
        max_iter=3,
        max_retry_limit=0,
    )


def _plan_topics(plan: LearningPlan) -> set[str]:
    """Return all roadmap topics normalized for validation."""

    return {
        topic.lower()
        for phase in plan.phases
        for topic in phase.recommended_topics
    }


def _blank(value: str | None) -> bool:
    """Return whether a text value is missing or whitespace-only."""

    return value is None or not value.strip()


def _validate_nudge_inputs(
    plan: LearningPlan,
    progress_report: ProgressReport,
    feedback_report: FeedbackReport,
) -> None:
    """Validate that nudge generation has enough reliable information."""

    if not plan.phases:
        raise NudgeValidationError("LearningPlan must contain at least one phase.")

    phase_numbers = {phase.phase_number for phase in plan.phases}
    if progress_report.current_phase not in phase_numbers:
        raise NudgeValidationError(
            "ProgressReport current_phase must refer to an existing phase in the "
            "LearningPlan."
        )

    if _blank(progress_report.next_recommended_task):
        raise NudgeValidationError(
            "ProgressReport next_recommended_task is required for nudging."
        )

    if _blank(progress_report.summary):
        raise NudgeValidationError("ProgressReport summary is required for nudging.")

    has_progress_context = any(
        [
            progress_report.completed_topics,
            progress_report.remaining_topics,
            progress_report.completed_milestones,
        ]
    )
    if not has_progress_context:
        raise NudgeValidationError(
            "ProgressReport must include completed topics, remaining topics, "
            "or completed milestones before nudging can be generated."
        )

    plan_topics = _plan_topics(plan)
    report_topics = progress_report.completed_topics + progress_report.remaining_topics
    unknown_topics = [
        topic for topic in report_topics if topic.lower() not in plan_topics
    ]
    if unknown_topics:
        raise NudgeValidationError(
            "ProgressReport contains topics that are not present in the "
            f"LearningPlan: {unknown_topics}."
        )

    if _blank(feedback_report.overall_performance_assessment):
        raise NudgeValidationError(
            "FeedbackReport overall_performance_assessment is required for nudging."
        )

    if not feedback_report.strengths:
        raise NudgeValidationError("FeedbackReport strengths are required for nudging.")

    if not feedback_report.areas_for_improvement:
        raise NudgeValidationError(
            "FeedbackReport areas_for_improvement are required for nudging."
        )

    if not feedback_report.personalized_study_recommendations:
        raise NudgeValidationError(
            "FeedbackReport personalized_study_recommendations are required for nudging."
        )

    if _blank(feedback_report.motivation_message):
        raise NudgeValidationError(
            "FeedbackReport motivation_message is required for nudging."
        )

    if _blank(feedback_report.next_study_session_focus):
        raise NudgeValidationError(
            "FeedbackReport next_study_session_focus is required for nudging."
        )


def _infer_mock_status(progress_report: ProgressReport) -> NudgeLearnerStatus:
    """Infer a deterministic learner status for mock mode."""

    summary_text = progress_report.summary.lower()
    next_task_text = progress_report.next_recommended_task.lower()
    if (
        "inactive" in summary_text
        or "no recent activity" in summary_text
        or ("last activity" in summary_text and "days ago" in summary_text)
    ):
        return "Inactive"
    if "inactive" in next_task_text or "resume" in next_task_text:
        return "Inactive"
    return progress_report.learner_status


def _mock_nudge_decision(
    status: NudgeLearnerStatus,
) -> tuple[bool, NudgeType, NudgeUrgency]:
    """Return deterministic mock nudge decision values from learner status."""

    if status == "Ahead":
        return False, "Congratulations", "Low"
    if status == "On Track":
        return False, "Motivation", "Low"
    if status == "Inactive":
        return True, "Warning", "High"
    return True, "Reminder", "Medium"


def _generate_mock_nudge_report(
    plan: LearningPlan,
    progress_report: ProgressReport,
    feedback_report: FeedbackReport,
) -> NudgeReport:
    """Return a realistic schema-valid nudge report without calling Gemini."""

    learner_status = _infer_mock_status(progress_report)
    intervention_required, nudge_type, urgency = _mock_nudge_decision(learner_status)

    if learner_status == "Ahead":
        message = (
            f"Great work staying ahead in {plan.subject}. Keep the pace healthy "
            "and use the next session to deepen one topic rather than rushing."
        )
        action = feedback_report.next_study_session_focus
    elif learner_status == "On Track":
        message = (
            f"You are on track with {plan.subject}. Keep your rhythm and make "
            "the next session focused and measurable."
        )
        action = feedback_report.next_study_session_focus
    elif learner_status == "Inactive":
        message = (
            f"Let's restart gently with {plan.subject}. A short session today is "
            "enough to rebuild momentum."
        )
        action = (
            "Spend 20 minutes reviewing the last completed topic, then complete "
            f"this next task: {progress_report.next_recommended_task}."
        )
    else:
        message = (
            f"You are a bit behind in {plan.subject}, but the next step is clear. "
            "Focus on one task instead of the whole roadmap."
        )
        action = progress_report.next_recommended_task

    return NudgeReport(
        intervention_required=intervention_required,
        learner_status=learner_status,
        nudge_type=nudge_type,
        personalized_message=message,
        recommended_action=action,
        urgency=urgency,
    )


def generate_nudge_report(
    plan: LearningPlan,
    progress_report: ProgressReport,
    feedback_report: FeedbackReport,
    agent: Agent | None = None,
) -> NudgeReport:
    """Generate a nudge decision from plan, progress, and feedback data."""

    _validate_nudge_inputs(plan, progress_report, feedback_report)
    if get_settings().mock_mode:
        return _generate_mock_nudge_report(plan, progress_report, feedback_report)

    nudge_agent = agent or create_nudge_agent()
    prompt = NUDGE_PROMPT.format(
        learning_plan=plan.model_dump_json(indent=2),
        progress_report=progress_report.model_dump_json(indent=2),
        feedback_report=feedback_report.model_dump_json(indent=2),
    )
    result = run_with_gemini_retry(
        "Nudge Agent",
        lambda: nudge_agent.kickoff(
            prompt,
            response_format=NudgeReport,
        ),
        prompt=prompt,
    )
    if result.pydantic is None:
        raise ValueError("Nudge Agent did not return structured output.")

    return result.pydantic
