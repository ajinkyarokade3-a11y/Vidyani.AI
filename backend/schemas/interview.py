"""Request and response schemas for mock interview sessions."""

from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel, Field, field_validator


class InterviewDifficulty(StrEnum):
    """Supported mock interview difficulty levels."""

    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"


class InterviewStartRequest(BaseModel):
    """Configuration for starting a mock interview."""

    learning_goal: str = Field(..., min_length=3, max_length=150)
    interview_role: str = Field(..., min_length=3, max_length=100)
    difficulty: InterviewDifficulty
    number_of_questions: int = Field(..., ge=1, le=20)

    @field_validator("learning_goal", "interview_role")
    @classmethod
    def _validate_context_text(cls, value: str) -> str:
        stripped = value.strip()
        if len(stripped) < 3:
            raise ValueError("Value must contain at least 3 non-whitespace characters.")
        return stripped


class InterviewQuestion(BaseModel):
    """One candidate-facing mock interview question."""

    question_id: str
    question_number: int = Field(..., ge=1)
    total_questions: int = Field(..., ge=1)
    question: str = Field(..., min_length=1)


class InterviewStartResponse(BaseModel):
    """New interview id and first question."""

    interview_id: str
    current_question: InterviewQuestion


class InterviewAnswerRequest(BaseModel):
    """Candidate answer submitted for the current question."""

    interview_id: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=1)

    @field_validator("interview_id", "answer")
    @classmethod
    def _validate_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Value cannot be empty.")
        return stripped


class InterviewAnswerResponse(BaseModel):
    """Mock feedback and next interview state."""

    feedback: str
    next_question: InterviewQuestion | None
    is_interview_complete: bool


class InterviewEndRequest(BaseModel):
    """Interview session to end and summarize."""

    interview_id: str = Field(..., min_length=1)

    @field_validator("interview_id")
    @classmethod
    def _validate_interview_id(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Interview id cannot be empty.")
        return stripped


class InterviewSummary(BaseModel):
    """Mock interview summary returned when a session ends."""

    technical_score: int = Field(..., ge=0, le=100)
    communication_score: int = Field(..., ge=0, le=100)
    confidence_score: int = Field(..., ge=0, le=100)
    questions_answered: int = Field(..., ge=0)
    overall_feedback: str


class InterviewEndResponse(BaseModel):
    """Completed mock interview summary."""

    summary: InterviewSummary
