import { apiClient } from "@/api/apiClient";
import type {
  InterviewAnswerApiResponse,
  InterviewAnswerRequest,
  InterviewEndApiResponse,
  InterviewEndRequest,
  InterviewStartApiResponse,
  InterviewStartRequest,
} from "@/types/interview";

export async function startInterview(
  payload: InterviewStartRequest
): Promise<InterviewStartApiResponse> {
  const response = await apiClient.post<InterviewStartApiResponse>(
    "/interview/start",
    payload
  );
  return response.data;
}

export async function submitInterviewAnswer(
  payload: InterviewAnswerRequest
): Promise<InterviewAnswerApiResponse> {
  const response = await apiClient.post<InterviewAnswerApiResponse>(
    "/interview/answer",
    payload
  );
  return response.data;
}

export async function endInterview(
  payload: InterviewEndRequest
): Promise<InterviewEndApiResponse> {
  const response = await apiClient.post<InterviewEndApiResponse>(
    "/interview/end",
    payload
  );
  return response.data;
}
