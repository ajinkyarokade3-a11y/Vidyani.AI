"""Request and response schemas for quizzes."""

from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel, Field, field_validator, model_validator


class QuizDifficulty(StrEnum):
    """Supported quiz difficulty levels."""

    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"


class QuizQuestion(BaseModel):
    """One multiple-choice quiz question."""

    question: str = Field(..., min_length=1)
    options: list[str] = Field(..., min_length=4, max_length=4)
    correct_answer: str = Field(..., min_length=1)
    explanation: str = Field(..., min_length=1)

    @field_validator("question", "correct_answer", "explanation")
    @classmethod
    def _strip_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Value cannot be empty.")
        return stripped

    @field_validator("options")
    @classmethod
    def _validate_options(cls, options: list[str]) -> list[str]:
        cleaned = [option.strip() for option in options]
        if any(not option for option in cleaned):
            raise ValueError("Quiz options cannot be empty.")
        if len(set(cleaned)) != 4:
            raise ValueError("Quiz options must contain four unique values.")
        return cleaned

    @model_validator(mode="after")
    def _validate_correct_answer(self) -> "QuizQuestion":
        if self.correct_answer not in self.options:
            raise ValueError("correct_answer must match one of the options.")
        return self


class QuizGenerationRequest(BaseModel):
    """Quiz generation parameters."""

    topics: list[str] = Field(..., min_length=1, max_length=50)
    difficulty: QuizDifficulty
    number_of_questions: int = Field(..., ge=1, le=20)

    @field_validator("topics")
    @classmethod
    def _validate_topics(cls, topics: list[str]) -> list[str]:
        cleaned = [topic.strip() for topic in topics]
        if any(not topic for topic in cleaned):
            raise ValueError("Topics cannot contain empty values.")
        if len(set(cleaned)) != len(cleaned):
            raise ValueError("Topics must be unique.")
        return cleaned


class QuizGenerationResponse(BaseModel):
    """Generated quiz returned to the learner."""

    topics: list[str]
    difficulty: QuizDifficulty
    questions: list[QuizQuestion] = Field(..., min_length=1)


class QuizSubmissionRequest(BaseModel):
    """Generated quiz and learner-selected answers."""

    generated_quiz: QuizGenerationResponse
    selected_answers: list[str]

    @field_validator("selected_answers")
    @classmethod
    def _strip_selected_answers(cls, answers: list[str]) -> list[str]:
        return [answer.strip() for answer in answers]

    @model_validator(mode="after")
    def _validate_answer_count(self) -> "QuizSubmissionRequest":
        if len(self.selected_answers) != len(self.generated_quiz.questions):
            raise ValueError(
                "selected_answers must contain one answer per quiz question."
            )
        for index, (answer, question) in enumerate(
            zip(
                self.selected_answers,
                self.generated_quiz.questions,
                strict=True,
            ),
            start=1,
        ):
            if answer not in question.options:
                raise ValueError(
                    f"Selected answer {index} must match one of its question options."
                )
        return self


class QuizQuestionResult(BaseModel):
    """Scoring result for one submitted question."""

    question_number: int = Field(..., ge=1)
    question: str
    selected_answer: str
    correct_answer: str
    is_correct: bool
    explanation: str


class QuizSubmissionResponse(BaseModel):
    """Backend-calculated quiz score and explanations."""

    score: int = Field(..., ge=0)
    total_questions: int = Field(..., ge=1)
    percentage: float = Field(..., ge=0, le=100)
    results: list[QuizQuestionResult]
