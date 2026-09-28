"""Structured output schema for the Nudge Agent."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


NudgeLearnerStatus = Literal["On Track", "Ahead", "Behind", "Inactive"]
NudgeType = Literal[
    "Reminder",
    "Motivation",
    "Congratulations",
    "Warning",
    "Study Suggestion",
]
NudgeUrgency = Literal["Low", "Medium", "High"]


class NudgeReport(BaseModel):
    """Decision and message produced by the Nudge Agent."""

    intervention_required: bool = Field(
        ...,
        description="Whether the learner needs a nudge or intervention now.",
    )
    learner_status: NudgeLearnerStatus = Field(
        ...,
        description="Learner status after considering progress and feedback.",
    )
    nudge_type: NudgeType = Field(
        ...,
        description="Type of nudge to send or prepare.",
    )
    personalized_message: str = Field(
        ...,
        description="Personalized message for the learner.",
    )
    recommended_action: str = Field(
        ...,
        description="Concrete action the learner should take next.",
    )
    urgency: NudgeUrgency = Field(
        ...,
        description="Urgency level for the nudge.",
    )
