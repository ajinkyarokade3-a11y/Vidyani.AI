"""Deterministic tests for quiz generation validation and scoring."""

from __future__ import annotations

import json

from backend.schemas.quiz import (
    QuizDifficulty,
    QuizGenerationRequest,
    QuizSubmissionRequest,
)
from backend.services.quiz_service import (
    InvalidQuizResponseError,
    QuizService,
)


class _FakeGeminiLLM:
    def __init__(self, content: str) -> None:
        self.content = content

    def call(
        self,
        messages: str,
        *,
        response_model: type[object] | None = None,
    ) -> object:
        del messages, response_model
        return self.content


def main() -> int:
    generation_request = QuizGenerationRequest(
        topics=["Python lists", "Python dictionaries"],
        difficulty=QuizDifficulty.BEGINNER,
        number_of_questions=2,
    )
    content = json.dumps(
        {
            "questions": [
                {
                    "question": "Which syntax creates a list?",
                    "options": ["[]", "{}", "()", "<>"],
                    "correct_answer": "[]",
                    "explanation": "Square brackets create a Python list.",
                },
                {
                    "question": "Which syntax creates a dictionary?",
                    "options": ["[]", "{}", "()", "<>"],
                    "correct_answer": "{}",
                    "explanation": "Curly braces create an empty dictionary.",
                },
            ]
        }
    )
    service = QuizService(llm=_FakeGeminiLLM(content))  # type: ignore[arg-type]
    quiz = service.generate_quiz(generation_request)
    result = service.submit_quiz(
        QuizSubmissionRequest(
            generated_quiz=quiz,
            selected_answers=["[]", "[]"],
        )
    )

    valid_score = (
        result.score == 1
        and result.total_questions == 2
        and result.percentage == 50
        and result.results[0].is_correct
        and not result.results[1].is_correct
    )
    invalid_json_rejected = _invalid_json_is_rejected(generation_request)
    passed = valid_score and invalid_json_rejected
    print(f"Quiz service tests: {'PASS' if passed else 'FAIL'}")
    return 0 if passed else 1


def _invalid_json_is_rejected(request: QuizGenerationRequest) -> bool:
    service = QuizService(
        llm=_FakeGeminiLLM("not valid json")  # type: ignore[arg-type]
    )
    try:
        service.generate_quiz(request)
    except InvalidQuizResponseError:
        return True
    return False


if __name__ == "__main__":
    raise SystemExit(main())
