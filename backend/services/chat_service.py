"""Temporary CrewAI-backed chat service.

This module exists only to validate end-to-end communication from FastAPI to
CrewAI and Gemini. It is intentionally not an Intent Agent, Planner Agent,
memory system, or orchestration layer.
"""

from __future__ import annotations

from backend.agents.base_agent import create_base_agent
from backend.core.llm import GEMINI_FLASH_MODEL, get_gemini_llm
from backend.schemas.chat import ChatRequest, ChatResponse


class ChatServiceError(RuntimeError):
    """Raised when the temporary CrewAI chat call fails."""


def generate_chat_response(request: ChatRequest) -> ChatResponse:
    """Generate a response using one temporary CrewAI agent."""

    try:
        agent = create_base_agent(
            role="Temporary Learning Assistant",
            goal="Answer user learning questions clearly and concisely.",
            backstory=(
                "You are a temporary validation assistant for the "
                "AI-Learning-Agent backend. You provide clear, direct answers "
                "without invoking tools, memory, or workflows."
            ),
            llm=get_gemini_llm(),
            max_iter=3,
        )
        result = agent.kickoff(request.prompt)
    except Exception as exc:
        raise ChatServiceError("Failed to generate response from Gemini.") from exc

    return ChatResponse(response=result.raw, model=GEMINI_FLASH_MODEL)
