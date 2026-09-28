"""Learning workflow and persisted learner data endpoints."""

from __future__ import annotations

import logging
import re
import time
from collections.abc import Callable
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Path, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, ConfigDict, Field, field_validator

from backend.agents.base_agent import TransientLLMError
from backend.api.schemas.common import ErrorResponse, SuccessResponse
from backend.database.crud import PersistenceError
from backend.schemas.learning_session import LearningSessionResponse
from backend.services.learning_session_service import run_learning_session
from backend.services.persistence_service import PersistenceService


logger = logging.getLogger(__name__)
router = APIRouter(tags=["learning"])
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class LearningSessionRequest(BaseModel):
    """Request payload for starting a learning session."""

    user_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Name of the learner starting the session.",
        examples=["Rishabh"],
    )
    email: str | None = Field(
        default=None,
        max_length=255,
        description="Optional learner email used to retrieve an existing user.",
        examples=["optional@example.com"],
    )
    prompt: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="Natural language learning request from the user.",
        examples=["I want to become a Data Scientist in six months."],
    )

    @field_validator("user_name", "prompt")
    @classmethod
    def _validate_non_empty_text(cls, value: str) -> str:
        """Reject whitespace-only text fields."""

        stripped_value = value.strip()
        if not stripped_value:
            raise ValueError("Value cannot be empty.")
        return stripped_value

    @field_validator("email")
    @classmethod
    def _validate_email(cls, value: str | None) -> str | None:
        """Validate optional email format without adding extra dependencies."""

        if value is None:
            return None

        stripped_value = value.strip()
        if not stripped_value:
            return None
        if not EMAIL_PATTERN.match(stripped_value):
            raise ValueError("Email must be a valid email address.")
        return stripped_value


class UserResponse(BaseModel):
    """Stored user response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str | None
    created_at: datetime


class LearnerIntentResponse(BaseModel):
    """Stored learner intent response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    learning_goal: str
    subject: str
    current_skill_level: str
    available_time: str
    target_deadline: str
    preferred_learning_style: str | None
    created_at: datetime


class LearningPlanResponse(BaseModel):
    """Stored learning plan response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    plan_json: dict[str, Any]
    created_at: datetime


class ProgressResponse(BaseModel):
    """Stored progress response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    topic: str
    completion_percentage: float
    completed: bool
    updated_at: datetime


class FeedbackHistoryResponse(BaseModel):
    """Stored feedback history response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    feedback: str
    strengths: list[str]
    improvements: list[str]
    created_at: datetime


class NudgeHistoryResponse(BaseModel):
    """Stored nudge history response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    message: str
    urgency: str
    created_at: datetime


def get_persistence_service() -> PersistenceService:
    """Return the persistence service dependency for API handlers."""

    return PersistenceService()


ERROR_RESPONSES = {
    status.HTTP_400_BAD_REQUEST: {
        "model": ErrorResponse,
        "description": "The request payload or parameters are invalid.",
    },
    status.HTTP_404_NOT_FOUND: {
        "model": ErrorResponse,
        "description": "The requested resource was not found.",
    },
    status.HTTP_500_INTERNAL_SERVER_ERROR: {
        "model": ErrorResponse,
        "description": "An unexpected server or persistence error occurred.",
    },
    status.HTTP_503_SERVICE_UNAVAILABLE: {
        "model": ErrorResponse,
        "description": "The Gemini service is temporarily unavailable.",
    },
}


@router.post(
    "/learning/session",
    response_model=SuccessResponse[LearningSessionResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Start a learning session",
    description=(
        "Run the existing CrewAI learning workflow through the service layer, "
        "persist completed outputs, and return the workflow response."
    ),
    responses={
        status.HTTP_201_CREATED: {
            "description": "Learning session completed or stopped for follow-up.",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "message": "Learning session completed successfully.",
                        "data": {
                            "workflow_completed": True,
                            "current_stage": "completed",
                            "learner_intent": {},
                            "learning_plan": {},
                            "progress_report": {},
                            "feedback_report": {},
                            "nudge_report": {},
                            "error_message": None,
                        },
                    }
                }
            },
        },
        **ERROR_RESPONSES,
    },
)
async def start_learning_session(
    request: LearningSessionRequest,
) -> SuccessResponse[LearningSessionResponse]:
    """Start a learning session through the existing service layer."""

    logger.info("Received learning session request for user_name=%s", request.user_name)
    start_time = time.perf_counter()
    try:
        logger.info("Workflow started for user_name=%s", request.user_name)
        response = await run_in_threadpool(
            run_learning_session,
            request.prompt,
            user_name=request.user_name,
            user_email=request.email,
        )
    except TransientLLMError as exc:
        logger.warning("Learning session failed because Gemini is unavailable: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "message": (
                    "The AI service is temporarily unavailable. "
                    "Please try again shortly."
                ),
                "error_code": "LLM_UNAVAILABLE",
            },
        ) from exc
    except ValueError as exc:
        logger.exception("Learning session request validation failed.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": str(exc), "error_code": "bad_request"},
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected learning session API failure.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Failed to start learning session.",
                "error_code": "workflow_failed",
            },
        ) from exc

    duration_seconds = time.perf_counter() - start_time
    logger.info(
        "Workflow completed with workflow_completed=%s duration=%.2fs",
        response.workflow_completed,
        duration_seconds,
    )
    return SuccessResponse(
        message=(
            "Learning session completed successfully."
            if response.workflow_completed
            else "Learning session requires follow-up information."
        ),
        data=response,
    )


@router.get(
    "/users/{user_id}",
    response_model=SuccessResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Get user",
    description="Retrieve one stored user by id.",
    responses={
        status.HTTP_200_OK: {"description": "User retrieved successfully."},
        **ERROR_RESPONSES,
    },
)
async def get_user(
    user_id: int = Path(..., gt=0, description="Positive user id."),
    service: PersistenceService = Depends(get_persistence_service),
) -> SuccessResponse[UserResponse]:
    """Return one stored user."""

    logger.info("Received get user request for user_id=%s", user_id)
    user = await _run_persistence("get user", lambda: service.get_user(user_id=user_id))
    if user is None:
        raise _not_found("User not found.")
    return SuccessResponse(message="User retrieved successfully.", data=user)


@router.get(
    "/users/{user_id}/intent",
    response_model=SuccessResponse[LearnerIntentResponse],
    status_code=status.HTTP_200_OK,
    summary="Get latest learner intent",
    description="Retrieve the latest learner intent stored for a user.",
    responses={
        status.HTTP_200_OK: {
            "description": "Latest learner intent retrieved successfully."
        },
        **ERROR_RESPONSES,
    },
)
async def get_latest_intent(
    user_id: int = Path(..., gt=0, description="Positive user id."),
    service: PersistenceService = Depends(get_persistence_service),
) -> SuccessResponse[LearnerIntentResponse]:
    """Return the latest learner intent for a user."""

    logger.info("Received latest intent request for user_id=%s", user_id)
    intent = await _run_persistence(
        "get latest learner intent",
        lambda: service.get_latest_intent(user_id),
    )
    if intent is None:
        raise _not_found("Learner intent not found.")
    return SuccessResponse(
        message="Latest learner intent retrieved successfully.",
        data=intent,
    )


@router.get(
    "/users/{user_id}/plan",
    response_model=SuccessResponse[LearningPlanResponse],
    status_code=status.HTTP_200_OK,
    summary="Get latest learning plan",
    description="Retrieve the latest learning plan stored for a user.",
    responses={
        status.HTTP_200_OK: {
            "description": "Latest learning plan retrieved successfully."
        },
        **ERROR_RESPONSES,
    },
)
async def get_latest_learning_plan(
    user_id: int = Path(..., gt=0, description="Positive user id."),
    service: PersistenceService = Depends(get_persistence_service),
) -> SuccessResponse[LearningPlanResponse]:
    """Return the latest learning plan for a user."""

    logger.info("Received latest learning plan request for user_id=%s", user_id)
    plan = await _run_persistence(
        "get latest learning plan",
        lambda: service.get_latest_learning_plan(user_id),
    )
    if plan is None:
        raise _not_found("Learning plan not found.")
    return SuccessResponse(
        message="Latest learning plan retrieved successfully.",
        data=plan,
    )


@router.get(
    "/users/{user_id}/progress",
    response_model=SuccessResponse[list[ProgressResponse]],
    status_code=status.HTTP_200_OK,
    summary="Get progress records",
    description="Retrieve all progress records stored for a user.",
    responses={
        status.HTTP_200_OK: {"description": "Progress records retrieved successfully."},
        **ERROR_RESPONSES,
    },
)
async def get_progress_records(
    user_id: int = Path(..., gt=0, description="Positive user id."),
    service: PersistenceService = Depends(get_persistence_service),
) -> SuccessResponse[list[ProgressResponse]]:
    """Return all progress records for a user."""

    logger.info("Received progress history request for user_id=%s", user_id)
    progress_records = await _run_persistence(
        "get progress records",
        lambda: service.list_progress(user_id),
    )
    return SuccessResponse(
        message="Progress records retrieved successfully.",
        data=list(progress_records),
    )


@router.get(
    "/users/{user_id}/feedback",
    response_model=SuccessResponse[list[FeedbackHistoryResponse]],
    status_code=status.HTTP_200_OK,
    summary="Get feedback history",
    description="Retrieve feedback history stored for a user.",
    responses={
        status.HTTP_200_OK: {"description": "Feedback history retrieved successfully."},
        **ERROR_RESPONSES,
    },
)
async def get_feedback_history(
    user_id: int = Path(..., gt=0, description="Positive user id."),
    service: PersistenceService = Depends(get_persistence_service),
) -> SuccessResponse[list[FeedbackHistoryResponse]]:
    """Return feedback history for a user."""

    logger.info("Received feedback history request for user_id=%s", user_id)
    feedback_history = await _run_persistence(
        "get feedback history",
        lambda: service.get_feedback_history(user_id),
    )
    return SuccessResponse(
        message="Feedback history retrieved successfully.",
        data=list(feedback_history),
    )


@router.get(
    "/users/{user_id}/nudges",
    response_model=SuccessResponse[list[NudgeHistoryResponse]],
    status_code=status.HTTP_200_OK,
    summary="Get nudge history",
    description="Retrieve nudge history stored for a user.",
    responses={
        status.HTTP_200_OK: {"description": "Nudge history retrieved successfully."},
        **ERROR_RESPONSES,
    },
)
async def get_nudge_history(
    user_id: int = Path(..., gt=0, description="Positive user id."),
    service: PersistenceService = Depends(get_persistence_service),
) -> SuccessResponse[list[NudgeHistoryResponse]]:
    """Return nudge history for a user."""

    logger.info("Received nudge history request for user_id=%s", user_id)
    nudge_history = await _run_persistence(
        "get nudge history",
        lambda: service.get_nudge_history(user_id),
    )
    return SuccessResponse(
        message="Nudge history retrieved successfully.",
        data=list(nudge_history),
    )


async def _run_persistence(operation: str, call: Callable[[], object]) -> object:
    """Run a blocking persistence operation and convert errors to HTTP responses."""

    try:
        return await run_in_threadpool(call)
    except PersistenceError as exc:
        logger.exception("Persistence failure during %s.", operation)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": f"Persistence failure during {operation}.",
                "error_code": "persistence_error",
            },
        ) from exc
    except ValueError as exc:
        logger.exception("Bad request during %s.", operation)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": str(exc), "error_code": "bad_request"},
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected failure during %s.", operation)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": f"Unexpected failure during {operation}.",
                "error_code": "unexpected_error",
            },
        ) from exc


def _not_found(message: str) -> HTTPException:
    """Return a consistent 404 HTTP exception."""

    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"message": message, "error_code": "not_found"},
    )
