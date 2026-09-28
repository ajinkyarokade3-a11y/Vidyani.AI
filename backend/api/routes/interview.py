"""Mock interview session endpoints."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status
from fastapi.concurrency import run_in_threadpool

from backend.api.schemas.common import ErrorResponse, SuccessResponse
from backend.schemas.interview import (
    InterviewAnswerRequest,
    InterviewAnswerResponse,
    InterviewEndRequest,
    InterviewEndResponse,
    InterviewStartRequest,
    InterviewStartResponse,
)
from backend.services.interview_service import InterviewService
from backend.services.interview_session_manager import (
    InterviewCompletedError,
    InterviewNotFoundError,
    InvalidInterviewStateError,
)


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/interview", tags=["interview"])
_INTERVIEW_SERVICE = InterviewService()


@router.post(
    "/start",
    response_model=SuccessResponse[InterviewStartResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Start a mock interview",
    description="Create an in-memory mock interview and return its first question.",
    responses={
        status.HTTP_201_CREATED: {
            "description": "Mock interview started successfully."
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ErrorResponse},
    },
)
async def start_interview(
    request: InterviewStartRequest,
) -> SuccessResponse[InterviewStartResponse]:
    """Create an in-memory mock interview."""

    try:
        response = await run_in_threadpool(
            _INTERVIEW_SERVICE.start_interview,
            request,
        )
    except Exception as exc:
        logger.exception("Unexpected interview start failure.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Unable to start mock interview.",
                "error_code": "interview_start_failed",
            },
        ) from exc

    return SuccessResponse(
        message="Mock interview started successfully.",
        data=response,
    )


@router.post(
    "/answer",
    response_model=SuccessResponse[InterviewAnswerResponse],
    status_code=status.HTTP_200_OK,
    summary="Submit an interview answer",
    description="Store the current answer and advance the in-memory interview.",
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse},
        status.HTTP_409_CONFLICT: {"model": ErrorResponse},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ErrorResponse},
    },
)
async def submit_interview_answer(
    request: InterviewAnswerRequest,
) -> SuccessResponse[InterviewAnswerResponse]:
    """Record one candidate answer."""

    try:
        response = await run_in_threadpool(
            _INTERVIEW_SERVICE.submit_answer,
            request,
        )
    except InterviewNotFoundError as exc:
        raise _interview_error(
            status.HTTP_404_NOT_FOUND,
            str(exc),
            "interview_not_found",
        ) from exc
    except InterviewCompletedError as exc:
        raise _interview_error(
            status.HTTP_409_CONFLICT,
            str(exc),
            "interview_completed",
        ) from exc
    except InvalidInterviewStateError as exc:
        raise _interview_error(
            status.HTTP_409_CONFLICT,
            str(exc),
            "invalid_interview_state",
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected interview answer failure.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Unable to submit interview answer.",
                "error_code": "interview_answer_failed",
            },
        ) from exc

    return SuccessResponse(
        message="Interview answer recorded successfully.",
        data=response,
    )


@router.post(
    "/end",
    response_model=SuccessResponse[InterviewEndResponse],
    status_code=status.HTTP_200_OK,
    summary="End a mock interview",
    description="Return a mock summary and delete the in-memory session.",
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ErrorResponse},
    },
)
async def end_interview(
    request: InterviewEndRequest,
) -> SuccessResponse[InterviewEndResponse]:
    """Summarize and delete one mock interview."""

    try:
        response = await run_in_threadpool(
            _INTERVIEW_SERVICE.end_interview,
            request,
        )
    except InterviewNotFoundError as exc:
        raise _interview_error(
            status.HTTP_404_NOT_FOUND,
            str(exc),
            "interview_not_found",
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected interview end failure.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Unable to end mock interview.",
                "error_code": "interview_end_failed",
            },
        ) from exc

    return SuccessResponse(
        message="Mock interview ended successfully.",
        data=response,
    )


def _interview_error(
    status_code: int,
    message: str,
    error_code: str,
) -> HTTPException:
    """Build and log a project-standard interview HTTP error."""

    logger.warning("%s: %s", error_code, message)
    return HTTPException(
        status_code=status_code,
        detail={"message": message, "error_code": error_code},
    )
