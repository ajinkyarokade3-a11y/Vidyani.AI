"""Planner Agent for creating structured learning roadmaps.

The Planner Agent consumes a complete LearnerIntent object and returns a
structured roadmap. It does not track progress, store memory, call external
resource APIs, or orchestrate multiple agents.
"""

from __future__ import annotations

from crewai import Agent

from backend.agents.base_agent import create_base_agent, run_with_gemini_retry
from backend.core.config import get_settings
from backend.schemas.intent import (
    LearnerIntent,
    missing_required_intent_fields,
    reconcile_intent_completeness,
)
from backend.schemas.planner import LearningPhase, LearningPlan


PLANNER_PROMPT = """Create a personalized learning roadmap from this structured learner intent.

Learner intent:
{learner_intent}

Planning rules:
- Use only the structured intent provided above.
- Create a realistic sequence of learning phases/modules.
- Adapt depth and pacing to the current skill level, available time, and target deadline.
- Include recommended topics in the order they should be learned.
- Include estimated duration for each phase.
- Include milestones/checkpoints that can be used later for progress tracking.
- Suggest learning resource categories only, such as videos, documentation, tutorials, practice exercises, projects, quizzes, or official guides.
- Do not recommend specific URLs, brands, creators, courses, or paid products.
- Do not add memory, calendar scheduling, database actions, or external API usage.
- Return the result in the required structured schema.
"""


class PlannerValidationError(ValueError):
    """Raised when learner intent is incomplete and planning should not run."""


def create_planner_agent() -> Agent:
    """Create the CrewAI agent that generates learning roadmaps."""

    return create_base_agent(
        role="Personalized Learning Roadmap Planner",
        goal=(
            "Convert complete learner intent into a practical, sequenced, "
            "structured learning roadmap with milestones and resource categories."
        ),
        backstory=(
            "You are an expert curriculum designer who creates realistic "
            "learning paths for individual learners. You balance ambition with "
            "available study time, current skill level, and deadlines."
        ),
        max_iter=4,
        max_retry_limit=0,
    )


def _validate_complete_intent(intent: LearnerIntent) -> None:
    """Validate that the Planner has enough learner information to proceed."""

    missing_fields = missing_required_intent_fields(intent)
    if missing_fields:
        raise PlannerValidationError(
            "Cannot generate a learning roadmap until learner intent is complete. "
            f"Missing information: {', '.join(missing_fields)}."
        )


def _generate_mock_learning_plan(intent: LearnerIntent) -> LearningPlan:
    """Return a realistic schema-valid roadmap without calling Gemini."""

    return LearningPlan(
        learning_goal=intent.learning_goal or "Complete the learning goal",
        subject=intent.subject or "Selected subject",
        learner_level=intent.current_skill_level or "Current skill level not provided",
        total_available_time=intent.available_time or "Available time not provided",
        target_deadline=intent.target_deadline or "Target deadline not provided",
        preferred_learning_style=intent.preferred_learning_style,
        overview=(
            f"Mock Mode roadmap title: {intent.subject} Learning Roadmap. "
            f"Total duration: {intent.target_deadline}. This practical phased "
            "plan is designed for continued application development without "
            "consuming Gemini API quota."
        ),
        phases=[
            LearningPhase(
                phase_number=1,
                title="Foundations and Environment Setup",
                objective=(
                    "Build confidence with the core concepts, terminology, "
                    "and tooling needed for the subject."
                ),
                recommended_topics=[
                    "Core concepts and vocabulary",
                    "Development or study environment setup",
                    "Basic syntax, patterns, or workflows",
                ],
                estimated_duration="2 weeks",
                milestones=[
                    "Set up the required learning environment",
                    "Complete a short fundamentals checklist",
                ],
                suggested_resource_categories=[
                    "Documentation",
                    "Beginner videos",
                    "Guided tutorials",
                ],
            ),
            LearningPhase(
                phase_number=2,
                title="Core Skills and Practice",
                objective=(
                    "Develop the essential practical skills needed to solve "
                    "common problems independently."
                ),
                recommended_topics=[
                    "Essential workflows",
                    "Common problem patterns",
                    "Debugging and troubleshooting basics",
                ],
                estimated_duration="3 weeks",
                milestones=[
                    "Finish a set of focused practice exercises",
                    "Explain key concepts without notes",
                ],
                suggested_resource_categories=[
                    "Practice exercises",
                    "Reference documentation",
                    "Short quizzes",
                ],
            ),
            LearningPhase(
                phase_number=3,
                title="Applied Project Work",
                objective=(
                    "Apply the learned concepts in realistic project scenarios "
                    "and connect separate skills together."
                ),
                recommended_topics=[
                    "Project planning",
                    "Building small end-to-end examples",
                    "Testing and improving the solution",
                ],
                estimated_duration="4 weeks",
                milestones=[
                    "Complete one small portfolio-style project",
                    "Document what was built and what was learned",
                ],
                suggested_resource_categories=[
                    "Projects",
                    "Code examples",
                    "Peer review or self-review checklists",
                ],
            ),
            LearningPhase(
                phase_number=4,
                title="Review and Readiness Check",
                objective=(
                    "Identify weak spots, revise important topics, and prepare "
                    "for the learner's stated deadline."
                ),
                recommended_topics=[
                    "Targeted review",
                    "Mock assessments or walkthroughs",
                    "Final project polish",
                ],
                estimated_duration="3 weeks",
                milestones=[
                    "Complete a final review checklist",
                    "Demonstrate the final project or pass a mock assessment",
                ],
                suggested_resource_categories=[
                    "Quizzes",
                    "Projects",
                    "Official guides",
                ],
            ),
        ],
        final_milestone=(
            "Complete a capstone-style demonstration that shows readiness for "
            f"{intent.learning_goal}."
        ),
    )


def generate_learning_plan(
    intent: LearnerIntent,
    agent: Agent | None = None,
) -> LearningPlan:
    """Generate a structured roadmap from a complete LearnerIntent object."""

    intent = reconcile_intent_completeness(intent)
    _validate_complete_intent(intent)
    if get_settings().mock_mode:
        return _generate_mock_learning_plan(intent)

    planner_agent = agent or create_planner_agent()
    prompt = PLANNER_PROMPT.format(
        learner_intent=intent.model_dump_json(indent=2),
    )
    result = run_with_gemini_retry(
        "Planner Agent",
        lambda: planner_agent.kickoff(
            prompt,
            response_format=LearningPlan,
        ),
        prompt=prompt,
    )
    if result.pydantic is None:
        raise ValueError("Planner Agent did not return structured output.")

    return result.pydantic
