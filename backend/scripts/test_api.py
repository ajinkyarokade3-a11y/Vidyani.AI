"""Integration test for the learning REST API routes.

Run after creating database tables and setting DATABASE_URL:

    python -m backend.scripts.test_api
"""

from __future__ import annotations

import os
import sys
from datetime import UTC, datetime
from typing import Any

from backend.utils.console import configure_utf8_output


configure_utf8_output(sys.stdout, sys.stderr)

os.environ["MOCK_MODE"] = "true"


def _print_result(label: str, passed: bool, detail: str = "") -> None:
    """Print one endpoint test result."""

    suffix = f" - {detail}" if detail else ""
    print(f"{label}: {'PASS' if passed else 'FAIL'}{suffix}")


def _request_failed(response_json: Any) -> str:
    """Return a compact response failure detail."""

    return f"response={response_json}"


def _is_success_envelope(response_json: Any) -> bool:
    """Return whether a response follows the success envelope shape."""

    return (
        isinstance(response_json, dict)
        and response_json.get("success") is True
        and isinstance(response_json.get("message"), str)
        and "data" in response_json
    )


def _is_error_envelope(response_json: Any) -> bool:
    """Return whether a response follows the error envelope shape."""

    return (
        isinstance(response_json, dict)
        and response_json.get("success") is False
        and isinstance(response_json.get("message"), str)
        and "error_code" in response_json
    )


def main() -> int:
    """Exercise the learning API endpoints with FastAPI TestClient."""

    try:
        from fastapi.testclient import TestClient

        from backend.core.config import get_settings
        from backend.database.crud import delete_user
        from backend.main import app
        from backend.services.persistence_service import PersistenceService
    except Exception as exc:
        print("API test setup failed.")
        print("Check dependencies, DATABASE_URL, and table creation.")
        print(f"Details: {exc}")
        return 1

    get_settings.cache_clear()

    client = TestClient(app)
    service = PersistenceService()
    timestamp = datetime.now(tz=UTC).strftime("%Y%m%d%H%M%S")
    email = f"api-test-{timestamp}@example.com"
    user_id: int | None = None
    checks: dict[str, bool] = {}

    try:
        print("Testing GET /...")
        root_response = client.get("/")
        root_json = root_response.json()
        checks["GET /"] = (
            root_response.status_code == 200
            and _is_success_envelope(root_json)
            and root_json["data"].get("docs") == "/docs"
        )
        _print_result(
            "GET /",
            checks["GET /"],
            "" if checks["GET /"] else _request_failed(root_json),
        )

        print("Testing GET /health...")
        health_response = client.get("/health")
        health_json = health_response.json()
        checks["GET /health"] = (
            health_response.status_code == 200
            and _is_success_envelope(health_json)
            and health_json["data"].get("status") == "healthy"
            and health_json["data"].get("database") == "connected"
        )
        _print_result(
            "GET /health",
            checks["GET /health"],
            "" if checks["GET /health"] else _request_failed(health_json),
        )

        print("Testing POST /learning/session...")
        session_response = client.post(
            "/learning/session",
            json={
                "user_name": "API Test User",
                "email": email,
                "prompt": (
                    "I want to become a data scientist in 3 months. "
                    "I am a beginner. I can study 3 hours every day."
                ),
            },
        )
        session_json = session_response.json()
        workflow_data = (
            session_json.get("data", {}) if isinstance(session_json, dict) else {}
        )
        checks["POST /learning/session"] = (
            session_response.status_code == 201
            and _is_success_envelope(session_json)
            and workflow_data.get("workflow_completed") is True
            and workflow_data.get("current_stage") == "completed"
            and all(
                workflow_data.get(field_name) is not None
                for field_name in (
                    "learner_intent",
                    "learning_plan",
                    "progress_report",
                    "feedback_report",
                    "nudge_report",
                )
            )
        )
        _print_result(
            "POST /learning/session",
            checks["POST /learning/session"],
            "" if checks["POST /learning/session"] else _request_failed(session_json),
        )

        user = service.get_user(email=email)
        if user is None:
            raise RuntimeError("API test user was not persisted.")
        user_id = user.id

        endpoint_checks = [
            ("GET /users/{user_id}", f"/users/{user_id}", dict),
            ("GET /users/{user_id}/intent", f"/users/{user_id}/intent", dict),
            ("GET /users/{user_id}/plan", f"/users/{user_id}/plan", dict),
            ("GET /users/{user_id}/progress", f"/users/{user_id}/progress", list),
            ("GET /users/{user_id}/feedback", f"/users/{user_id}/feedback", list),
            ("GET /users/{user_id}/nudges", f"/users/{user_id}/nudges", list),
        ]

        for label, path, expected_type in endpoint_checks:
            print(f"Testing {label}...")
            response = client.get(path)
            response_json = response.json()
            data = response_json.get("data") if isinstance(response_json, dict) else None
            passed = (
                response.status_code == 200
                and _is_success_envelope(response_json)
                and isinstance(data, expected_type)
                and (bool(data) if expected_type is list else True)
            )
            checks[label] = passed
            _print_result(
                label,
                passed,
                "" if passed else _request_failed(response_json),
            )

        error_checks = [
            (
                "POST /learning/session invalid email",
                client.post(
                    "/learning/session",
                    json={
                        "user_name": "API Test User",
                        "email": "not-an-email",
                        "prompt": "I want to learn Python.",
                    },
                ),
                422,
            ),
            (
                "POST /learning/session empty prompt",
                client.post(
                    "/learning/session",
                    json={
                        "user_name": "API Test User",
                        "email": email,
                        "prompt": "   ",
                    },
                ),
                422,
            ),
            ("GET /users/0", client.get("/users/0"), 422),
            ("GET /users/999999999", client.get("/users/999999999"), 404),
        ]

        for label, response, expected_status in error_checks:
            print(f"Testing {label}...")
            response_json = response.json()
            passed = (
                response.status_code == expected_status
                and _is_error_envelope(response_json)
            )
            checks[label] = passed
            _print_result(
                label,
                passed,
                "" if passed else _request_failed(response_json),
            )

    except Exception as exc:
        print("API tests failed.")
        print(f"Details: {exc}")
        checks["Unhandled exception"] = False
    finally:
        if user_id is not None:
            try:
                delete_user(user_id)
            except Exception as exc:
                print("Temporary API test user cleanup failed.")
                print(f"Details: {exc}")
                checks["Temporary user cleanup"] = False
            else:
                checks["Temporary user cleanup"] = True
                print("Temporary API test user deleted.")

    print()
    print("API endpoint test summary:")
    for label, passed in checks.items():
        _print_result(label, passed)

    all_passed = bool(checks) and all(checks.values())
    print()
    print(
        "API tests completed successfully."
        if all_passed
        else "API tests failed."
    )
    return 0 if all_passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
