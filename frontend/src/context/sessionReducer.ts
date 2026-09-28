import type { SessionAction, SessionState } from "@/context/sessionTypes";
import type {
  FeedbackReport,
  LearnerIntent,
  LearningPlan,
  LearningSessionResponse,
  NudgeReport,
  ProgressReport,
} from "@/types/learning";

export const initialSessionState: SessionState = {
  user: null,
  intent: null,
  learningPlan: null,
  progress: null,
  feedback: null,
  nudges: null,
  workflowCompleted: false,
  currentStage: null,
  isLoading: false,
  error: null,
  completedTopics: {},
  calendar: {
    connected: false,
    connectionId: null,
  },
  generatedSchedule: [],
  upcomingStudySession: null,
};

export function sessionReducer(
  state: SessionState,
  action: SessionAction
): SessionState {
  switch (action.type) {
    case "SESSION_LOADING":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "SESSION_SUCCESS":
      return {
        user: action.payload.user ?? state.user,
        intent: getWorkflowField<LearnerIntent>(
          action.payload.workflow,
          "learner_intent",
          "intent"
        ),
        learningPlan: getWorkflowLearningPlan(action.payload.workflow),
        progress: getWorkflowField<ProgressReport>(
          action.payload.workflow,
          "progress_report",
          "progress"
        ),
        feedback: getWorkflowField<FeedbackReport>(
          action.payload.workflow,
          "feedback_report",
          "feedback"
        ),
        nudges: getWorkflowField<NudgeReport>(
          action.payload.workflow,
          "nudge_report",
          "nudges"
        ),
        workflowCompleted: action.payload.workflow.workflow_completed,
        currentStage: action.payload.workflow.current_stage,
        isLoading: false,
        error: action.payload.workflow.error_message,
        completedTopics: {},
        calendar: state.calendar,
        generatedSchedule: state.generatedSchedule,
        upcomingStudySession: state.upcomingStudySession,
      };
    case "SESSION_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case "SESSION_RESTORE":
      return {
        ...action.payload,
        isLoading: false,
      };
    case "TOPIC_COMPLETION_TOGGLE":
      return updateTopicCompletion(state, action.payload);
    case "CALENDAR_CONNECTED":
      return {
        ...state,
        calendar: action.payload,
      };
    case "SCHEDULE_GENERATED":
      return {
        ...state,
        generatedSchedule: action.payload,
      };
    case "SCHEDULE_CREATED":
      return {
        ...state,
        generatedSchedule: [],
        upcomingStudySession: action.payload[0] ?? null,
      };
    case "SESSION_CLEAR":
      return initialSessionState;
    default:
      return state;
  }
}

function updateTopicCompletion(
  state: SessionState,
  payload: {
    phaseNumber: number;
    topic: string;
    completed: boolean;
  }
): SessionState {
  if (!state.learningPlan || !state.progress) {
    return state;
  }

  const topicKey = getTopicKey(payload.phaseNumber, payload.topic);
  const completedTopics = {
    ...state.completedTopics,
    [topicKey]: payload.completed,
  };
  const allTopics = state.learningPlan.phases.flatMap((phase) =>
    phase.recommended_topics.map((topic) => ({
      phaseNumber: phase.phase_number,
      topic,
    }))
  );
  const completedTopicNames = allTopics
    .filter((item) => completedTopics[getTopicKey(item.phaseNumber, item.topic)])
    .map((item) => item.topic);
  const remainingTopicNames = allTopics
    .filter((item) => !completedTopics[getTopicKey(item.phaseNumber, item.topic)])
    .map((item) => item.topic);
  const completedCount = completedTopicNames.length;
  const totalCount = allTopics.length;
  const overallCompletionPercentage =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const currentPhase =
    allTopics.find((item) => !completedTopics[getTopicKey(item.phaseNumber, item.topic)])
      ?.phaseNumber ?? state.learningPlan.phases.at(-1)?.phase_number ?? state.progress.current_phase;
  const nextRecommendedTask = remainingTopicNames[0]
    ? `Continue ${remainingTopicNames[0]}`
    : `Complete final milestone: ${state.learningPlan.final_milestone}`;

  return {
    ...state,
    completedTopics,
    progress: {
      ...state.progress,
      current_phase: currentPhase,
      overall_completion_percentage: overallCompletionPercentage,
      completed_topics: completedTopicNames,
      remaining_topics: remainingTopicNames,
      next_recommended_task: nextRecommendedTask,
      learner_status: overallCompletionPercentage >= 80 ? "Ahead" : "On Track",
      summary:
        completedCount === 0
          ? state.progress.summary
          : `${completedCount} of ${totalCount} roadmap topics completed.`,
    },
  };
}

function getTopicKey(phaseNumber: number, topic: string): string {
  return `${phaseNumber}:${topic.trim().toLowerCase()}`;
}

function getWorkflowLearningPlan(
  workflow: LearningSessionResponse
): LearningPlan | null {
  const workflowRecord = workflow as LearningSessionResponse &
    Record<string, unknown>;
  const directPlan = workflow.learning_plan;
  const camelPlan = workflowRecord.learningPlan;
  const genericPlan = workflowRecord.plan;

  if (isLearningPlan(directPlan)) {
    return directPlan;
  }
  if (isLearningPlan(camelPlan)) {
    return camelPlan;
  }
  if (isLearningPlan(genericPlan)) {
    return genericPlan;
  }
  if (isRecord(genericPlan) && isLearningPlan(genericPlan.plan_json)) {
    return genericPlan.plan_json;
  }

  return null;
}

function getWorkflowField<T>(
  workflow: LearningSessionResponse,
  key: "learner_intent" | "progress_report" | "feedback_report" | "nudge_report",
  alias: "intent" | "progress" | "feedback" | "nudges"
): T | null {
  const record = workflow as LearningSessionResponse & Record<string, unknown>;
  return (workflow[key] ?? record[alias] ?? null) as T | null;
}

function isLearningPlan(value: unknown): value is LearningPlan {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.learning_goal === "string" &&
    typeof value.subject === "string" &&
    typeof value.learner_level === "string" &&
    typeof value.total_available_time === "string" &&
    typeof value.target_deadline === "string" &&
    typeof value.overview === "string" &&
    Array.isArray(value.phases) &&
    typeof value.final_milestone === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
