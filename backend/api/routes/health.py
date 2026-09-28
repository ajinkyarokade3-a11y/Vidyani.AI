"""Health-check endpoint for deployment and uptime checks."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field
from sqlalchemy import text

from backend.api.schemas.common import ErrorResponse, SuccessResponse
from backend.database.database import engine


logger = logging.getLogger(__name__)
router = APIRouter(tags=["system"])


class HealthData(BaseModel):
    """Health-check payload."""

    status: str = Field(..., description="Service health status.", examples=["healthy"])
    database: str = Field(
        ...,
        description="Database connectivity status.",
        examples=["connected"],
    )
    version: str = Field(..., description="API version.", examples=["1.0.0"])


def _check_database_connection() -> None:
    """Verify database connectivity without modifying data."""

    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))


@router.get(
    "/health",
    response_model=SuccessResponse[HealthData],
    status_code=status.HTTP_200_OK,
    summary="Health check",
    description="Verify API availability and PostgreSQL connectivity.",
    responses={
        status.HTTP_200_OK: {
            "description": "The API and database are healthy.",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "message": "Service is healthy.",
                        "data": {
                            "status": "healthy",
                            "database": "connected",
                            "version": "1.0.0",
                        },
                    }
                }
            },
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "model": ErrorResponse,
            "description": "Database health check failed.",
        },
    },
)
async def health_check() -> SuccessResponse[HealthData]:
    """Return service and database health information."""

    logger.info("Health endpoint request received.")
    try:
        await run_in_threadpool(_check_database_connection)
    except Exception as exc:
        logger.exception("Health check failed.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Database health check failed.",
                "error_code": "database_unavailable",
            },
        ) from exc

    return SuccessResponse(
        message="Service is healthy.",
        data=HealthData(status="healthy", database="connected", version="1.0.0"),
    )
