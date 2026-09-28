"""Health-check response schema."""

from __future__ import annotations

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Service health-check response."""

    status: str = Field(..., description="Current service status.")
