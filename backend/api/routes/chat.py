"""Temporary chat endpoint for validating FastAPI to CrewAI communication."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status
from fastapi.concurrency import run_in_threadpool

from backend.api.schemas.common import ErrorResponse, SuccessResponse
from backend.schemas.chat import ChatRequest, ChatResponse
from backend.services.chat_service import ChatServiceError, generate_chat_response


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


@router.post(
    "",
    response_model=SuccessResponse[ChatResponse],
    status_code=status.HTTP_200_OK,
    summary="Temporary chat",
    description="Send a prompt to the temporary CrewAI Gemini chat validation agent.",
    responses={
        status.HTTP_200_OK: {"description": "Chat response generated successfully."},
        status.HTTP_502_BAD_GATEWAY: {
            "model": ErrorResponse,
            "description": "Gemini or CrewAI failed to generate a response.",
        },
    },
)
async def chat(request: ChatRequest) -> SuccessResponse[ChatResponse]:
    """Send a user prompt to the temporary CrewAI Gemini agent."""

    try:
        response = await run_in_threadpool(generate_chat_response, request)
    except ChatServiceError as exc:
        logger.exception("Temporary chat endpoint failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"message": str(exc), "error_code": "chat_generation_failed"},
        ) from exc

    return SuccessResponse(
        message="Chat response generated successfully.",
        data=response,
    )
