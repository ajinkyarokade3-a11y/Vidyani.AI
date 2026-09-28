"""Persistence service for learning workflow data.

This service is the application-facing boundary around the database CRUD layer.
It contains no SQL queries and has no dependency on CrewAI, Gemini, FastAPI
routes, or agent internals.
"""

from __future__ import annotations

import logging
from collections.abc import Sequence

from backend.database import crud
from backend.database.crud import PersistenceError
from backend.database.models import (
    FeedbackHistory,
    LearnerIntent as LearnerIntentRecord,
    LearningPlan as LearningPlanRecord,
    NudgeHistory,
    Progress,
    User,
)
from backend.schemas.feedback import FeedbackReport
from backend.schemas.intent import LearnerIntent, missing_required_intent_fields
from backend.schemas.nudge import NudgeReport
from backend.schemas.planner import LearningPlan
from backend.schemas.progress import ProgressReport


logger = logging.getLogger(__name__)


class PersistenceService:
    """Coordinate reusable persistence operations for learning workflows."""

    def create_user(self, name: str, email: str | None = None) -> User:
        """Create and return a user record."""

        logger.info("Creating user record.")
        return crud.create_user(name=name, email=email)

    def get_user(
        self,
        *,
        user_id: int | None = None,
        email: str | None = None,
        name: str | None = None,
    ) -> User | None:
        """Retrieve a user by id, email, or name."""

        logger.info("Retrieving user record.")
        if user_id is not None:
            return crud.get_user_by_id(user_id)
        if email is not None:
            return crud.get_user_by_email(email)
        if name is not None:
            return crud.get_user_by_name(name)
        raise ValueError("Provide user_id, email, or name to retrieve a user.")

    def save_intent(
        self,
        *,
        user_id: int,
        intent: LearnerIntent,
    ) -> LearnerIntentRecord:
        """Save a complete learner intent and return the stored record."""

        self._validate_complete_intent(intent)
        logger.info("Saving learner intent for user_id=%s.", user_id)
        return crud.create_learner_intent(
            user_id=user_id,
            learning_goal=intent.learning_goal or "",
            subject=intent.subject or "",
            current_skill_level=intent.current_skill_level or "",
            available_time=intent.available_time or "",
            target_deadline=intent.target_deadline or "",
            preferred_learning_style=intent.preferred_learning_style,
        )

    def get_latest_intent(self, user_id: int) -> LearnerIntentRecord | None:
        """Return the most recent learner intent for a user."""

        logger.info("Retrieving latest learner intent for user_id=%s.", user_id)
        return crud.get_latest_learner_intent(user_id)

    def save_learning_plan(
        self,
        *,
        user_id: int,
        plan: LearningPlan,
        title: str | None = None,
    ) -> LearningPlanRecord:
        """Save a planner-generated learning plan exactly as JSON."""

        logger.info("Saving learning plan for user_id=%s.", user_id)
        return crud.create_learning_plan(
            user_id=user_id,
            title=title or f"{plan.subject} Learning Plan",
            plan_json=plan.model_dump(mode="json"),
        )

    def get_latest_learning_plan(self, user_id: int) -> LearningPlanRecord | None:
        """Return the most recent learning plan for a user."""

        logger.info("Retrieving latest learning plan for user_id=%s.", user_id)
        return crud.get_latest_learning_plan(user_id)

    def update_progress(
        self,
        *,
        user_id: int,
        progress_report: ProgressReport,
        topic: str | None = None,
    ) -> Progress:
        """Create or update progress from a workflow progress report."""

        progress_topic = topic or progress_report.next_recommended_task
        logger.info(
            "Updating progress for user_id=%s topic=%s.",
            user_id,
            progress_topic,
        )
        return crud.update_progress(
            user_id=user_id,
            topic=progress_topic,
            completion_percentage=progress_report.overall_completion_percentage,
            completed=progress_report.overall_completion_percentage >= 100,
        )

    def get_progress(self, *, user_id: int, topic: str) -> Progress | None:
        """Return progress for one user/topic pair."""

        logger.info("Retrieving progress for user_id=%s topic=%s.", user_id, topic)
        return crud.get_progress(user_id=user_id, topic=topic)

    def list_progress(self, user_id: int) -> Sequence[Progress]:
        """Return all progress records for a user."""

        logger.info("Retrieving progress records for user_id=%s.", user_id)
        return crud.list_progress(user_id)

    def save_feedback(
        self,
        *,
        user_id: int,
        feedback_report: FeedbackReport,
    ) -> FeedbackHistory:
        """Save a feedback report and return the stored history record."""

        logger.info("Saving feedback for user_id=%s.", user_id)
        return crud.create_feedback(
            user_id=user_id,
            feedback=feedback_report.overall_performance_assessment,
            strengths=feedback_report.strengths,
            improvements=feedback_report.areas_for_improvement,
        )

    def get_feedback_history(self, user_id: int) -> Sequence[FeedbackHistory]:
        """Return all feedback records for a user."""

        logger.info("Retrieving feedback history for user_id=%s.", user_id)
        return crud.get_feedback_history(user_id)

    def save_nudge(
        self,
        *,
        user_id: int,
        nudge_report: NudgeReport,
    ) -> NudgeHistory:
        """Save a nudge report and return the stored history record."""

        logger.info("Saving nudge for user_id=%s.", user_id)
        return crud.create_nudge(
            user_id=user_id,
            message=nudge_report.personalized_message,
            urgency=nudge_report.urgency,
        )

    def get_nudge_history(self, user_id: int) -> Sequence[NudgeHistory]:
        """Return all nudge records for a user."""

        logger.info("Retrieving nudge history for user_id=%s.", user_id)
        return crud.get_nudge_history(user_id)

    def _validate_complete_intent(self, intent: LearnerIntent) -> None:
        """Ensure intent has all non-null fields required by the database table."""

        missing_fields = missing_required_intent_fields(intent)
        if not intent.subject:
            missing_fields.append("subject")
        if missing_fields:
            raise PersistenceError(
                "Cannot persist incomplete learner intent. Missing fields: "
                f"{', '.join(missing_fields)}."
            )
