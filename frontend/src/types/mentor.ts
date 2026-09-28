import type { ApiSuccessResponse } from "@/types/api";

export type MentorRole = "user" | "assistant";

export type MentorMessage = {
  role: MentorRole;
  content: string;
};

export type MentorChatRequest = {
  message: string;
  learning_goal: string | null;
  current_topic: string | null;
  conversation_history: MentorMessage[];
};

export type MentorChatResponse = {
  reply: string;
  suggested_followups: string[];
};

export type MentorChatApiResponse = ApiSuccessResponse<MentorChatResponse>;
