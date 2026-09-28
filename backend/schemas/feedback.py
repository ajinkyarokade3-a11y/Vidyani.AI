"""Structured output schema for the Feedback Agent."""

from __future__ import annotations

from pydantic import BaseModel, Field


class FeedbackReport(BaseModel):
    """Personalized learning feedback produced from a progress report."""

    overall_performance_assessment: str = Field(
        ...,
        description="Concise assessment of the learner's current performance.",
    )
    strengths: list[str] = Field(
        ...,
        min_length=1,
        description="Specific learner strengths shown by the progress report.",
    )
    areas_for_improvement: list[str] = Field(
        ...,
        min_length=1,
        description="Specific areas the learner should improve next.",
    )
    personalized_study_recommendations: list[str] = Field(
        ...,
        min_length=1,
        description="Actionable study recommendations tailored to the learner.",
    )
    motivation_message: str = Field(
        ...,
        description="Brief encouraging message for the learner.",
    )
    next_study_session_focus: str = Field(
        ...,
        description="Suggested focus for the learner's next study session.",
    )
