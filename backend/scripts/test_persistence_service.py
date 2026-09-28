"""Integration test for the PersistenceService.

Run after creating database tables and setting DATABASE_URL:

    python -m backend.scripts.test_persistence_service
"""

from __future__ import annotations

import json
import logging
import sys
from datetime import UTC, datetime
from typing import Any

from backend.utils.console import configure_utf8_output


configure_utf8_output(sys.stdout, sys.stderr)


def _configure_logging() -> None:
    """Configure readable logging for service operations."""

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")


def _json_default(value: object) -> str:
    """Return a JSON-friendly representation for datetime values."""

    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def _model_to_dict(value: Any) -> dict[str, object]:
    """Convert a SQLAlchemy model instance into printable column data."""

    return {
        column.name: getattr(value, column.name)
        for column in value.__table__.columns
    }


def _print_model(label: str, value: object) -> None:
    """Print one stored ORM object as formatted JSON."""

    print(f"{label}:")
    print(json.dumps(_model_to_dict(value), indent=4, default=_json_default))


def main() -> int:
    """Demonstrate PersistenceService create, save, update, and read behavior."""

    _configure_logging()

    try:
        from backend.database.crud import PersistenceError, delete_user
        from backend.schemas.feedback import FeedbackReport
        from backend.schemas.intent import LearnerIntent
        from backend.schemas.nudge import NudgeReport
        from backend.schemas.planner import LearningPhase, LearningPlan
        from backend.schemas.progress import ProgressReport
        from backend.services.persistence_service import PersistenceService
    except RuntimeError as exc:
        print("Persistence service configuration is incomplete.")
        print(f"Details: {exc}")
        return 1
    except Exception as exc:
        print("Persistence service test setup failed.")
        print("Check DATABASE_URL, tables, and installed dependencies.")
        print(f"Details: {exc}")
        return 1

    service = PersistenceService()
    timestamp = datetime.now(tz=UTC).strftime("%Y%m%d%H%M%S")
    test_email = f"persistence-service-test-{timestamp}@example.com"
    test_user_id: int | None = None

    try:
        print("Creating or retrieving test user...")
        user = service.get_user(email=test_email)
        if user is None:
            user = service.create_user("Persistence Service Test User", test_email)
        test_user_id = user.id
        print("✓ User ready")
        _print_model("User", user)
        print()

        mock_intent = LearnerIntent(
            learning_goal="Become job-ready in Python for Data Science.",
            subject="Python for Data Science",
            current_skill_level="Beginner",
            available_time="2 hours every weekday and 4 hours on weekends",
            target_deadline="4 months",
            preferred_learning_style="Hands-on projects and coding exercises",
            is_complete=True,
            missing_information=[],
            follow_up_questions=[],
        )
        print("Saving intent...")
        saved_intent = service.save_intent(user_id=user.id, intent=mock_intent)
        print("✓ Intent saved")
        _print_model("Saved LearnerIntent", saved_intent)
        print()

        mock_plan = LearningPlan(
            learning_goal="Python for Data Science internship readiness",
            subject="Python for Data Science",
            learner_level="Beginner",
            total_available_time="18 hours per week",
            target_deadline="4 months",
            preferred_learning_style="Hands-on projects",
            overview="A project-first roadmap for internship readiness.",
            phases=[
                LearningPhase(
                    phase_number=1,
                    title="Python foundations",
                    objective="Build confidence with Python syntax and scripts.",
                    recommended_topics=["Syntax", "Functions", "Data structures"],
                    estimated_duration="4 weeks",
                    milestones=["Complete practice drills", "Build a CLI project"],
                    suggested_resource_categories=["docs", "coding exercises"],
                ),
                LearningPhase(
                    phase_number=2,
                    title="Data analysis portfolio",
                    objective="Analyze real datasets and publish portfolio work.",
                    recommended_topics=["NumPy", "pandas", "visualization"],
                    estimated_duration="6 weeks",
                    milestones=["Finish EDA project", "Publish notebook"],
                    suggested_resource_categories=["projects", "notebooks"],
                ),
            ],
            final_milestone="Complete 3 end-to-end portfolio projects.",
        )
        print("Saving learning plan...")
        saved_plan = service.save_learning_plan(user_id=user.id, plan=mock_plan)
        print("✓ Learning plan saved")
        _print_model("Saved LearningPlan", saved_plan)
        print()

        mock_progress = ProgressReport(
            current_phase=1,
            overall_completion_percentage=35.0,
            completed_topics=["Syntax", "Functions"],
            remaining_topics=["Data structures", "pandas", "visualization"],
            completed_milestones=["Complete practice drills"],
            next_recommended_task="Build a Python CLI project",
            learner_status="On Track",
            summary="The learner is progressing steadily through foundations.",
        )
        print("Updating progress...")
        saved_progress = service.update_progress(
            user_id=user.id,
            progress_report=mock_progress,
            topic="Python foundations",
        )
        print("✓ Progress updated")
        _print_model("Saved Progress", saved_progress)
        print()

        mock_feedback = FeedbackReport(
            overall_performance_assessment="Strong early momentum.",
            strengths=["Consistent study schedule", "Clear portfolio goal"],
            areas_for_improvement=["Practice pandas", "Add interview drills"],
            personalized_study_recommendations=[
                "Complete one CLI project before moving into notebooks."
            ],
            motivation_message="You are building useful habits.",
            next_study_session_focus="Finish the Python foundations project.",
        )
        print("Saving feedback...")
        saved_feedback = service.save_feedback(
            user_id=user.id,
            feedback_report=mock_feedback,
        )
        print("✓ Feedback saved")
        _print_model("Saved FeedbackHistory", saved_feedback)
        print()

        mock_nudge = NudgeReport(
            intervention_required=True,
            learner_status="On Track",
            nudge_type="Study Suggestion",
            personalized_message="Block two hours for your portfolio project today.",
            recommended_action="Finish input validation and commit the project.",
            urgency="Medium",
        )
        print("Saving nudge...")
        saved_nudge = service.save_nudge(user_id=user.id, nudge_report=mock_nudge)
        print("✓ Nudge saved")
        _print_model("Saved NudgeHistory", saved_nudge)
        print()

        print("Retrieving stored data...")
        retrieved_user = service.get_user(user_id=user.id)
        latest_intent = service.get_latest_intent(user.id)
        latest_plan = service.get_latest_learning_plan(user.id)
        progress = service.get_progress(user_id=user.id, topic="Python foundations")
        feedback_history = service.get_feedback_history(user.id)
        nudge_history = service.get_nudge_history(user.id)

        if retrieved_user is None:
            raise RuntimeError("User retrieval failed.")
        if latest_intent is None:
            raise RuntimeError("Latest intent retrieval failed.")
        if latest_plan is None:
            raise RuntimeError("Latest learning plan retrieval failed.")
        if progress is None:
            raise RuntimeError("Progress retrieval failed.")
        if not feedback_history:
            raise RuntimeError("Feedback history retrieval failed.")
        if not nudge_history:
            raise RuntimeError("Nudge history retrieval failed.")

        print("✓ User retrieved")
        print("✓ Intent retrieved")
        print("✓ Learning plan retrieved")
        print("✓ Progress retrieved")
        print("✓ Feedback history retrieved")
        print("✓ Nudge history retrieved")
        print()

        _print_model("Retrieved User", retrieved_user)
        _print_model("Latest LearnerIntent", latest_intent)
        _print_model("Latest LearningPlan", latest_plan)
        _print_model("Retrieved Progress", progress)
        _print_model("Latest FeedbackHistory", feedback_history[0])
        _print_model("Latest NudgeHistory", nudge_history[0])
        print()

    except (PersistenceError, RuntimeError, ValueError) as exc:
        print("Persistence service test failed.")
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
                if deleted:
                    print("Temporary test user deleted.")
                    print("Related records are removed by cascade behavior.")

    print("Persistence service test completed successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
