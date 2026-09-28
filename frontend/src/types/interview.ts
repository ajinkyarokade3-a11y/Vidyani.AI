import type { ApiSuccessResponse } from "@/types/api";

export type InterviewDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type InterviewQuestion = {
  question_id: string;
  question_number: number;
  total_questions: number;
  question: string;
};

export type InterviewStartRequest = {
  learning_goal: string;
  interview_role: string;
  difficulty: InterviewDifficulty;
  number_of_questions: number;
};

export type InterviewStartResult = {
  interview_id: string;
  current_question: InterviewQuestion;
};

export type InterviewAnswerRequest = {
  interview_id: string;
  answer: string;
};

export type InterviewAnswerResult = {
  feedback: string;
  next_question: InterviewQuestion | null;
  is_interview_complete: boolean;
};

export type InterviewEndRequest = {
  interview_id: string;
};

export type InterviewSummary = {
  technical_score: number;
  communication_score: number;
  confidence_score: number;
  questions_answered: number;
  overall_feedback: string;
};

export type InterviewEndResult = {
  summary: InterviewSummary;
};

export type InterviewStartApiResponse =
  ApiSuccessResponse<InterviewStartResult>;
export type InterviewAnswerApiResponse =
  ApiSuccessResponse<InterviewAnswerResult>;
export type InterviewEndApiResponse = ApiSuccessResponse<InterviewEndResult>;
