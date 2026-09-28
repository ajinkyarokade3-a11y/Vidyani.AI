"""Root endpoint for API metadata."""

from __future__ import annotations

import logging

from fastapi import APIRouter, status
from pydantic import BaseModel, Field

from backend.api.schemas.common import SuccessResponse


logger = logging.getLogger(__name__)
router = APIRouter(tags=["system"])


class RootData(BaseModel):
    """Root API metadata payload."""

    service: str = Field(
        ...,
        description="Public API service name.",
        examples=["AI Learning Agent API"],
    )
    version: str = Field(..., description="API version.", examples=["1.0.0"])
    docs: str = Field(..., description="Swagger UI path.", examples=["/docs"])


@router.get(
    "/",
    response_model=SuccessResponse[RootData],
    status_code=status.HTTP_200_OK,
    summary="API root",
    description="Return service metadata and the Swagger documentation path.",
    responses={
        status.HTTP_200_OK: {
            "description": "Service metadata returned successfully.",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "message": "AI Learning Agent API is running.",
                        "data": {
                            "service": "AI Learning Agent API",
                            "version": "1.0.0",
                            "docs": "/docs",
                        },
                    }
                }
            },
        }
    },
)
async def welcome() -> SuccessResponse[RootData]:
    """Return service metadata."""

    logger.info("Root endpoint request received.")
    return SuccessResponse(
        message="AI Learning Agent API is running.",
        data=RootData(
            service="AI Learning Agent API",
            version="1.0.0",
            docs="/docs",
        ),
    )
