import { apiClient } from "@/api/apiClient";
import type {
  MentorChatApiResponse,
  MentorChatRequest,
} from "@/types/mentor";

export async function sendMentorMessage(
  payload: MentorChatRequest
): Promise<MentorChatApiResponse> {
  const response = await apiClient.post<MentorChatApiResponse>(
    "/mentor/chat",
    payload
  );
  return response.data;
}
