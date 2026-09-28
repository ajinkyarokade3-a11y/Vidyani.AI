"""Deterministic smoke test for the AI Mentor service."""

from __future__ import annotations

from backend.schemas.mentor import MentorChatRequest, MentorMessage
from backend.services.mentor_service import MentorService


class _FakeGeminiLLM:
    def call(self, messages: str) -> object:
        assert "Become a Data Scientist" in messages
        assert "Python Dictionaries" in messages
        assert "What is a dictionary?" in messages
        return (
            "A Python dictionary stores data as **key-value pairs**.\n\n"
            "```python\nstudent = {\"name\": \"Asha\", \"score\": 92}\n"
            "print(student[\"name\"])\n```\n\n"
            "Use dictionaries when you want to retrieve values by meaningful keys."
        )


def main() -> int:
    """Run the Mentor service without making a network request."""

    request = MentorChatRequest(
        learning_goal="Become a Data Scientist",
        current_topic="Python Dictionaries",
        message="Explain Python dictionaries with an example.",
        conversation_history=[
            MentorMessage(role="user", content="What is a dictionary?"),
            MentorMessage(
                role="assistant",
                content="A dictionary stores key-value pairs.",
            ),
        ],
    )
    response = MentorService(llm=_FakeGeminiLLM()).chat(request)

    print("Reply:")
    print(response.reply)
    print("\nSuggested follow-ups:")
    for followup in response.suggested_followups:
        print(f"- {followup}")

    passed = bool(response.reply) and len(response.suggested_followups) == 3
    print(f"\nMentor service test: {'PASS' if passed else 'FAIL'}")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
