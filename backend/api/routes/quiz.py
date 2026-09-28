"""Independent quiz generation and submission endpoints."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status
from fastapi.concurrency import run_in_threadpool

from backend.api.schemas.common import ErrorResponse, SuccessResponse
from backend.schemas.quiz import (
    QuizGenerationRequest,
    QuizGenerationResponse,
    QuizSubmissionRequest,
    QuizSubmissionResponse,
)
from backend.agents.base_agent import TransientLLMError
from backend.services.quiz_service import InvalidQuizResponseError, QuizService


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/quiz", tags=["quiz"])


@router.post(
    "/generate",
    response_model=SuccessResponse[QuizGenerationResponse],
    status_code=status.HTTP_200_OK,
    summary="Generate a quiz",
    description="Generate a validated multiple-choice quiz with Gemini.",
    responses={
        status.HTTP_502_BAD_GATEWAY: {
            "model": ErrorResponse,
            "description": "Gemini returned an invalid quiz response.",
        },
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "model": ErrorResponse,
            "description": "Gemini is unavailable or not configured.",
        },
    },
)
async def generate_quiz(
    request: QuizGenerationRequest,
) -> SuccessResponse[QuizGenerationResponse]:
    """Generate a quiz independently of the CrewAI workflow."""

    service = QuizService()
    try:
        quiz = await run_in_threadpool(service.generate_quiz, request)
    except TransientLLMError as exc:
        logger.warning("Gemini quiz generation is temporarily unavailable: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "message": "Gemini is temporarily unavailable.",
                "error_code": "gemini_unavailable",
            },
        ) from exc
    except InvalidQuizResponseError as exc:
        logger.warning("Quiz generation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "message": str(exc),
                "error_code": "quiz_generation_failed",
            },
        ) from exc
    except RuntimeError as exc:
        logger.warning("Gemini quiz generation is not configured: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "message": str(exc),
                "error_code": "gemini_not_configured",
            },
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected quiz generation failure.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Unable to generate quiz.",
                "error_code": "quiz_generation_error",
            },
        ) from exc

    return SuccessResponse(
        message="Quiz generated successfully.",
        data=quiz,
    )


@router.post(
    "/submit",
    response_model=SuccessResponse[QuizSubmissionResponse],
    status_code=status.HTTP_200_OK,
    summary="Submit a quiz",
    description="Score a generated quiz deterministically in backend code.",
)
async def submit_quiz(
    request: QuizSubmissionRequest,
) -> SuccessResponse[QuizSubmissionResponse]:
    """Score selected answers without calling Gemini or CrewAI."""

    result = await run_in_threadpool(QuizService().submit_quiz, request)
    return SuccessResponse(
        message="Quiz submitted successfully.",
        data=result,
    )
