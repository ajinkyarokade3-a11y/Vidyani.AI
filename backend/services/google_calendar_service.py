"""Minimal Google Calendar integration service.

This module exchanges Google Identity Services authorization codes server-side
and creates events in the user's primary Google Calendar. Tokens are kept in an
in-memory store for the current backend process; a durable token store can be
added later without changing the API contract.
"""

from __future__ import annotations

import logging
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

import requests

from backend.core.config import get_settings


logger = logging.getLogger(__name__)

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CALENDAR_EVENTS_URL = (
    "https://www.googleapis.com/calendar/v3/calendars/primary/events"
)
GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events"


class CalendarServiceError(RuntimeError):
    """Raised when Google Calendar authentication or event creation fails."""


@dataclass
class CalendarConnection:
    """Server-side Google OAuth token state for one connected user."""

    access_token: str
    refresh_token: str | None
    expires_at: datetime


_CONNECTIONS: dict[str, CalendarConnection] = {}


def connect_google_calendar(authorization_code: str) -> str:
    """Exchange a Google auth code and return an opaque connection id."""

    settings = get_settings()
    if not settings.google_client_id or not settings.google_client_secret:
        raise CalendarServiceError("Google Calendar OAuth is not configured.")

    response = requests.post(
        GOOGLE_TOKEN_URL,
        data={
            "code": authorization_code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": "postmessage",
            "grant_type": "authorization_code",
        },
        timeout=20,
    )
    if response.status_code >= 400:
        logger.warning("Google OAuth token exchange failed: %s", response.status_code)
        raise CalendarServiceError("Unable to connect Google Calendar.")

    payload = response.json()
    access_token = payload.get("access_token")
    if not isinstance(access_token, str) or not access_token:
        raise CalendarServiceError("Google OAuth did not return an access token.")

    connection_id = secrets.token_urlsafe(32)
    _CONNECTIONS[connection_id] = CalendarConnection(
        access_token=access_token,
        refresh_token=payload.get("refresh_token"),
        expires_at=datetime.now(UTC)
        + timedelta(seconds=int(payload.get("expires_in", 3600))),
    )
    return connection_id


def get_calendar_status(connection_id: str | None) -> bool:
    """Return whether a calendar connection id is known by this process."""

    return bool(connection_id and connection_id in _CONNECTIONS)


def create_calendar_events(
    *,
    connection_id: str,
    events: list[dict[str, Any]],
) -> list[dict[str, str]]:
    """Create Google Calendar events using a stored connection."""

    connection = _CONNECTIONS.get(connection_id)
    if connection is None:
        raise CalendarServiceError("Google Calendar is not connected.")

    created_events: list[dict[str, str]] = []
    for event in events:
        response = requests.post(
            GOOGLE_CALENDAR_EVENTS_URL,
            headers={
                "Authorization": f"Bearer {connection.access_token}",
                "Content-Type": "application/json",
            },
            json=event,
            timeout=20,
        )
        if response.status_code >= 400:
            logger.warning("Google Calendar event creation failed: %s", response.status_code)
            raise CalendarServiceError("Unable to create Google Calendar events.")

        payload = response.json()
        created_events.append(
            {
                "id": str(payload.get("id", "")),
                "htmlLink": str(payload.get("htmlLink", "")),
            }
        )

    return created_events
