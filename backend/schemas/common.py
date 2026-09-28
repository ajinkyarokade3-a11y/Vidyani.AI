"""Shared API response schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str = Field(..., description="Human-readable response message.")
