"""Smoke test for validating PostgreSQL database connectivity.

Run this script after setting DATABASE_URL in the project root .env file:

    python -m backend.scripts.test_database
"""

from __future__ import annotations

import sys

from backend.utils.console import configure_utf8_output


configure_utf8_output(sys.stdout, sys.stderr)


def main() -> int:
    """Connect to PostgreSQL, execute a minimal query, and report the result."""

    try:
        from sqlalchemy import text

        from backend.database.database import engine
    except RuntimeError as exc:
        print("Database configuration is incomplete.")
        print(f"Details: {exc}")
        return 1
    except Exception as exc:
        print("Database setup failed.")
        print("Check DATABASE_URL and installed database dependencies.")
        print(f"Details: {exc}")
        return 1

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as exc:
        print("Database connection failed.")
        print("Check DATABASE_URL, PostgreSQL availability, and network access.")
        print(f"Details: {exc}")
        return 1

    print("Database connection successful.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
