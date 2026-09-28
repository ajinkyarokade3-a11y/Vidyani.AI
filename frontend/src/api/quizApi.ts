import { apiClient } from "@/api/apiClient";
import type {
  QuizGenerationApiResponse,
  QuizGenerationRequest,
  QuizSubmissionApiResponse,
  QuizSubmissionRequest,
} from "@/types/quiz";

export async function generateQuiz(
  payload: QuizGenerationRequest
): Promise<QuizGenerationApiResponse> {
  const response = await apiClient.post<QuizGenerationApiResponse>(
    "/quiz/generate",
    payload
  );
  return response.data;
}

export async function submitQuiz(
  payload: QuizSubmissionRequest
): Promise<QuizSubmissionApiResponse> {
  const response = await apiClient.post<QuizSubmissionApiResponse>(
    "/quiz/submit",
    payload
  );
  return response.data;
}
