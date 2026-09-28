"""Create database tables for the AI Learning Agent ORM schema.

Run this script after setting DATABASE_URL in the project root .env file:

    python -m backend.scripts.create_tables
"""

from __future__ import annotations

import sys

from backend.utils.console import configure_utf8_output


configure_utf8_output(sys.stdout, sys.stderr)


def main() -> int:
    """Create all SQLAlchemy metadata tables in the configured database."""

    try:
        from backend.database.database import Base, engine
        from backend.database.models import (  # noqa: F401
            FeedbackHistory,
            LearnerIntent,
            LearningPlan,
            NudgeHistory,
            Progress,
            User,
        )
    except RuntimeError as exc:
        print("Database configuration is incomplete.")
        print(f"Details: {exc}")
        return 1
    except Exception as exc:
        print("Database table setup failed.")
        print("Check DATABASE_URL and installed database dependencies.")
        print(f"Details: {exc}")
        return 1

    try:
        Base.metadata.create_all(bind=engine)
    except Exception as exc:
        print("Database table creation failed.")
        print("Check PostgreSQL availability, permissions, and DATABASE_URL.")
        print(f"Details: {exc}")
        return 1

    print("Database tables created successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
