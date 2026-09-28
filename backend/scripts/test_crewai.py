"""Smoke test for validating CrewAI agent execution with Gemini.

Run this script after setting GEMINI_API_KEY in the project root .env file:

    python -m backend.scripts.test_crewai
"""

from __future__ import annotations

import sys

from backend.utils.console import configure_utf8_output


configure_utf8_output(sys.stdout, sys.stderr)

from backend.agents.base_agent import create_base_agent
from backend.core.llm import GEMINI_FLASH_MODEL, get_gemini_llm


def main() -> None:
    """Create one simple CrewAI agent and print its Gemini-backed response."""

    try:
        llm = get_gemini_llm()
    except RuntimeError as exc:
        print("CrewAI Gemini configuration is incomplete.")
        print(f"Details: {exc}")
        return

    agent = create_base_agent(
        role="AI Concepts Explainer",
        goal="Explain foundational AI concepts clearly and concisely.",
        backstory=(
            "You are an experienced AI educator who explains technical topics "
            "in plain language without adding unnecessary detail."
        ),
        llm=llm,
    )

    try:
        result = agent.kickoff(
            "Explain what Artificial Intelligence is in exactly two complete sentences."
        )
    except Exception as exc:
        print("CrewAI Gemini smoke test failed.")
        print(f"Model: {GEMINI_FLASH_MODEL}")
        print(f"Details: {exc}")
        return

    print("CrewAI Gemini connection successful.")
    print(f"Model: {GEMINI_FLASH_MODEL}")
    print(f"Agent response: {result.raw}")


if __name__ == "__main__":
    main()
