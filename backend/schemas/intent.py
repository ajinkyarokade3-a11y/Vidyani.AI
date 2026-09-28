"""Structured output schema for the Intent Agent."""

from __future__ import annotations

from pydantic import BaseModel, Field


REQUIRED_INTENT_FIELDS = (
    "learning_goal",
    "current_skill_level",
    "available_time",
    "target_deadline",
)

FOLLOW_UP_QUESTIONS = {
    "learning_goal": "What learning goal would you like to achieve?",
    "current_skill_level": "What is your current skill level?",
    "available_time": "How much time can you study each day or week?",
    "target_deadline": "What is your target deadline?",
}


class LearnerIntent(BaseModel):
    """Structured representation of a learner's request."""

    learning_goal: str | None = Field(
        default=None,
        description="The outcome the learner wants to achieve.",
    )
    subject: str | None = Field(
        default=None,
        description=(
            "The topic, skill, domain, or career area to learn. This may be "
            "derived directly from the stated learning goal."
        ),
    )
    current_skill_level: str | None = Field(
        default=None,
        description="The learner's current level, such as beginner or intermediate.",
    )
    available_time: str | None = Field(
        default=None,
        description="How much time the learner can spend studying.",
    )
    target_deadline: str | None = Field(
        default=None,
        description="The target completion date, exam date, or deadline.",
    )
    preferred_learning_style: str | None = Field(
        default=None,
        description="Preferred learning style if the learner mentions one.",
    )
    is_complete: bool = Field(
        description="Whether all four workflow-required intent fields are present.",
    )
    missing_information: list[str] = Field(
        default_factory=list,
        description="Essential fields that are missing from the request.",
    )
    follow_up_questions: list[str] = Field(
        default_factory=list,
        description="Questions to ask before planning if essential information is missing.",
    )


def missing_required_intent_fields(intent: LearnerIntent) -> list[str]:
    """Return workflow-required fields that contain no usable value."""

    return [
        field_name
        for field_name in REQUIRED_INTENT_FIELDS
        if not _has_text(getattr(intent, field_name))
    ]


def reconcile_intent_completeness(intent: LearnerIntent) -> LearnerIntent:
    """Make completeness deterministic from the four workflow-required fields."""

    learning_goal = _clean_text(intent.learning_goal)
    subject = _clean_text(intent.subject) or learning_goal
    current_skill_level = _clean_text(intent.current_skill_level)
    available_time = _clean_text(intent.available_time)
    target_deadline = _clean_text(intent.target_deadline)
    preferred_learning_style = _clean_text(intent.preferred_learning_style)

    normalized = intent.model_copy(
        update={
            "learning_goal": learning_goal,
            "subject": subject,
            "current_skill_level": current_skill_level,
            "available_time": available_time,
            "target_deadline": target_deadline,
            "preferred_learning_style": preferred_learning_style,
        }
    )
    missing_fields = missing_required_intent_fields(normalized)

    return normalized.model_copy(
        update={
            "is_complete": not missing_fields,
            "missing_information": missing_fields,
            "follow_up_questions": [
                FOLLOW_UP_QUESTIONS[field_name] for field_name in missing_fields
            ],
        }
    )


def _has_text(value: str | None) -> bool:
    """Return whether a nullable string contains non-whitespace text."""

    return bool(value and value.strip())


def _clean_text(value: str | None) -> str | None:
    """Trim a nullable string and normalize blank text to ``None``."""

    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None
