"""Deterministic tests for Gemini-backed interview question generation."""

from __future__ import annotations

import json

from backend.schemas.interview import (
    InterviewAnswerRequest,
    InterviewDifficulty,
    InterviewEndRequest,
    InterviewStartRequest,
)
from backend.services.interview_service import InterviewService


class _FakeGeminiLLM:
    """Return queued Gemini-style responses and count calls."""

    def __init__(self, *responses: object) -> None:
        self.responses = list(responses)
        self.call_count = 0

    def call(self, messages: str, *, response_model: object = None) -> object:
        del messages, response_model
        self.call_count += 1
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


def main() -> int:
    """Verify generated questions, one LLM call, fallback, and full flow."""

    generated_questions = [
        "What is the difference between supervised and unsupervised learning?",
        "How would you detect and reduce overfitting in a predictive model?",
        "How would you design and validate a production recommendation system?",
    ]
    generated_response = json.dumps(
        {
            "questions": [
                {"question": question}
                for question in generated_questions
            ]
        }
    )
    evaluations = [
        {
            "technical_score": 9,
            "communication_score": 8,
            "confidence_score": 7,
            "feedback": "Strong technical explanation with clear examples.",
        },
        {
            "technical_score": 7,
            "communication_score": 9,
            "confidence_score": 8,
            "feedback": "Clear response; add more technical depth.",
        },
        {
            "technical_score": 8,
            "communication_score": 7,
            "confidence_score": 9,
            "feedback": "Good system-level reasoning and confident delivery.",
        },
    ]
    fake_llm = _FakeGeminiLLM(
        generated_response,
        *(json.dumps(evaluation) for evaluation in evaluations),
    )
    service = InterviewService(llm=fake_llm)  # type: ignore[arg-type]
    started = service.start_interview(
        InterviewStartRequest(
            learning_goal="Become a Data Scientist",
            interview_role="Junior Data Scientist",
            difficulty=InterviewDifficulty.INTERMEDIATE,
            number_of_questions=3,
        )
    )

    print(f"Interview ID: {started.interview_id}")
    print(f"Gemini calls after start: {fake_llm.call_count}")
    question = started.current_question
    print(f"Question {question.question_number}: {question.question}")

    while True:
        answered = service.submit_answer(
            InterviewAnswerRequest(
                interview_id=started.interview_id,
                answer=f"Sample answer for question {question.question_number}.",
            )
        )
        print(f"Feedback: {answered.feedback}")
        if answered.is_interview_complete:
            break
        if answered.next_question is None:
            print("Interview failed: next question is missing.")
            return 1
        question = answered.next_question
        print(f"Question {question.question_number}: {question.question}")

    stored_session = service.session_manager.get_interview(
        started.interview_id
    )
    evaluations_stored = (
        len(stored_session.answer_evaluations) == 3
        and stored_session.answer_evaluations[0].question
        == generated_questions[0]
        and stored_session.answer_evaluations[0].candidate_answer
        == "Sample answer for question 1."
        and stored_session.answer_evaluations[0].technical_score == 9
        and stored_session.answer_evaluations[0].feedback
        == evaluations[0]["feedback"]
    )
    print(
        "Answer evaluations stored: "
        f"{'PASS' if evaluations_stored else 'FAIL'}"
    )

    ended = service.end_interview(
        InterviewEndRequest(interview_id=started.interview_id)
    )
    summary = ended.summary
    print("Final Summary:")
    print(f"- Technical Score: {summary.technical_score}")
    print(f"- Communication Score: {summary.communication_score}")
    print(f"- Confidence Score: {summary.confidence_score}")
    print(f"- Questions Answered: {summary.questions_answered}")
    print(f"- Overall Feedback: {summary.overall_feedback}")

    passed = (
        fake_llm.call_count == 4
        and evaluations_stored
        and question.question == generated_questions[-1]
        and summary.questions_answered == 3
        and summary.technical_score == 80
        and summary.communication_score == 80
        and summary.confidence_score == 80
        and "Strong technical understanding." in summary.overall_feedback
        and "Communicates ideas clearly." in summary.overall_feedback
    )
    fallback_llm = _FakeGeminiLLM(
        json.dumps(
            {
                "questions": [
                    {"question": generated_questions[0]},
                ]
            }
        ),
        "not valid json",
    )
    fallback_service = InterviewService(
        llm=fallback_llm  # type: ignore[arg-type]
    )
    fallback = fallback_service.start_interview(
        InterviewStartRequest(
            learning_goal="Become a Data Scientist",
            interview_role="Junior Data Scientist",
            difficulty=InterviewDifficulty.BEGINNER,
            number_of_questions=1,
        )
    )
    fallback_answer = fallback_service.submit_answer(
        InterviewAnswerRequest(
            interview_id=fallback.interview_id,
            answer="A sample answer.",
        )
    )
    fallback_summary = fallback_service.end_interview(
        InterviewEndRequest(interview_id=fallback.interview_id)
    ).summary
    fallback_passed = (
        fallback_llm.call_count == 2
        and fallback.current_question.question == generated_questions[0]
        and fallback_answer.feedback == "Answer recorded successfully."
        and fallback_summary.technical_score == 80
        and fallback_summary.communication_score == 80
        and fallback_summary.confidence_score == 80
    )
    print(
        "Invalid Gemini evaluation fallback: "
        f"{'PASS' if fallback_passed else 'FAIL'}"
    )
    print(
        "Interview service test: "
        f"{'PASS' if passed and fallback_passed else 'FAIL'}"
    )
    return 0 if passed and fallback_passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
