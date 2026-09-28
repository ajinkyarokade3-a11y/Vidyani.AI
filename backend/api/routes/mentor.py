"""Conversational AI Mentor endpoint."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status
from fastapi.concurrency import run_in_threadpool

from backend.agents.base_agent import TransientLLMError
from backend.api.schemas.common import ErrorResponse, SuccessResponse
from backend.schemas.mentor import MentorChatRequest, MentorChatResponse
from backend.services.mentor_service import MentorService, MentorServiceError


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/mentor", tags=["mentor"])


@router.post(
    "/chat",
    response_model=SuccessResponse[MentorChatResponse],
    status_code=status.HTTP_200_OK,
    summary="Chat with the AI Mentor",
    description=(
        "Answer a learner question with optional learning context and recent "
        "frontend-provided conversation history."
    ),
    responses={
        status.HTTP_502_BAD_GATEWAY: {
            "model": ErrorResponse,
            "description": "Gemini returned an invalid mentor response.",
        },
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "model": ErrorResponse,
            "description": "Gemini is unavailable or not configured.",
        },
    },
)
async def mentor_chat(
    request: MentorChatRequest,
) -> SuccessResponse[MentorChatResponse]:
    """Return one contextual AI Mentor response."""

    service = MentorService()
    try:
        response = await run_in_threadpool(service.chat, request)
    except TransientLLMError as exc:
        logger.warning("AI Mentor is temporarily unavailable: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "message": "The AI Mentor is temporarily unavailable.",
                "error_code": "gemini_unavailable",
            },
        ) from exc
    except MentorServiceError as exc:
        logger.warning("AI Mentor returned an invalid response: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "message": str(exc),
                "error_code": "mentor_response_invalid",
            },
        ) from exc
    except RuntimeError as exc:
        logger.warning("AI Mentor is not configured: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "message": str(exc),
                "error_code": "gemini_not_configured",
            },
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected AI Mentor failure.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Unable to generate an AI Mentor response.",
                "error_code": "mentor_generation_error",
            },
        ) from exc

    return SuccessResponse(
        message="AI Mentor response generated successfully.",
        data=response,
    )
