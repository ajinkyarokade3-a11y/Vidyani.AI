"""Coordinator for the full AI learning workflow."""

from __future__ import annotations

import logging
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from pydantic import BaseModel

from backend.agents.base_agent import TransientLLMError
from backend.agents.feedback_agent import FeedbackValidationError
from backend.agents.nudge_agent import NudgeValidationError
from backend.agents.planner_agent import PlannerValidationError
from backend.agents.progress_agent import ProgressValidationError
from backend.crew.learning_crew import LearningCrew
from backend.schemas.feedback import FeedbackReport
from backend.schemas.intent import (
    LearnerIntent,
    missing_required_intent_fields,
    reconcile_intent_completeness,
)
from backend.schemas.learning_session import LearningSessionResponse
from backend.schemas.nudge import NudgeReport
from backend.schemas.planner import LearningPlan
from backend.schemas.progress import LearnerProgress, ProgressReport
from backend.services.planner_scheduling_service import (
    schedule_learning_plan,
    validate_planning_feasibility,
)


if TYPE_CHECKING:
    from backend.services.persistence_service import PersistenceService


logger = logging.getLogger(__name__)


@dataclass
class WorkflowState:
    """Mutable state collected while a learning workflow executes."""

    learner_intent: LearnerIntent | None = None
    learning_plan: LearningPlan | None = None
    progress_report: ProgressReport | None = None
    feedback_report: FeedbackReport | None = None
    nudge_report: NudgeReport | None = None
    current_stage: str = "not_started"
    errors: list[str] = field(default_factory=list)


class CrewManager:
    """Coordinate sequential execution of the learning agents."""

    def __init__(
        self,
        learning_crew: LearningCrew | None = None,
        persistence_service: "PersistenceService | None" = None,
    ) -> None:
        """Initialize the manager with a reusable LearningCrew."""

        self.learning_crew = learning_crew or LearningCrew()
        self.persistence_service = persistence_service

    def run_learning_workflow(
        self,
        user_request: str,
        user_id: int | None = None,
    ) -> LearningSessionResponse:
        """Run the complete learning workflow for one user request."""

        state = WorkflowState()
        logger.info("Starting Learning Workflow")

        if not user_request.strip():
            return self._stop_with_error(
                state,
                "intent",
                "User learning request cannot be empty.",
            )

        try:
            self._run_intent_stage(user_request, state)
            if state.learner_intent is None:
                return self._stop_with_error(
                    state,
                    "intent",
                    "Intent Agent did not return learner intent.",
                )

            missing_intent_fields = missing_required_intent_fields(
                state.learner_intent
            )
            if missing_intent_fields:
                logger.info(
                    "Intent incomplete. Missing required fields: %s",
                    ", ".join(missing_intent_fields),
                )
                return self._response(
                    state,
                    workflow_completed=False,
                    current_stage="intent_follow_up_required",
                    error_message=(
                        "Learner intent is incomplete. Missing information: "
                        f"{', '.join(missing_intent_fields)}."
                    ),
                )

            validate_planning_feasibility(state.learner_intent)
            self._persist_intent(user_id, state)
            self._run_planner_stage(state)
            self._persist_learning_plan(user_id, state)
            self._run_progress_stage(state)
            self._persist_progress(user_id, state)
            self._run_feedback_stage(state)
            self._persist_feedback(user_id, state)
            self._run_nudge_stage(state)
            self._persist_nudge(user_id, state)
        except TransientLLMError:
            logger.warning(
                "Transient LLM failure at stage %s after retry attempts.",
                state.current_stage,
            )
            raise
        except (
            PlannerValidationError,
            ProgressValidationError,
            FeedbackValidationError,
            NudgeValidationError,
            ValueError,
            RuntimeError,
        ) as exc:
            logger.exception("Learning workflow failed at stage %s", state.current_stage)
            return self._stop_with_error(state, state.current_stage, str(exc))
        except Exception as exc:
            logger.exception(
                "Unexpected learning workflow failure at stage %s",
                state.current_stage,
            )
            return self._stop_with_error(
                state,
                state.current_stage,
                f"Unexpected workflow error: {exc}",
            )

        logger.info("Learning Session Completed")
        return self._response(
            state,
            workflow_completed=True,
            current_stage="completed",
        )

    def _run_intent_stage(self, user_request: str, state: WorkflowState) -> None:
        """Run and record the Intent Agent stage."""

        state.current_stage = "intent"
        logger.info("Running Intent Agent")
        state.learner_intent = reconcile_intent_completeness(
            self.learning_crew.run_intent(user_request)
        )
        self._log_stage_output("intent", state.learner_intent)
        logger.info("Intent Completed")

    def _run_planner_stage(self, state: WorkflowState) -> None:
        """Run and record the Planner Agent stage."""

        if state.learner_intent is None:
            raise PlannerValidationError("Planner requires learner intent.")

        state.current_stage = "planner"
        logger.info("Running Planner Agent")
        planner_output = self.learning_crew.run_planner(state.learner_intent)
        state.learning_plan = schedule_learning_plan(
            planner_output,
            state.learner_intent,
        )
        self._log_stage_output("planner", state.learning_plan)
        logger.info("Planner Completed")

    def _run_progress_stage(self, state: WorkflowState) -> None:
        """Run and record the Progress Agent stage."""

        if state.learning_plan is None:
            raise ProgressValidationError("Progress analysis requires a LearningPlan.")

        state.current_stage = "progress"
        logger.info("Running Progress Agent")
        initial_progress = self._initial_progress_for_plan(state.learning_plan)
        state.progress_report = self.learning_crew.run_progress(
            state.learning_plan,
            initial_progress,
        )
        self._log_stage_output("progress", state.progress_report)
        logger.info("Progress Completed")

    def _run_feedback_stage(self, state: WorkflowState) -> None:
        """Run and record the Feedback Agent stage."""

        if state.learning_plan is None or state.progress_report is None:
            raise FeedbackValidationError(
                "Feedback generation requires a LearningPlan and ProgressReport."
            )

        state.current_stage = "feedback"
        logger.info("Running Feedback Agent")
        state.feedback_report = self.learning_crew.run_feedback(
            state.learning_plan,
            state.progress_report,
        )
        self._log_stage_output("feedback", state.feedback_report)
        logger.info("Feedback Completed")

    def _run_nudge_stage(self, state: WorkflowState) -> None:
        """Run and record the Nudge Agent stage."""

        if (
            state.learning_plan is None
            or state.progress_report is None
            or state.feedback_report is None
        ):
            raise NudgeValidationError(
                "Nudge generation requires a LearningPlan, ProgressReport, and "
                "FeedbackReport."
            )

        state.current_stage = "nudge"
        logger.info("Running Nudge Agent")
        state.nudge_report = self.learning_crew.run_nudge(
            state.learning_plan,
            state.progress_report,
            state.feedback_report,
        )
        self._log_stage_output("nudge", state.nudge_report)
        logger.info("Nudge Completed")

    def _log_stage_output(self, stage: str, output: BaseModel) -> None:
        """Log one structured agent output for workflow tracing."""

        logger.info(
            "Workflow stage=%s output=%s",
            stage,
            output.model_dump_json(),
        )

    def _initial_progress_for_plan(self, plan: LearningPlan) -> LearnerProgress:
        """Create the initial progress snapshot until persistent memory exists."""

        first_phase = min(phase.phase_number for phase in plan.phases)
        return LearnerProgress(
            completed_phases=[],
            completed_topics=[],
            current_phase=first_phase,
            completed_milestones=[],
            completion_percentage=0,
            recent_activity="Learning session started from a new user request.",
        )

    def _persist_intent(self, user_id: int | None, state: WorkflowState) -> None:
        """Persist learner intent after a successful complete Intent Agent run."""

        if (
            user_id is None
            or self.persistence_service is None
            or state.learner_intent is None
        ):
            return

        self._safe_persist(
            "learner intent",
            lambda: self.persistence_service.save_intent(
                user_id=user_id,
                intent=state.learner_intent,
            ),
        )

    def _persist_learning_plan(
        self,
        user_id: int | None,
        state: WorkflowState,
    ) -> None:
        """Persist a learning plan after a successful Planner Agent run."""

        if (
            user_id is None
            or self.persistence_service is None
            or state.learning_plan is None
        ):
            return

        self._safe_persist(
            "learning plan",
            lambda: self.persistence_service.save_learning_plan(
                user_id=user_id,
                plan=state.learning_plan,
            ),
        )

    def _persist_progress(self, user_id: int | None, state: WorkflowState) -> None:
        """Persist progress after a successful Progress Agent run."""

        if (
            user_id is None
            or self.persistence_service is None
            or state.progress_report is None
        ):
            return

        self._safe_persist(
            "progress",
            lambda: self.persistence_service.update_progress(
                user_id=user_id,
                progress_report=state.progress_report,
            ),
        )

    def _persist_feedback(self, user_id: int | None, state: WorkflowState) -> None:
        """Persist feedback after a successful Feedback Agent run."""

        if (
            user_id is None
            or self.persistence_service is None
            or state.feedback_report is None
        ):
            return

        self._safe_persist(
            "feedback",
            lambda: self.persistence_service.save_feedback(
                user_id=user_id,
                feedback_report=state.feedback_report,
            ),
        )

    def _persist_nudge(self, user_id: int | None, state: WorkflowState) -> None:
        """Persist nudge history after a successful Nudge Agent run."""

        if (
            user_id is None
            or self.persistence_service is None
            or state.nudge_report is None
        ):
            return

        self._safe_persist(
            "nudge",
            lambda: self.persistence_service.save_nudge(
                user_id=user_id,
                nudge_report=state.nudge_report,
            ),
        )

    def _safe_persist(self, operation: str, persist: Callable[[], object]) -> None:
        """Run a persistence operation without failing the AI workflow."""

        try:
            persist()
        except Exception as exc:
            logger.exception("Failed to persist %s; continuing workflow.", operation)
            logger.debug("Persistence failure details: %s", exc)

    def _stop_with_error(
        self,
        state: WorkflowState,
        stage: str,
        error_message: str,
    ) -> LearningSessionResponse:
        """Return a partial response with a meaningful workflow error."""

        logger.error("Learning workflow stopped at %s: %s", stage, error_message)
        state.errors.append(error_message)
        return self._response(
            state,
            workflow_completed=False,
            current_stage=stage,
            error_message=error_message,
        )

    def _response(
        self,
        state: WorkflowState,
        *,
        workflow_completed: bool,
        current_stage: str,
        error_message: str | None = None,
    ) -> LearningSessionResponse:
        """Build the top-level workflow response."""

        response = LearningSessionResponse(
            learner_intent=state.learner_intent,
            learning_plan=state.learning_plan,
            progress_report=state.progress_report,
            feedback_report=state.feedback_report,
            nudge_report=state.nudge_report,
            workflow_completed=workflow_completed,
            current_stage=current_stage,
            error_message=error_message,
        )
        logger.info(
            "Workflow result learner_intent=%s workflow_stage=%s "
            "workflow_completed=%s exit_reason=%s",
            (
                response.learner_intent.model_dump_json()
                if response.learner_intent is not None
                else "null"
            ),
            response.current_stage,
            response.workflow_completed,
            error_message or "workflow_completed",
        )
        return response
