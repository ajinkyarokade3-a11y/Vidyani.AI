"""Structured input and output schemas for the Progress Agent."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


LearnerStatus = Literal["On Track", "Ahead", "Behind"]


class LearnerProgress(BaseModel):
    """Current learner progress through an existing LearningPlan."""

    completed_phases: list[int] = Field(
        default_factory=list,
        description="Phase numbers the learner has fully completed.",
    )
    completed_topics: list[str] = Field(
        default_factory=list,
        description="Topics the learner has completed.",
    )
    current_phase: int = Field(
        ...,
        ge=1,
        description="Current phase number in the LearningPlan.",
    )
    completed_milestones: list[str] = Field(
        default_factory=list,
        description="Milestones the learner has completed.",
    )
    completion_percentage: float = Field(
        ...,
        ge=0,
        le=100,
        description="Overall roadmap completion percentage.",
    )
    recent_activity: str | None = Field(
        default=None,
        description="Optional recent learner activity or study notes.",
    )


class ProgressReport(BaseModel):
    """Structured progress report produced by the Progress Agent."""

    current_phase: int = Field(..., ge=1, description="Learner's current phase.")
    overall_completion_percentage: float = Field(
        ...,
        ge=0,
        le=100,
        description="Overall completion percentage for the roadmap.",
    )
    completed_topics: list[str] = Field(
        default_factory=list,
        description="Topics the learner has completed.",
    )
    remaining_topics: list[str] = Field(
        default_factory=list,
        description="Topics still remaining in the roadmap.",
    )
    completed_milestones: list[str] = Field(
        default_factory=list,
        description="Milestones the learner has completed.",
    )
    next_recommended_task: str = Field(
        ...,
        description="One concrete next task for the learner.",
    )
    learner_status: LearnerStatus = Field(
        ...,
        description="Learner pacing status relative to the roadmap.",
    )
    summary: str = Field(..., description="Brief progress summary.")
