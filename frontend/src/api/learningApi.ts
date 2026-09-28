import { apiClient } from "@/api/apiClient";
import type {
  FeedbackApiResponse,
  LearnerIntentApiResponse,
  LearningPlanApiResponse,
  LearningSessionApiResponse,
  LearningSessionRequest,
  NudgeApiResponse,
  ProgressApiResponse,
  UserApiResponse,
} from "@/types/learning";

export async function startLearningSession(
  payload: LearningSessionRequest
): Promise<LearningSessionApiResponse> {
  const response = await apiClient.post<LearningSessionApiResponse>(
    "/learning/session",
    payload
  );
  return response.data;
}

export async function getUser(userId: number): Promise<UserApiResponse> {
  const response = await apiClient.get<UserApiResponse>(`/users/${userId}`);
  return response.data;
}

export async function getLatestIntent(
  userId: number
): Promise<LearnerIntentApiResponse> {
  const response = await apiClient.get<LearnerIntentApiResponse>(
    `/users/${userId}/intent`
  );
  return response.data;
}

export async function getLearningPlan(
  userId: number
): Promise<LearningPlanApiResponse> {
  const response = await apiClient.get<LearningPlanApiResponse>(
    `/users/${userId}/plan`
  );
  return response.data;
}

export async function getProgress(
  userId: number
): Promise<ProgressApiResponse> {
  const response = await apiClient.get<ProgressApiResponse>(
    `/users/${userId}/progress`
  );
  return response.data;
}

export async function getFeedback(
  userId: number
): Promise<FeedbackApiResponse> {
  const response = await apiClient.get<FeedbackApiResponse>(
    `/users/${userId}/feedback`
  );
  return response.data;
}

export async function getNudges(userId: number): Promise<NudgeApiResponse> {
  const response = await apiClient.get<NudgeApiResponse>(
    `/users/${userId}/nudges`
  );
  return response.data;
}
