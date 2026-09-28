"""SQLAlchemy database connection setup.

This module owns only the database connection primitives:

- ``engine`` for database connectivity.
- ``SessionLocal`` for creating unit-of-work sessions.
- ``Base`` for future SQLAlchemy ORM models to inherit from.

No tables, models, or CRUD operations are defined here.
"""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from backend.core.config import get_settings


def _get_database_url() -> str:
    """Return the configured database URL or raise a clear setup error."""

    database_url = get_settings().database_url
    if database_url is None:
        raise RuntimeError(
            "DATABASE_URL is required. Add it to your .env file or environment."
        )
    return database_url


def _create_engine(database_url: str) -> Engine:
    """Create the SQLAlchemy engine with production-friendly defaults."""

    return create_engine(
        database_url,
        pool_pre_ping=True,
    )


class Base(DeclarativeBase):
    """Declarative base class for future SQLAlchemy ORM models."""


engine: Engine = _create_engine(_get_database_url())
SessionLocal: sessionmaker[Session] = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)
