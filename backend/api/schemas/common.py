"""Common response envelopes for the REST API."""

from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, Field


DataT = TypeVar("DataT")


class SuccessResponse(BaseModel, Generic[DataT]):
    """Standard successful API response envelope."""

    success: bool = Field(
        default=True,
        description="Whether the request completed successfully.",
        examples=[True],
    )
    message: str = Field(
        ...,
        description="Human-readable success message.",
        examples=["Request completed successfully."],
    )
    data: DataT = Field(..., description="Response payload.")


class ErrorResponse(BaseModel):
    """Standard API error response envelope."""

    success: bool = Field(
        default=False,
        description="Whether the request completed successfully.",
        examples=[False],
    )
    message: str = Field(
        ...,
        description="Human-readable error message.",
        examples=["The requested resource was not found."],
    )
    error_code: str | None = Field(
        default=None,
        description="Stable error code for frontend handling.",
        examples=["not_found"],
    )
    details: object | None = Field(
        default=None,
        description="Optional structured error details.",
    )


class PaginatedResponse(BaseModel, Generic[DataT]):
    """Standard paginated API response envelope for future list endpoints."""

    success: bool = Field(
        default=True,
        description="Whether the request completed successfully.",
        examples=[True],
    )
    message: str = Field(
        ...,
        description="Human-readable success message.",
        examples=["Records retrieved successfully."],
    )
    data: list[DataT] = Field(..., description="Current page of response items.")
    total: int = Field(..., ge=0, description="Total number of records available.")
    limit: int = Field(..., ge=1, description="Maximum number of records requested.")
    offset: int = Field(..., ge=0, description="Number of records skipped.")
