"""Request and response schemas for the conversational AI Mentor."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator


class MentorMessage(BaseModel):
    """One conversation message supplied by the frontend."""

    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1)

    @field_validator("content")
    @classmethod
    def _validate_content(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Message content cannot be empty.")
        return stripped


class MentorChatRequest(BaseModel):
    """Context and latest learner question for the AI Mentor."""

    message: str = Field(..., min_length=1, max_length=8000)
    learning_goal: str | None = Field(default=None, max_length=1000)
    current_topic: str | None = Field(default=None, max_length=1000)
    conversation_history: list[MentorMessage] = Field(default_factory=list)

    @field_validator("message")
    @classmethod
    def _validate_message(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Message cannot be empty.")
        return stripped

    @field_validator("learning_goal", "current_topic")
    @classmethod
    def _normalize_optional_context(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None


class MentorChatResponse(BaseModel):
    """AI Mentor reply and suggested conversation continuations."""

    reply: str = Field(..., min_length=1)
    suggested_followups: list[str] = Field(..., min_length=3, max_length=3)
