import { useMutation, useQuery } from "@tanstack/react-query";

import {
  getFeedback,
  getLatestIntent,
  getLearningPlan,
  getNudges,
  getProgress,
  getUser,
  startLearningSession,
} from "@/api/learningApi";
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

export const learningQueryKeys = {
  user: (userId: number) => ["user", userId] as const,
  intent: (userId: number) => ["user", userId, "intent"] as const,
  plan: (userId: number) => ["user", userId, "plan"] as const,
  progress: (userId: number) => ["user", userId, "progress"] as const,
  feedback: (userId: number) => ["user", userId, "feedback"] as const,
  nudges: (userId: number) => ["user", userId, "nudges"] as const,
};

export function useStartLearningSession() {
  return useMutation<
    LearningSessionApiResponse,
    Error,
    LearningSessionRequest
  >({
    mutationFn: startLearningSession,
  });
}

export function useUser(userId: number | null, enabled = true) {
  const resolvedUserId = userId ?? 0;

  return useQuery<UserApiResponse, Error>({
    queryKey: learningQueryKeys.user(resolvedUserId),
    queryFn: () => getUser(resolvedUserId),
    enabled: enabled && resolvedUserId > 0,
  });
}

export function useLatestIntent(userId: number | null, enabled = true) {
  const resolvedUserId = userId ?? 0;

  return useQuery<LearnerIntentApiResponse, Error>({
    queryKey: learningQueryKeys.intent(resolvedUserId),
    queryFn: () => getLatestIntent(resolvedUserId),
    enabled: enabled && resolvedUserId > 0,
  });
}

export function useLearningPlan(userId: number | null, enabled = true) {
  const resolvedUserId = userId ?? 0;

  return useQuery<LearningPlanApiResponse, Error>({
    queryKey: learningQueryKeys.plan(resolvedUserId),
    queryFn: () => getLearningPlan(resolvedUserId),
    enabled: enabled && resolvedUserId > 0,
  });
}

export function useProgress(userId: number | null, enabled = true) {
  const resolvedUserId = userId ?? 0;

  return useQuery<ProgressApiResponse, Error>({
    queryKey: learningQueryKeys.progress(resolvedUserId),
    queryFn: () => getProgress(resolvedUserId),
    enabled: enabled && resolvedUserId > 0,
  });
}

export function useFeedback(userId: number | null, enabled = true) {
  const resolvedUserId = userId ?? 0;

  return useQuery<FeedbackApiResponse, Error>({
    queryKey: learningQueryKeys.feedback(resolvedUserId),
    queryFn: () => getFeedback(resolvedUserId),
    enabled: enabled && resolvedUserId > 0,
  });
}

export function useNudges(userId: number | null, enabled = true) {
  const resolvedUserId = userId ?? 0;

  return useQuery<NudgeApiResponse, Error>({
    queryKey: learningQueryKeys.nudges(resolvedUserId),
    queryFn: () => getNudges(resolvedUserId),
    enabled: enabled && resolvedUserId > 0,
  });
}
