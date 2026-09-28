"""Service entry point for running and persisting AI learning workflows."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from backend.crew.crew_manager import CrewManager
from backend.schemas.learning_session import LearningSessionResponse


if TYPE_CHECKING:
    from backend.database.models import User
    from backend.services.persistence_service import PersistenceService


logger = logging.getLogger(__name__)


def run_learning_session(
    user_request: str,
    *,
    user_id: int | None = None,
    user_name: str = "Default Learner",
    user_email: str | None = None,
) -> LearningSessionResponse:
    """Run the existing learning workflow and persist complete outputs.

    Persistence setup failures are logged and treated as non-fatal so the
    AI-generated workflow response is still returned to the caller.
    """

    persistence_service = _create_persistence_service()
    user = (
        _resolve_user(
            persistence_service,
            user_id=user_id,
            user_name=user_name,
            user_email=user_email,
        )
        if persistence_service is not None
        else None
    )

    manager = CrewManager(persistence_service=persistence_service)
    return manager.run_learning_workflow(
        user_request,
        user_id=user.id if user is not None else None,
    )


def _create_persistence_service() -> "PersistenceService | None":
    """Create the persistence service, returning ``None`` if setup fails."""

    try:
        from backend.services.persistence_service import PersistenceService

        return PersistenceService()
    except Exception as exc:
        logger.error("Persistence service setup failed; continuing without persistence.")
        logger.debug("Persistence service setup details: %s", exc)
        return None


def _resolve_user(
    persistence_service: "PersistenceService",
    *,
    user_id: int | None,
    user_name: str,
    user_email: str | None,
) -> "User | None":
    """Retrieve an existing user or create one for workflow persistence."""

    try:
        user = None
        if user_id is not None:
            user = persistence_service.get_user(user_id=user_id)
        if user is None and user_email is not None:
            user = persistence_service.get_user(email=user_email)
        if user is None:
            user = persistence_service.get_user(name=user_name)
        if user is not None:
            logger.info("Using existing user_id=%s for persistence.", user.id)
            return user

        logger.info("Creating user for learning workflow persistence.")
        return persistence_service.create_user(name=user_name, email=user_email)
    except Exception as exc:
        logger.error("User persistence setup failed; continuing without persistence.")
        logger.debug("User persistence setup details: %s", exc)
        return None
