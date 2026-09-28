"""Gemini-backed interview question generation and answer evaluation."""

from __future__ import annotations

import json
import logging
from collections.abc import Iterable
from itertools import cycle, islice
from typing import Protocol

from pydantic import BaseModel, Field, ValidationError, field_validator

from backend.agents.base_agent import run_with_gemini_retry
from backend.core.llm import get_gemini_llm
from backend.schemas.interview import (
    InterviewAnswerRequest,
    InterviewAnswerResponse,
    InterviewEndRequest,
    InterviewEndResponse,
    InterviewQuestion,
    InterviewStartRequest,
    InterviewStartResponse,
    InterviewSummary,
)
from backend.services.interview_session_manager import (
    InterviewAnswerEvaluation,
    InterviewCompletedError,
    InterviewSession,
    InterviewSessionManager,
    InterviewStatus,
    InvalidInterviewStateError,
)


MOCK_QUESTIONS = (
    "What is supervised learning?",
    "What is overfitting?",
    "What is normalization?",
    "How would you explain the difference between classification and regression?",
    "What is the purpose of splitting data into training and test sets?",
    "How do you approach debugging a program that produces incorrect output?",
    "What is the difference between a list and a dictionary in Python?",
    "How would you communicate a technical result to a non-technical stakeholder?",
    "What steps would you take before deploying a machine learning model?",
    "Describe a project where you had to learn a new technical skill.",
)
MOCK_FEEDBACK = "Answer recorded successfully."
FALLBACK_SCORE = 8
logger = logging.getLogger(__name__)

INTERVIEW_SYSTEM_PROMPT = """You generate technical interview questions.
Return strict JSON only. Do not include markdown, code fences, or commentary.
Questions must be concise, interview-style, unique, and gradually increase in
difficulty. Do not include answers, explanations, hints, scores, or multiple
choice options."""

ANSWER_EVALUATION_SYSTEM_PROMPT = """You evaluate technical interview answers.
Return strict JSON only. Do not include markdown, code fences, or commentary.
Score technical quality, communication clarity, and confidence from 0 to 10.
Give concise, constructive feedback grounded in the candidate's answer."""


class _GeneratedQuestion(BaseModel):
    question: str = Field(..., min_length=3, max_length=500)

    @field_validator("question")
    @classmethod
    def _validate_question(cls, value: str) -> str:
        stripped = value.strip()
        if len(stripped) < 3:
            raise ValueError("Question must contain meaningful text.")
        return stripped


class _GeneratedQuestions(BaseModel):
    questions: list[_GeneratedQuestion]


class _AnswerEvaluation(BaseModel):
    technical_score: int = Field(..., ge=0, le=10)
    communication_score: int = Field(..., ge=0, le=10)
    confidence_score: int = Field(..., ge=0, le=10)
    feedback: str = Field(..., min_length=3, max_length=1000)

    @field_validator("feedback")
    @classmethod
    def _validate_feedback(cls, value: str) -> str:
        stripped = value.strip()
        if len(stripped) < 3:
            raise ValueError("Feedback must contain meaningful text.")
        return stripped


class InterviewLLM(Protocol):
    """Minimal shared LLM interface required by the interview service."""

    def call(
        self,
        messages: str,
        *,
        response_model: type[BaseModel] | None = None,
    ) -> object:
        """Generate all interview questions in one completion."""


class InterviewService:
    """Coordinate Gemini-generated questions and answer evaluations."""

    def __init__(
        self,
        session_manager: InterviewSessionManager | None = None,
        llm: InterviewLLM | None = None,
    ) -> None:
        self.session_manager = session_manager or InterviewSessionManager()
        self.llm = llm

    def start_interview(
        self,
        request: InterviewStartRequest,
    ) -> InterviewStartResponse:
        """Generate all questions once, store them, and return the first."""

        questions = self._generate_questions(request)
        session = self.session_manager.create_interview(
            learning_goal=request.learning_goal,
            interview_role=request.interview_role,
            difficulty=request.difficulty,
            question_list=questions,
        )
        return InterviewStartResponse(
            interview_id=session.interview_id,
            current_question=self._question_for_session(session),
        )

    def _generate_questions(self, request: InterviewStartRequest) -> list[str]:
        """Generate and validate one complete interview question set."""

        prompt = self._build_generation_prompt(request)
        try:
            logger.info(
                "Generating %s Gemini interview questions for role=%s difficulty=%s.",
                request.number_of_questions,
                request.interview_role,
                request.difficulty.value,
            )
            llm = self.llm or get_gemini_llm()
            response = run_with_gemini_retry(
                "Interview Question Generator",
                lambda: llm.call(
                    prompt,
                    response_model=_GeneratedQuestions,
                ),
                prompt=prompt,
            )
            generated = self._parse_generated_questions(response)
            questions = [item.question for item in generated.questions]
            self._validate_generated_questions(
                questions,
                request.number_of_questions,
            )
            logger.info(
                "Generated and validated %s Gemini interview questions.",
                len(questions),
            )
            return questions
        except Exception as exc:
            logger.warning(
                "Gemini interview question generation failed; using mock "
                "questions. Reason: %s",
                exc,
                exc_info=True,
            )
            return self._mock_questions(request.number_of_questions)

    def _build_generation_prompt(self, request: InterviewStartRequest) -> str:
        """Build the single Gemini prompt for the complete interview."""

        return f"""{INTERVIEW_SYSTEM_PROMPT}

Learning Goal: {request.learning_goal}
Interview Role: {request.interview_role}
Difficulty: {request.difficulty.value}
Number of Questions: {request.number_of_questions}

Generate exactly {request.number_of_questions} technical questions suitable
for this role and difficulty. Arrange them from foundational to more
challenging. Avoid duplicate or substantially repeated questions.

Return this exact JSON shape:
{{
  "questions": [
    {{
      "question": "Question text"
    }}
  ]
}}

The questions array must contain exactly {request.number_of_questions} items."""

    def _parse_generated_questions(
        self,
        response: object,
    ) -> _GeneratedQuestions:
        """Parse a structured or raw Gemini response with Pydantic."""

        if isinstance(response, _GeneratedQuestions):
            return response

        payload: object = response
        if isinstance(response, str):
            if not response.strip():
                raise ValueError("Gemini returned an empty response.")
            payload = json.loads(response)

        try:
            return _GeneratedQuestions.model_validate(payload)
        except ValidationError as exc:
            raise ValueError(
                "Gemini interview questions failed validation."
            ) from exc

    def _validate_generated_questions(
        self,
        questions: list[str],
        expected_count: int,
    ) -> None:
        """Require the exact requested count with no duplicate questions."""

        if len(questions) != expected_count:
            raise ValueError(
                "Gemini returned an unexpected number of interview questions."
            )

        normalized = {
            " ".join(question.casefold().split()).rstrip("?.!")
            for question in questions
        }
        if len(normalized) != len(questions):
            raise ValueError("Gemini returned duplicate interview questions.")

    def _mock_questions(self, count: int) -> list[str]:
        """Return a deterministic fallback question set."""

        return list(islice(cycle(MOCK_QUESTIONS), count))

    def submit_answer(
        self,
        request: InterviewAnswerRequest,
    ) -> InterviewAnswerResponse:
        """Evaluate and record an answer, then advance the interview."""

        current_session = self.session_manager.get_interview(
            request.interview_id
        )
        if current_session.status is InterviewStatus.COMPLETED:
            raise InterviewCompletedError(
                "Interview has already been completed."
            )
        self._validate_question_index(current_session)
        current_index = current_session.current_question_index
        current_question = current_session.question_list[current_index]
        evaluation = self._evaluate_answer(
            session=current_session,
            question=current_question,
            answer=request.answer,
        )

        def record_answer(session: InterviewSession) -> None:
            if session.status is InterviewStatus.COMPLETED:
                raise InterviewCompletedError(
                    "Interview has already been completed."
                )
            self._validate_question_index(session)
            if len(session.candidate_answers) != session.current_question_index:
                raise InvalidInterviewStateError(
                    "Interview answer state is inconsistent."
                )
            if session.current_question_index != current_index:
                raise InvalidInterviewStateError(
                    "Interview advanced while the answer was being evaluated."
                )
            if len(session.answer_evaluations) != session.current_question_index:
                raise InvalidInterviewStateError(
                    "Interview evaluation state is inconsistent."
                )

            session.candidate_answers.append(request.answer)
            session.answer_evaluations.append(
                InterviewAnswerEvaluation(
                    question=current_question,
                    candidate_answer=request.answer,
                    technical_score=evaluation.technical_score,
                    communication_score=evaluation.communication_score,
                    confidence_score=evaluation.confidence_score,
                    feedback=evaluation.feedback,
                )
            )
            session.current_question_index += 1
            if session.current_question_index >= session.total_questions:
                session.status = InterviewStatus.COMPLETED

        session = self.session_manager.update_interview(
            request.interview_id,
            record_answer,
        )
        is_complete = session.status is InterviewStatus.COMPLETED
        return InterviewAnswerResponse(
            feedback=evaluation.feedback,
            next_question=(
                None if is_complete else self._question_for_session(session)
            ),
            is_interview_complete=is_complete,
        )

    def _evaluate_answer(
        self,
        *,
        session: InterviewSession,
        question: str,
        answer: str,
    ) -> _AnswerEvaluation:
        """Evaluate one answer with Gemini or return deterministic fallback."""

        prompt = self._build_evaluation_prompt(
            session=session,
            question=question,
            answer=answer,
        )
        try:
            logger.info(
                "Evaluating interview answer %s of %s with Gemini.",
                session.current_question_index + 1,
                session.total_questions,
            )
            llm = self.llm or get_gemini_llm()
            response = run_with_gemini_retry(
                "Interview Answer Evaluator",
                lambda: llm.call(
                    prompt,
                    response_model=_AnswerEvaluation,
                ),
                prompt=prompt,
            )
            evaluation = self._parse_answer_evaluation(response)
            logger.info(
                "Gemini interview answer evaluation completed for question %s.",
                session.current_question_index + 1,
            )
            return evaluation
        except Exception as exc:
            logger.warning(
                "Gemini interview answer evaluation failed; using fallback "
                "scores. Reason: %s",
                exc,
                exc_info=True,
            )
            return self._fallback_evaluation()

    def _build_evaluation_prompt(
        self,
        *,
        session: InterviewSession,
        question: str,
        answer: str,
    ) -> str:
        """Build the Gemini prompt for one candidate answer."""

        return f"""{ANSWER_EVALUATION_SYSTEM_PROMPT}

Learning Goal: {session.learning_goal}
Interview Role: {session.interview_role}
Difficulty: {session.difficulty.value}
Current Question: {question}
Candidate Answer: {answer}

Return this exact JSON shape:
{{
  "technical_score": 8,
  "communication_score": 7,
  "confidence_score": 8,
  "feedback": "Concise constructive feedback"
}}"""

    def _parse_answer_evaluation(self, response: object) -> _AnswerEvaluation:
        """Parse a structured or raw Gemini evaluation with Pydantic."""

        if isinstance(response, _AnswerEvaluation):
            return response

        payload: object = response
        if isinstance(response, str):
            if not response.strip():
                raise ValueError("Gemini returned an empty evaluation.")
            payload = json.loads(response)

        try:
            return _AnswerEvaluation.model_validate(payload)
        except ValidationError as exc:
            raise ValueError(
                "Gemini interview evaluation failed validation."
            ) from exc

    def _fallback_evaluation(self) -> _AnswerEvaluation:
        """Return the required deterministic evaluation fallback."""

        return _AnswerEvaluation(
            technical_score=FALLBACK_SCORE,
            communication_score=FALLBACK_SCORE,
            confidence_score=FALLBACK_SCORE,
            feedback=MOCK_FEEDBACK,
        )

    def end_interview(
        self,
        request: InterviewEndRequest,
    ) -> InterviewEndResponse:
        """Aggregate stored evaluations and delete the in-memory session."""

        session = self.session_manager.end_interview(request.interview_id)
        summary = self._build_summary(session)
        self.session_manager.delete_interview(request.interview_id)
        return InterviewEndResponse(summary=summary)

    def _build_summary(self, session: InterviewSession) -> InterviewSummary:
        """Calculate final scores and feedback without another LLM call."""

        evaluations = session.answer_evaluations
        if not evaluations:
            return InterviewSummary(
                technical_score=0,
                communication_score=0,
                confidence_score=0,
                questions_answered=0,
                overall_feedback=(
                    "No answers were submitted for evaluation."
                ),
            )

        technical_average = self._average(
            item.technical_score for item in evaluations
        )
        communication_average = self._average(
            item.communication_score for item in evaluations
        )
        confidence_average = self._average(
            item.confidence_score for item in evaluations
        )
        return InterviewSummary(
            technical_score=round(technical_average * 10),
            communication_score=round(communication_average * 10),
            confidence_score=round(confidence_average * 10),
            questions_answered=len(evaluations),
            overall_feedback=self._overall_feedback(
                technical_average=technical_average,
                communication_average=communication_average,
                confidence_average=confidence_average,
            ),
        )

    def _average(self, scores: Iterable[int]) -> float:
        """Calculate an average from one score iterator."""

        values = list(scores)
        return sum(values) / len(values)

    def _overall_feedback(
        self,
        *,
        technical_average: float,
        communication_average: float,
        confidence_average: float,
    ) -> str:
        """Create concise deterministic feedback from average scores."""

        messages = [
            (
                "Strong technical understanding."
                if technical_average >= 8
                else "Continue strengthening your technical explanations."
            ),
            (
                "Communicates ideas clearly."
                if communication_average >= 8
                else "Structure answers more clearly and concisely."
            ),
        ]
        if confidence_average < 6:
            messages.append("Practice explaining answers more confidently.")
        elif confidence_average >= 8:
            messages.append("Demonstrates strong confidence.")
        else:
            messages.append("Confidence is developing with continued practice.")
        return " ".join(messages)

    def _question_for_session(
        self,
        session: InterviewSession,
    ) -> InterviewQuestion:
        """Build the candidate-facing question for the current index."""

        self._validate_question_index(session)
        question_number = session.current_question_index + 1
        return InterviewQuestion(
            question_id=f"{session.interview_id}-question-{question_number}",
            question_number=question_number,
            total_questions=session.total_questions,
            question=session.question_list[session.current_question_index],
        )

    def _validate_question_index(self, session: InterviewSession) -> None:
        """Reject an invalid active question index."""

        if not 0 <= session.current_question_index < session.total_questions:
            raise InvalidInterviewStateError(
                "Interview has an invalid current question index."
            )
