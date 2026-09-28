import { useMutation } from "@tanstack/react-query";

import { generateQuiz, submitQuiz } from "@/api/quizApi";
import type {
  QuizGenerationApiResponse,
  QuizGenerationRequest,
  QuizSubmissionApiResponse,
  QuizSubmissionRequest,
} from "@/types/quiz";

export function useGenerateQuiz() {
  return useMutation<
    QuizGenerationApiResponse,
    Error,
    QuizGenerationRequest
  >({
    mutationFn: generateQuiz,
  });
}

export function useSubmitQuiz() {
  return useMutation<
    QuizSubmissionApiResponse,
    Error,
    QuizSubmissionRequest
  >({
    mutationFn: submitQuiz,
  });
}
