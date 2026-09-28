"""Request and response schemas for the temporary chat endpoint."""

from __future__ import annotations

from pydantic import BaseModel, Field

from backend.core.llm import GEMINI_FLASH_MODEL


class ChatRequest(BaseModel):
    """User prompt payload for the temporary chat endpoint."""

    prompt: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="User prompt to send to the temporary CrewAI Gemini agent.",
    )


class ChatResponse(BaseModel):
    """Temporary chat endpoint response."""

    response: str = Field(..., description="CrewAI Gemini agent response.")
    model: str = Field(
        default=GEMINI_FLASH_MODEL,
        description="Gemini model configured through CrewAI.",
    )
