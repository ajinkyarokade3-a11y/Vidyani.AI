"""Conversational AI Mentor backed by the project's shared Gemini client."""

from __future__ import annotations

from typing import Protocol

from backend.agents.base_agent import run_with_gemini_retry
from backend.core.llm import get_gemini_llm
from backend.schemas.mentor import MentorChatRequest, MentorChatResponse


SYSTEM_PROMPT = """You are Vidyani AI, a friendly AI mentor.

You help learners understand concepts rather than giving short answers.

Always:
- explain clearly
- adapt to beginners when needed
- use examples
- encourage learning
- answer in markdown
- avoid hallucinating facts
- recommend next steps when appropriate

If a learning goal exists, personalize the response.
If a current topic exists, prioritize explanations around that topic.
If conversation history exists, continue naturally.

Generate only the assistant response."""


class MentorServiceError(RuntimeError):
    """Raised when Gemini does not return a usable mentor response."""


class MentorLLM(Protocol):
    """Minimal shared LLM interface required by the Mentor service."""

    def call(self, messages: str) -> object:
        """Generate one mentor response."""


class MentorService:
    """Answer learner questions using shared Gemini infrastructure."""

    def __init__(self, llm: MentorLLM | None = None) -> None:
        self.llm = llm

    def chat(self, request: MentorChatRequest) -> MentorChatResponse:
        """Generate one contextual mentor response."""

        prompt = self._build_prompt(request)
        llm = self.llm or get_gemini_llm()
        response = run_with_gemini_retry(
            "AI Mentor",
            lambda: llm.call(prompt),
            prompt=prompt,
        )

        if not isinstance(response, str) or not response.strip():
            raise MentorServiceError(
                "Gemini returned an empty or invalid mentor response."
            )

        return MentorChatResponse(
            reply=response.strip(),
            suggested_followups=self._suggest_followups(request),
        )

    def _build_prompt(self, request: MentorChatRequest) -> str:
        """Build the mentor prompt from learning and conversation context."""

        history = "\n\n".join(
            (
                f"{'User' if message.role == 'user' else 'Assistant'}:\n"
                f"{message.content}"
            )
            for message in request.conversation_history
        )
        return f"""{SYSTEM_PROMPT}

Learning Goal:
{request.learning_goal or "Not provided"}

Current Topic:
{request.current_topic or "Not provided"}

Conversation History:
{history or "No previous conversation"}

Latest Question:
{request.message}
"""

    def _suggest_followups(self, request: MentorChatRequest) -> list[str]:
        """Return concise context-aware continuations without another LLM call."""

        topic = request.current_topic or "this concept"
        return [
            f"Explain {topic} with an analogy.",
            f"Give me a practical example of {topic}.",
            f"Test my understanding of {topic}.",
        ]
