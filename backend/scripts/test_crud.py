"""Integration test for the reusable database CRUD layer.

Run after creating database tables and setting DATABASE_URL:

    python -m backend.scripts.test_crud
"""

from __future__ import annotations

import json
import sys
from datetime import UTC, datetime
from typing import Any

from backend.utils.console import configure_utf8_output


configure_utf8_output(sys.stdout, sys.stderr)


def _json_default(value: object) -> str:
    """Return a JSON-friendly representation for non-primitive values."""

    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def _model_to_dict(value: Any) -> dict[str, object]:
    """Convert a SQLAlchemy ORM object into a dictionary of column values."""

    return {
        column.name: getattr(value, column.name)
        for column in value.__table__.columns
    }


def _print_object(label: str, value: object) -> None:
    """Print a readable representation of a retrieved ORM object."""

    print(f"{label}:")
    print(json.dumps(_model_to_dict(value), indent=4, default=_json_default))


def _print_json(label: str, value: dict[str, object]) -> None:
    """Print a formatted JSON payload for structured test data."""

    print(f"{label}:")
    print(json.dumps(value, indent=4, default=_json_default))


def main() -> int:
    """Create, read, update, and clean up records for every major entity."""

    try:
        from backend.database.crud import (
            PersistenceError,
            create_feedback,
            create_learner_intent,
            create_learning_plan,
            create_nudge,
            create_progress_record,
            create_user,
            delete_user,
            get_feedback_history,
            get_latest_feedback,
            get_latest_learner_intent,
            get_latest_learning_plan,
            get_latest_nudge,
            get_nudge_history,
            get_progress,
            get_user_by_email,
            get_user_by_id,
            list_learner_intents,
            list_learning_plans,
            list_progress,
            update_progress,
        )
    except RuntimeError as exc:
        print("Database configuration is incomplete.")
        print(f"Details: {exc}")
        return 1
    except Exception as exc:
        print("CRUD test setup failed.")
        print("Check DATABASE_URL, tables, and installed database dependencies.")
        print(f"Details: {exc}")
        return 1

    timestamp = datetime.now(tz=UTC).strftime("%Y%m%d%H%M%S")
    test_email = f"crud-test-{timestamp}@example.com"
    test_user_id: int | None = None

    try:
        print("Creating test user...")
        user = create_user(name="CRUD Test User", email=test_email)
        test_user_id = user.id
        print("✓ User created")
        _print_object("User", user)
        print()

        print("Saving learner intent...")
        learner_intent = create_learner_intent(
            user_id=user.id,
            learning_goal="Become job-ready in Python for Data Science.",
            subject="Python for Data Science",
            current_skill_level="Beginner with basic programming knowledge",
            available_time="2 hours every weekday and 4 hours on weekends",
            target_deadline="4 months",
            preferred_learning_style="Hands-on projects and coding exercises",
        )
        print("✓ Success")
        _print_object("LearnerIntent", learner_intent)
        print()

        plan_json = {
            "learning_goal": "Python for Data Science internship readiness",
            "phases": [
                {
                    "phase_number": 1,
                    "title": "Python foundations",
                    "milestones": ["Complete syntax drills", "Build a CLI mini-project"],
                },
                {
                    "phase_number": 2,
                    "title": "Data analysis projects",
                    "milestones": ["Finish pandas project", "Publish portfolio notebook"],
                },
            ],
            "final_milestone": "Complete 3 end-to-end portfolio projects",
        }

        print("Saving learning plan...")
        learning_plan = create_learning_plan(
            user_id=user.id,
            title="Python for Data Science Roadmap",
            plan_json=plan_json,
        )
        print("✓ Success")
        _print_object("LearningPlan", learning_plan)
        _print_json("Stored plan_json", learning_plan.plan_json)
        print()

        print("Saving progress...")
        progress = create_progress_record(
            user_id=user.id,
            topic="Python foundations",
            completion_percentage=20.0,
            completed=False,
        )
        progress = update_progress(
            user_id=user.id,
            topic="Python foundations",
            completion_percentage=35.0,
            completed=False,
        )
        print("✓ Success")
        _print_object("Progress", progress)
        print()

        print("Saving feedback...")
        feedback = create_feedback(
            user_id=user.id,
            feedback="Good start. Keep daily practice focused on small coding tasks.",
            strengths=["Consistent study schedule", "Clear portfolio goal"],
            improvements=["Increase pandas practice", "Add interview drills"],
        )
        print("✓ Success")
        _print_object("FeedbackHistory", feedback)
        print()

        print("Saving nudge...")
        nudge = create_nudge(
            user_id=user.id,
            message="Schedule one portfolio coding block this weekend.",
            urgency="Medium",
        )
        print("✓ Success")
        _print_object("NudgeHistory", nudge)
        print()

        print("Reading data...")
        retrieved_user = get_user_by_id(user.id)
        retrieved_user_by_email = get_user_by_email(test_email)
        latest_intent = get_latest_learner_intent(user.id)
        latest_plan = get_latest_learning_plan(user.id)
        retrieved_progress = get_progress(user_id=user.id, topic="Python foundations")
        latest_feedback = get_latest_feedback(user.id)
        latest_nudge = get_latest_nudge(user.id)

        if retrieved_user is None or retrieved_user_by_email is None:
            raise RuntimeError("User retrieval failed.")
        if latest_intent is None:
            raise RuntimeError("Latest learner intent retrieval failed.")
        if latest_plan is None:
            raise RuntimeError("Latest learning plan retrieval failed.")
        if retrieved_progress is None:
            raise RuntimeError("Progress retrieval failed.")
        if latest_feedback is None:
            raise RuntimeError("Latest feedback retrieval failed.")
        if latest_nudge is None:
            raise RuntimeError("Latest nudge retrieval failed.")

        print("✓ User retrieved")
        print("✓ Latest learner intent retrieved")
        print("✓ Latest learning plan retrieved")
        print("✓ Progress retrieved")
        print("✓ Feedback retrieved")
        print("✓ Nudge retrieved")
        print()

        _print_object("Retrieved user", retrieved_user)
        _print_object("Latest learner intent", latest_intent)
        _print_object("Latest learning plan", latest_plan)
        _print_object("Retrieved progress", retrieved_progress)
        _print_object("Latest feedback", latest_feedback)
        _print_object("Latest nudge", latest_nudge)
        print()

        print("History counts:")
        print(f"Learner intents: {len(list_learner_intents(user.id))}")
        print(f"Learning plans: {len(list_learning_plans(user.id))}")
        print(f"Progress records: {len(list_progress(user.id))}")
        print(f"Feedback records: {len(get_feedback_history(user.id))}")
        print(f"Nudge records: {len(get_nudge_history(user.id))}")
        print()

    except (PersistenceError, RuntimeError) as exc:
        print("CRUD tests failed.")
        print(f"Details: {exc}")
        return 1
    finally:
        if test_user_id is not None:
            try:
                deleted = delete_user(test_user_id)
            except Exception as exc:
                print("Temporary test user cleanup failed.")
                print(f"Details: {exc}")
            else:
                print("Temporary test user deleted.")
                if deleted:
                    print("Related records are removed by configured cascade behavior.")

    print()
    print("CRUD tests completed successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
