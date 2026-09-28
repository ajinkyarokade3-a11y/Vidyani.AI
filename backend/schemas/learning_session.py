"""Top-level schema for an orchestrated learning session."""

from __future__ import annotations

from pydantic import BaseModel, Field

from backend.schemas.feedback import FeedbackReport
from backend.schemas.intent import LearnerIntent
from backend.schemas.nudge import NudgeReport
from backend.schemas.planner import LearningPlan
from backend.schemas.progress import ProgressReport


class LearningSessionResponse(BaseModel):
    """Aggregated response returned by the learning workflow orchestrator."""

    learner_intent: LearnerIntent | None = Field(
        default=None,
        description="Structured learner intent extracted from the user request.",
    )
    learning_plan: LearningPlan | None = Field(
        default=None,
        description="Generated learning roadmap when intent is complete.",
    )
    progress_report: ProgressReport | None = Field(
        default=None,
        description="Progress analysis for the current learning session.",
    )
    feedback_report: FeedbackReport | None = Field(
        default=None,
        description="Personalized feedback based on the progress report.",
    )
    nudge_report: NudgeReport | None = Field(
        default=None,
        description="Nudge decision and message for the learner.",
    )
    workflow_completed: bool = Field(
        ...,
        description="Whether the workflow reached the final Nudge Agent stage.",
    )
    current_stage: str = Field(
        ...,
        description="Latest workflow stage reached before completion or stop.",
    )
    error_message: str | None = Field(
        default=None,
        description="Meaningful validation or runtime error if the workflow stopped.",
    )
