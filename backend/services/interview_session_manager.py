"""Thread-safe in-memory storage for mock interview sessions."""

from __future__ import annotations

from collections.abc import Callable
from copy import deepcopy
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
from threading import RLock
from uuid import uuid4

from backend.schemas.interview import InterviewDifficulty


class InterviewStatus(StrEnum):
    """Internal lifecycle state for an interview session."""

    ACTIVE = "active"
    COMPLETED = "completed"


class InterviewSessionError(RuntimeError):
    """Base error raised by the interview session manager."""


class InterviewNotFoundError(InterviewSessionError):
    """Raised when an interview id is unknown."""


class InterviewCompletedError(InterviewSessionError):
    """Raised when an answer is submitted after completion."""


class InvalidInterviewStateError(InterviewSessionError):
    """Raised when stored interview state is internally inconsistent."""


@dataclass
class InterviewAnswerEvaluation:
    """Stored evaluation for one submitted interview answer."""

    question: str
    candidate_answer: str
    technical_score: int
    communication_score: int
    confidence_score: int
    feedback: str


@dataclass
class InterviewSession:
    """Internal state for one in-memory interview."""

    interview_id: str
    learning_goal: str
    interview_role: str
    difficulty: InterviewDifficulty
    total_questions: int
    current_question_index: int
    question_list: list[str]
    candidate_answers: list[str] = field(default_factory=list)
    answer_evaluations: list[InterviewAnswerEvaluation] = field(
        default_factory=list
    )
    interview_start_time: datetime = field(
        default_factory=lambda: datetime.now(UTC)
    )
    status: InterviewStatus = InterviewStatus.ACTIVE


class InterviewSessionManager:
    """Create, retrieve, update, end, and delete in-memory interviews."""

    def __init__(self) -> None:
        self._sessions: dict[str, InterviewSession] = {}
        self._lock = RLock()

    def create_interview(
        self,
        *,
        learning_goal: str,
        interview_role: str,
        difficulty: InterviewDifficulty,
        question_list: list[str],
    ) -> InterviewSession:
        """Create and store one interview session."""

        interview_id = uuid4().hex
        session = InterviewSession(
            interview_id=interview_id,
            learning_goal=learning_goal,
            interview_role=interview_role,
            difficulty=difficulty,
            total_questions=len(question_list),
            current_question_index=0,
            question_list=list(question_list),
        )
        with self._lock:
            self._sessions[interview_id] = session
        return deepcopy(session)

    def get_interview(self, interview_id: str) -> InterviewSession:
        """Return one interview session."""

        with self._lock:
            return deepcopy(self._get_required(interview_id))

    def update_interview(
        self,
        interview_id: str,
        update: Callable[[InterviewSession], None],
    ) -> InterviewSession:
        """Apply one atomic state update and return the resulting session."""

        with self._lock:
            session = self._get_required(interview_id)
            update(session)
            return deepcopy(session)

    def end_interview(self, interview_id: str) -> InterviewSession:
        """Mark an interview completed and return its final state."""

        with self._lock:
            session = self._get_required(interview_id)
            session.status = InterviewStatus.COMPLETED
            return deepcopy(session)

    def delete_interview(self, interview_id: str) -> None:
        """Remove one interview session from memory."""

        with self._lock:
            if self._sessions.pop(interview_id, None) is None:
                raise InterviewNotFoundError("Interview session not found.")

    def _get_required(self, interview_id: str) -> InterviewSession:
        session = self._sessions.get(interview_id)
        if session is None:
            raise InterviewNotFoundError("Interview session not found.")
        return session
