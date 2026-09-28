"""Reusable CrewAI agent container for the learning workflow.

LearningCrew owns the agent instances used by the orchestrator. The manager
coordinates the workflow, while this class keeps agent construction and reuse in
one place.
"""

from __future__ import annotations

from functools import cached_property

from crewai import Agent

from backend.agents.feedback_agent import (
    create_feedback_agent,
    generate_feedback_report,
)
from backend.agents.intent_agent import analyze_learner_intent, create_intent_agent
from backend.agents.nudge_agent import create_nudge_agent, generate_nudge_report
from backend.agents.planner_agent import create_planner_agent, generate_learning_plan
from backend.agents.progress_agent import (
    create_progress_agent,
    generate_progress_report,
)
from backend.core.config import get_settings
from backend.schemas.feedback import FeedbackReport
from backend.schemas.intent import LearnerIntent
from backend.schemas.nudge import NudgeReport
from backend.schemas.planner import LearningPlan
from backend.schemas.progress import LearnerProgress, ProgressReport


class LearningCrew:
    """Thin reusable interface around the five learning agents."""

    @property
    def _mock_mode(self) -> bool:
        """Return whether the workflow should use agent mock implementations."""

        return get_settings().mock_mode

    @cached_property
    def intent_agent(self) -> Agent | None:
        """Return the reusable Intent Agent instance for real-mode execution."""

        return None if self._mock_mode else create_intent_agent()

    @cached_property
    def planner_agent(self) -> Agent | None:
        """Return the reusable Planner Agent instance for real-mode execution."""

        return None if self._mock_mode else create_planner_agent()

    @cached_property
    def progress_agent(self) -> Agent | None:
        """Return the reusable Progress Agent instance for real-mode execution."""

        return None if self._mock_mode else create_progress_agent()

    @cached_property
    def feedback_agent(self) -> Agent | None:
        """Return the reusable Feedback Agent instance for real-mode execution."""

        return None if self._mock_mode else create_feedback_agent()

    @cached_property
    def nudge_agent(self) -> Agent | None:
        """Return the reusable Nudge Agent instance for real-mode execution."""

        return None if self._mock_mode else create_nudge_agent()

    def run_intent(self, user_request: str) -> LearnerIntent:
        """Run the Intent Agent against the user's learning request."""

        return analyze_learner_intent(user_request, agent=self.intent_agent)

    def run_planner(self, intent: LearnerIntent) -> LearningPlan:
        """Run the Planner Agent against structured learner intent."""

        return generate_learning_plan(intent, agent=self.planner_agent)

    def run_progress(
        self,
        plan: LearningPlan,
        progress: LearnerProgress,
    ) -> ProgressReport:
        """Run the Progress Agent against a plan and progress snapshot."""

        return generate_progress_report(plan, progress, agent=self.progress_agent)

    def run_feedback(
        self,
        plan: LearningPlan,
        progress_report: ProgressReport,
    ) -> FeedbackReport:
        """Run the Feedback Agent against a plan and progress report."""

        return generate_feedback_report(
            plan,
            progress_report,
            agent=self.feedback_agent,
        )

    def run_nudge(
        self,
        plan: LearningPlan,
        progress_report: ProgressReport,
        feedback_report: FeedbackReport,
    ) -> NudgeReport:
        """Run the Nudge Agent against plan, progress, and feedback data."""

        return generate_nudge_report(
            plan,
            progress_report,
            feedback_report,
            agent=self.nudge_agent,
        )
