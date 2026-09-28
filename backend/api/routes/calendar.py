"""Google Calendar integration endpoints."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from backend.api.schemas.common import ErrorResponse, SuccessResponse
from backend.services.google_calendar_service import (
    CalendarServiceError,
    connect_google_calendar,
    create_calendar_events,
    get_calendar_status,
)


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/calendar", tags=["calendar"])


class CalendarConnectRequest(BaseModel):
    """Google OAuth authorization code payload."""

    authorization_code: str = Field(..., min_length=1)


class CalendarConnectResponse(BaseModel):
    """Calendar connection response."""

    connected: bool
    connection_id: str


class CalendarStatusResponse(BaseModel):
    """Calendar connection status response."""

    connected: bool


class CalendarEventRequest(BaseModel):
    """Single calendar event request from a reviewed study schedule."""

    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    start: datetime
    end: datetime
    time_zone: str = Field(default="Asia/Kolkata", min_length=1)


class CalendarEventsRequest(BaseModel):
    """Batch event creation request."""

    connection_id: str = Field(..., min_length=1)
    events: list[CalendarEventRequest] = Field(..., min_length=1)


class CreatedCalendarEvent(BaseModel):
    """Created Google Calendar event metadata."""

    id: str
    htmlLink: str


@router.post(
    "/connect",
    response_model=SuccessResponse[CalendarConnectResponse],
    status_code=status.HTTP_200_OK,
    responses={status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ErrorResponse}},
)
async def connect_calendar(
    request: CalendarConnectRequest,
) -> SuccessResponse[CalendarConnectResponse]:
    """Exchange a GIS auth code for a server-side Calendar connection."""

    logger.info("Calendar connect request received.")
    try:
        connection_id = await run_in_threadpool(
            connect_google_calendar,
            request.authorization_code,
        )
    except CalendarServiceError as exc:
        logger.warning("Calendar connect failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Unable to connect Google Calendar.",
                "error_code": "calendar_connect_failed",
            },
        ) from exc

    return SuccessResponse(
        message="Google Calendar connected successfully.",
        data=CalendarConnectResponse(connected=True, connection_id=connection_id),
    )


@router.get(
    "/status",
    response_model=SuccessResponse[CalendarStatusResponse],
    status_code=status.HTTP_200_OK,
)
async def calendar_status(
    connection_id: str | None = None,
) -> SuccessResponse[CalendarStatusResponse]:
    """Return whether a Calendar connection exists for this backend process."""

    return SuccessResponse(
        message="Calendar status retrieved successfully.",
        data=CalendarStatusResponse(
            connected=get_calendar_status(connection_id),
        ),
    )


@router.post(
    "/events",
    response_model=SuccessResponse[list[CreatedCalendarEvent]],
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ErrorResponse},
    },
)
async def create_events(
    request: CalendarEventsRequest,
) -> SuccessResponse[list[CreatedCalendarEvent]]:
    """Create reviewed study sessions on the user's primary calendar."""

    logger.info("Calendar event creation request received: count=%s", len(request.events))
    google_events = [
        {
            "summary": event.title,
            "description": event.description,
            "start": {
                "dateTime": event.start.isoformat(),
                "timeZone": event.time_zone,
            },
            "end": {
                "dateTime": event.end.isoformat(),
                "timeZone": event.time_zone,
            },
        }
        for event in request.events
    ]

    try:
        created_events = await run_in_threadpool(
            create_calendar_events,
            connection_id=request.connection_id,
            events=google_events,
        )
    except CalendarServiceError as exc:
        logger.warning("Calendar event creation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Unable to create Google Calendar events.",
                "error_code": "calendar_event_creation_failed",
            },
        ) from exc

    return SuccessResponse(
        message="Calendar events created successfully.",
        data=[CreatedCalendarEvent(**event) for event in created_events],
    )
