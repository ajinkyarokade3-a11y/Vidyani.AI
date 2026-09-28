import type { ApiSuccessResponse } from "@/types/api";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type LearningSessionRequest = {
  user_name: string;
  email?: string | null;
  prompt: string;
};

export type LearnerIntent = {
  learning_goal: string | null;
  subject: string | null;
  current_skill_level: string | null;
  available_time: string | null;
  target_deadline: string | null;
  preferred_learning_style: string | null;
  is_complete: boolean;
  missing_information: string[];
  follow_up_questions: string[];
};

export type LearningPhase = {
  phase_number: number;
  title: string;
  objective: string;
  recommended_topics: string[];
  estimated_duration: string;
  duration_days?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  milestones: string[];
  suggested_resource_categories: string[];
};

export type LearningPlan = {
  learning_goal: string;
  subject: string;
  learner_level: string;
  total_available_time: string;
  target_deadline: string;
  preferred_learning_style: string | null;
  overview: string;
  phases: LearningPhase[];
  final_milestone: string;
};

export type LearnerStatus = "On Track" | "Ahead" | "Behind";

export type ProgressReport = {
  current_phase: number;
  overall_completion_percentage: number;
  completed_topics: string[];
  remaining_topics: string[];
  completed_milestones: string[];
  next_recommended_task: string;
  learner_status: LearnerStatus;
  summary: string;
};

export type FeedbackReport = {
  overall_performance_assessment: string;
  strengths: string[];
  areas_for_improvement: string[];
  personalized_study_recommendations: string[];
  motivation_message: string;
  next_study_session_focus: string;
};

export type NudgeLearnerStatus = LearnerStatus | "Inactive";
export type NudgeType =
  | "Reminder"
  | "Motivation"
  | "Congratulations"
  | "Warning"
  | "Study Suggestion";
export type NudgeUrgency = "Low" | "Medium" | "High";

export type NudgeReport = {
  intervention_required: boolean;
  learner_status: NudgeLearnerStatus;
  nudge_type: NudgeType;
  personalized_message: string;
  recommended_action: string;
  urgency: NudgeUrgency;
};

export type LearningSessionResponse = {
  learner_intent: LearnerIntent | null;
  learning_plan: LearningPlan | null;
  progress_report: ProgressReport | null;
  feedback_report: FeedbackReport | null;
  nudge_report: NudgeReport | null;
  intent?: LearnerIntent | null;
  progress?: ProgressReport | null;
  feedback?: FeedbackReport | null;
  nudges?: NudgeReport | null;
  workflow_completed: boolean;
  current_stage: string;
  error_message: string | null;
};

export type User = {
  id: number;
  name: string;
  email: string | null;
  created_at: string;
};

export type StoredLearnerIntent = {
  id: number;
  user_id: number;
  learning_goal: string;
  subject: string;
  current_skill_level: string;
  available_time: string;
  target_deadline: string;
  preferred_learning_style: string | null;
  created_at: string;
};

export type StoredLearningPlan = {
  id: number;
  user_id: number;
  title: string;
  plan_json: JsonObject;
  created_at: string;
};

export type StoredProgress = {
  id: number;
  user_id: number;
  topic: string;
  completion_percentage: number;
  completed: boolean;
  updated_at: string;
};

export type StoredFeedback = {
  id: number;
  user_id: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  created_at: string;
};

export type StoredNudge = {
  id: number;
  user_id: number;
  message: string;
  urgency: string;
  created_at: string;
};

export type LearningSessionApiResponse =
  ApiSuccessResponse<LearningSessionResponse>;
export type UserApiResponse = ApiSuccessResponse<User>;
export type LearnerIntentApiResponse = ApiSuccessResponse<StoredLearnerIntent>;
export type LearningPlanApiResponse = ApiSuccessResponse<StoredLearningPlan>;
export type ProgressApiResponse = ApiSuccessResponse<StoredProgress[]>;
export type FeedbackApiResponse = ApiSuccessResponse<StoredFeedback[]>;
export type NudgeApiResponse = ApiSuccessResponse<StoredNudge[]>;
