import type { ApiSuccessResponse } from "@/types/api";

export type QuizDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type QuizQuestion = {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
};

export type QuizGenerationRequest = {
  topics: string[];
  difficulty: QuizDifficulty;
  number_of_questions: number;
};

export type GeneratedQuiz = {
  topics: string[];
  difficulty: QuizDifficulty;
  questions: QuizQuestion[];
};

export type QuizSubmissionRequest = {
  generated_quiz: GeneratedQuiz;
  selected_answers: string[];
};

export type QuizQuestionResult = {
  question_number: number;
  question: string;
  selected_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
};

export type QuizSubmissionResult = {
  score: number;
  total_questions: number;
  percentage: number;
  results: QuizQuestionResult[];
};

export type QuizGenerationApiResponse = ApiSuccessResponse<GeneratedQuiz>;
export type QuizSubmissionApiResponse =
  ApiSuccessResponse<QuizSubmissionResult>;
