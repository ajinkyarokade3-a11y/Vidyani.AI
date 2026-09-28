"""Reusable CRUD helpers for the database persistence layer.

This module only knows about SQLAlchemy sessions and ORM models. It does not
import or depend on CrewAI agents, orchestration services, or FastAPI routes.
"""

from __future__ import annotations

from collections.abc import Iterator, Sequence
from contextlib import contextmanager
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from backend.database.database import SessionLocal
from backend.database.models import (
    FeedbackHistory,
    LearnerIntent,
    LearningPlan,
    NudgeHistory,
    Progress,
    User,
)


class PersistenceError(RuntimeError):
    """Raised when a database operation fails inside the persistence layer."""


@contextmanager
def get_db_session() -> Iterator[Session]:
    """Yield a managed database session with commit and rollback handling.

    The session commits if the operation succeeds. Any SQLAlchemy error rolls
    back the transaction and is re-raised as ``PersistenceError`` with the
    original exception chained for debugging.
    """

    session = SessionLocal()
    try:
        yield session
        session.commit()
    except SQLAlchemyError as exc:
        session.rollback()
        raise PersistenceError(f"Database operation failed: {exc}") from exc
    finally:
        session.close()


def create_user(name: str, email: str | None = None) -> User:
    """Create and return a user."""

    with get_db_session() as session:
        user = User(name=name, email=email)
        session.add(user)
        session.flush()
        session.refresh(user)
        return user


def get_user_by_id(user_id: int) -> User | None:
    """Return a user by primary key, or ``None`` when not found."""

    with get_db_session() as session:
        return session.get(User, user_id)


def get_user_by_name(name: str) -> User | None:
    """Return the first user with the given name, or ``None`` when absent."""

    with get_db_session() as session:
        statement = select(User).where(User.name == name).order_by(User.id.asc())
        return session.scalars(statement).first()


def get_user_by_email(email: str) -> User | None:
    """Return a user by email address, or ``None`` when not found."""

    with get_db_session() as session:
        statement = select(User).where(User.email == email)
        return session.scalars(statement).first()


def list_users(limit: int | None = None, offset: int = 0) -> Sequence[User]:
    """Return users ordered by creation sequence."""

    with get_db_session() as session:
        statement = select(User).order_by(User.id.asc()).offset(offset)
        if limit is not None:
            statement = statement.limit(limit)
        return session.scalars(statement).all()


def delete_user(user_id: int) -> bool:
    """Delete a user by id and return whether a row was deleted."""

    with get_db_session() as session:
        user = session.get(User, user_id)
        if user is None:
            return False

        session.delete(user)
        return True


def create_learner_intent(
    *,
    user_id: int,
    learning_goal: str,
    subject: str,
    current_skill_level: str,
    available_time: str,
    target_deadline: str,
    preferred_learning_style: str | None = None,
) -> LearnerIntent:
    """Create and return a learner intent for a user."""

    with get_db_session() as session:
        intent = LearnerIntent(
            user_id=user_id,
            learning_goal=learning_goal,
            subject=subject,
            current_skill_level=current_skill_level,
            available_time=available_time,
            target_deadline=target_deadline,
            preferred_learning_style=preferred_learning_style,
        )
        session.add(intent)
        session.flush()
        session.refresh(intent)
        return intent


def get_latest_learner_intent(user_id: int) -> LearnerIntent | None:
    """Return the most recent learner intent for a user."""

    with get_db_session() as session:
        statement = (
            select(LearnerIntent)
            .where(LearnerIntent.user_id == user_id)
            .order_by(LearnerIntent.created_at.desc(), LearnerIntent.id.desc())
        )
        return session.scalars(statement).first()


def list_learner_intents(user_id: int) -> Sequence[LearnerIntent]:
    """Return all learner intents for a user, newest first."""

    with get_db_session() as session:
        statement = (
            select(LearnerIntent)
            .where(LearnerIntent.user_id == user_id)
            .order_by(LearnerIntent.created_at.desc(), LearnerIntent.id.desc())
        )
        return session.scalars(statement).all()


def create_learning_plan(
    *,
    user_id: int,
    title: str,
    plan_json: dict[str, Any],
) -> LearningPlan:
    """Create and return a learning plan with the planner JSON preserved."""

    with get_db_session() as session:
        plan = LearningPlan(user_id=user_id, title=title, plan_json=plan_json)
        session.add(plan)
        session.flush()
        session.refresh(plan)
        return plan


def get_latest_learning_plan(user_id: int) -> LearningPlan | None:
    """Return the most recent learning plan for a user."""

    with get_db_session() as session:
        statement = (
            select(LearningPlan)
            .where(LearningPlan.user_id == user_id)
            .order_by(LearningPlan.created_at.desc(), LearningPlan.id.desc())
        )
        return session.scalars(statement).first()


def list_learning_plans(user_id: int) -> Sequence[LearningPlan]:
    """Return all learning plans for a user, newest first."""

    with get_db_session() as session:
        statement = (
            select(LearningPlan)
            .where(LearningPlan.user_id == user_id)
            .order_by(LearningPlan.created_at.desc(), LearningPlan.id.desc())
        )
        return session.scalars(statement).all()


def delete_learning_plan(plan_id: int) -> bool:
    """Delete a learning plan by id and return whether a row was deleted."""

    with get_db_session() as session:
        plan = session.get(LearningPlan, plan_id)
        if plan is None:
            return False

        session.delete(plan)
        return True


def create_progress_record(
    *,
    user_id: int,
    topic: str,
    completion_percentage: float = 0.0,
    completed: bool = False,
) -> Progress:
    """Create a progress record, updating an existing user/topic row if present."""

    existing_progress = get_progress(user_id=user_id, topic=topic)
    if existing_progress is not None:
        return update_progress(
            user_id=user_id,
            topic=topic,
            completion_percentage=completion_percentage,
            completed=completed,
        )

    with get_db_session() as session:
        progress = Progress(
            user_id=user_id,
            topic=topic,
            completion_percentage=completion_percentage,
            completed=completed,
        )
        session.add(progress)
        session.flush()
        session.refresh(progress)
        return progress


def get_progress(user_id: int, topic: str) -> Progress | None:
    """Return one progress record for a user's topic."""

    with get_db_session() as session:
        statement = select(Progress).where(
            Progress.user_id == user_id,
            Progress.topic == topic,
        )
        return session.scalars(statement).first()


def update_progress(
    *,
    user_id: int,
    topic: str,
    completion_percentage: float | None = None,
    completed: bool | None = None,
) -> Progress:
    """Update an existing progress record or create it when no row exists.

    This behaves like a user/topic upsert so repeated updates do not create
    duplicate progress rows for the same topic.
    """

    with get_db_session() as session:
        statement = select(Progress).where(
            Progress.user_id == user_id,
            Progress.topic == topic,
        )
        progress = session.scalars(statement).first()
        if progress is None:
            progress = Progress(
                user_id=user_id,
                topic=topic,
                completion_percentage=completion_percentage or 0.0,
                completed=completed if completed is not None else False,
            )
            session.add(progress)
        else:
            if completion_percentage is not None:
                progress.completion_percentage = completion_percentage
            if completed is not None:
                progress.completed = completed

        session.flush()
        session.refresh(progress)
        return progress


def list_progress(user_id: int) -> Sequence[Progress]:
    """Return all progress records for a user."""

    with get_db_session() as session:
        statement = (
            select(Progress)
            .where(Progress.user_id == user_id)
            .order_by(Progress.updated_at.desc(), Progress.id.desc())
        )
        return session.scalars(statement).all()


def create_feedback(
    *,
    user_id: int,
    feedback: str,
    strengths: list[str],
    improvements: list[str],
) -> FeedbackHistory:
    """Create and return a feedback history entry."""

    with get_db_session() as session:
        feedback_entry = FeedbackHistory(
            user_id=user_id,
            feedback=feedback,
            strengths=strengths,
            improvements=improvements,
        )
        session.add(feedback_entry)
        session.flush()
        session.refresh(feedback_entry)
        return feedback_entry


def get_feedback_history(user_id: int) -> Sequence[FeedbackHistory]:
    """Return all feedback history entries for a user, newest first."""

    with get_db_session() as session:
        statement = (
            select(FeedbackHistory)
            .where(FeedbackHistory.user_id == user_id)
            .order_by(FeedbackHistory.created_at.desc(), FeedbackHistory.id.desc())
        )
        return session.scalars(statement).all()


def get_latest_feedback(user_id: int) -> FeedbackHistory | None:
    """Return the most recent feedback history entry for a user."""

    with get_db_session() as session:
        statement = (
            select(FeedbackHistory)
            .where(FeedbackHistory.user_id == user_id)
            .order_by(FeedbackHistory.created_at.desc(), FeedbackHistory.id.desc())
        )
        return session.scalars(statement).first()


def create_nudge(
    *,
    user_id: int,
    message: str,
    urgency: str,
) -> NudgeHistory:
    """Create and return a nudge history entry."""

    with get_db_session() as session:
        nudge = NudgeHistory(user_id=user_id, message=message, urgency=urgency)
        session.add(nudge)
        session.flush()
        session.refresh(nudge)
        return nudge


def get_nudge_history(user_id: int) -> Sequence[NudgeHistory]:
    """Return all nudge history entries for a user, newest first."""

    with get_db_session() as session:
        statement = (
            select(NudgeHistory)
            .where(NudgeHistory.user_id == user_id)
            .order_by(NudgeHistory.created_at.desc(), NudgeHistory.id.desc())
        )
        return session.scalars(statement).all()


def get_latest_nudge(user_id: int) -> NudgeHistory | None:
    """Return the most recent nudge history entry for a user."""

    with get_db_session() as session:
        statement = (
            select(NudgeHistory)
            .where(NudgeHistory.user_id == user_id)
            .order_by(NudgeHistory.created_at.desc(), NudgeHistory.id.desc())
        )
        return session.scalars(statement).first()
