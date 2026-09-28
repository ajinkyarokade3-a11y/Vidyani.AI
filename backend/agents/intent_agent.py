"""Intent Agent for structuring learner requests.

The Intent Agent is responsible only for understanding what the learner wants.
It does not create plans, store memory, call databases, or orchestrate crews.
"""

from __future__ import annotations

from crewai import Agent

from backend.agents.base_agent import create_base_agent, run_with_gemini_retry
from backend.core.config import get_settings
from backend.schemas.intent import LearnerIntent, reconcile_intent_completeness


INTENT_EXTRACTION_PROMPT = """Analyze the learner request below.

Extract the user's learning intent into the required structured schema.

Workflow-required fields:
- learning_goal
- current_skill_level
- available_time
- target_deadline

Rules:
- Do not invent missing information.
- Use null for fields that are not explicitly stated or clearly implied.
- Extract subject from the stated topic, skill, domain, or career goal. A goal
  such as "become a data scientist" clearly implies Data Science as the subject.
- Treat statements such as "I am a beginner" as current_skill_level.
- Treat durations such as "in 3 months" as target_deadline.
- Treat schedules such as "3 hours every day" as available_time.
- Subject supports planning but is not a separate completeness requirement when
  the learning goal already identifies the domain.
- Set is_complete to true when all four workflow-required fields are present.
- Only set is_complete to false when a workflow-required field is missing.
- For each missing workflow-required field, add a short clear follow-up question.
- Only include preferred_learning_style when the learner mentions or strongly implies it.
- Keep follow-up questions practical and learner-friendly.

Learner request:
{user_request}
"""


def create_intent_agent() -> Agent:
    """Create the CrewAI agent that extracts structured learner intent."""

    return create_base_agent(
        role="Learner Intent Analyst",
        goal=(
            "Extract accurate structured learning intent from user requests "
            "and ask clarifying questions when essential details are missing."
        ),
        backstory=(
            "You are an expert learning intake specialist. You carefully "
            "identify what a learner wants to achieve, what they already know, "
            "how much time they have, and when they need results. You never "
            "guess missing details."
        ),
        max_iter=3,
        max_retry_limit=0,
    )


def _generate_mock_learner_intent(user_request: str) -> LearnerIntent:
    """Return deterministic learner intent without calling Gemini."""

    normalized_request = user_request.lower()
    if "i want to learn ai" in normalized_request:
        return LearnerIntent(
            learning_goal="Learn AI",
            subject="AI",
            current_skill_level=None,
            available_time=None,
            target_deadline=None,
            preferred_learning_style=None,
            is_complete=False,
            missing_information=[
                "current_skill_level",
                "available_time",
                "target_deadline",
            ],
            follow_up_questions=[
                "What is your current skill level with AI or related topics?",
                "How much time can you study each day or week?",
                "Do you have a target deadline for learning AI?",
            ],
        )

    return LearnerIntent(
        learning_goal="Learn Python from scratch",
        subject="Python",
        current_skill_level="Beginner",
        available_time="2 hours daily",
        target_deadline="3 months",
        preferred_learning_style=None,
        is_complete=True,
        missing_information=[],
        follow_up_questions=[],
    )


def analyze_learner_intent(
    user_request: str,
    agent: Agent | None = None,
) -> LearnerIntent:
    """Analyze a learner request and return structured intent data."""

    if not user_request.strip():
        raise ValueError("Learner request cannot be empty.")

    if get_settings().mock_mode:
        return reconcile_intent_completeness(
            _generate_mock_learner_intent(user_request)
        )

    intent_agent = agent or create_intent_agent()
    prompt = INTENT_EXTRACTION_PROMPT.format(user_request=user_request)
    result = run_with_gemini_retry(
        "Intent Agent",
        lambda: intent_agent.kickoff(
            prompt,
            response_format=LearnerIntent,
        ),
        prompt=prompt,
    )
    if result.pydantic is None:
        raise ValueError("Intent Agent did not return structured output.")

    return reconcile_intent_completeness(result.pydantic)
