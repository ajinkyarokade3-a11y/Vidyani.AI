"""Structured output schema for the Planner Agent."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field


class LearningPhase(BaseModel):
    """One phase or module in a personalized learning roadmap."""

    phase_number: int = Field(
        ...,
        ge=1,
        description="Sequential number for this phase.",
    )
    title: str = Field(..., description="Short name of the learning phase.")
    objective: str = Field(
        ...,
        description="Primary outcome the learner should achieve in this phase.",
    )
    recommended_topics: list[str] = Field(
        ...,
        min_length=1,
        description="Topics to study in sequence during this phase.",
    )
    estimated_duration: str = Field(
        ...,
        description="Backend-calculated time allocated to this phase.",
    )
    duration_days: int | None = Field(
        default=None,
        ge=1,
        description="Exact backend-calculated number of days in this phase.",
    )
    start_date: date | None = Field(
        default=None,
        description="Backend-calculated inclusive phase start date.",
    )
    end_date: date | None = Field(
        default=None,
        description="Backend-calculated inclusive phase end date.",
    )
    milestones: list[str] = Field(
        ...,
        min_length=1,
        description="Checkpoints that show progress or completion for this phase.",
    )
    suggested_resource_categories: list[str] = Field(
        ...,
        min_length=1,
        description="Resource categories only, such as videos, docs, or projects.",
    )


class LearningPlan(BaseModel):
    """Complete structured learning roadmap produced by the Planner Agent."""

    learning_goal: str = Field(..., description="Learning goal from learner intent.")
    subject: str = Field(..., description="Subject from learner intent.")
    learner_level: str = Field(..., description="Current learner skill level.")
    total_available_time: str = Field(
        ...,
        description="Study time available from learner intent.",
    )
    target_deadline: str = Field(..., description="Target deadline from learner intent.")
    preferred_learning_style: str | None = Field(
        default=None,
        description="Preferred learning style when provided by the learner.",
    )
    overview: str = Field(
        ...,
        description="Brief explanation of the roadmap strategy.",
    )
    phases: list[LearningPhase] = Field(
        ...,
        min_length=1,
        description="Sequenced learning phases/modules.",
    )
    final_milestone: str = Field(
        ...,
        description="Final checkpoint showing the learner met the goal.",
    )
