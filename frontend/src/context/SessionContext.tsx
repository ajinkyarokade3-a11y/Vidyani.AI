/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import {
  initialSessionState,
  sessionReducer,
} from "@/context/sessionReducer";
import type {
  SessionContextValue,
  SessionState,
} from "@/context/sessionTypes";
import type { CalendarConnection, StudyScheduleEvent } from "@/types/calendar";
import type { LearningPlan, LearningSessionResponse, User } from "@/types/learning";

const SESSION_STORAGE_KEY = "ai-learning-agent-session";

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined
);

type SessionProviderProps = {
  children: ReactNode;
};

export function SessionProvider({ children }: SessionProviderProps) {
  const [state, dispatch] = useReducer(
    sessionReducer,
    initialSessionState,
    loadStoredSession
  );

  useEffect(() => {
    if (isEmptySession(state)) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const saveWorkflow = useCallback(
    (workflow: LearningSessionResponse, user?: User | null) => {
      dispatch({
        type: "SESSION_SUCCESS",
        payload: { workflow, user },
      });
    },
    []
  );

  const setLoading = useCallback(() => {
    dispatch({ type: "SESSION_LOADING" });
  }, []);

  const setError = useCallback((message: string) => {
    dispatch({ type: "SESSION_ERROR", payload: message });
  }, []);

  const toggleTopicCompletion = useCallback(
    (phaseNumber: number, topic: string, completed: boolean) => {
      dispatch({
        type: "TOPIC_COMPLETION_TOGGLE",
        payload: { phaseNumber, topic, completed },
      });
    },
    []
  );

  const clearSession = useCallback(() => {
    dispatch({ type: "SESSION_CLEAR" });
  }, []);

  const connectCalendar = useCallback((connection: CalendarConnection) => {
    dispatch({ type: "CALENDAR_CONNECTED", payload: connection });
  }, []);

  const saveGeneratedSchedule = useCallback((schedule: StudyScheduleEvent[]) => {
    dispatch({ type: "SCHEDULE_GENERATED", payload: schedule });
  }, []);

  const markScheduleCreated = useCallback((schedule: StudyScheduleEvent[]) => {
    dispatch({ type: "SCHEDULE_CREATED", payload: schedule });
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      state,
      dispatch,
      saveWorkflow,
      setLoading,
      setError,
      toggleTopicCompletion,
      clearSession,
      connectCalendar,
      saveGeneratedSchedule,
      markScheduleCreated,
    }),
    [
      clearSession,
      connectCalendar,
      markScheduleCreated,
      saveGeneratedSchedule,
      saveWorkflow,
      setError,
      setLoading,
      state,
      toggleTopicCompletion,
    ]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider.");
  }
  return context;
}

function loadStoredSession(): SessionState {
  const storedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!storedSession) {
    return initialSessionState;
  }

  try {
    const parsedSession: unknown = JSON.parse(storedSession);
    const normalizedSession = normalizeStoredSession(parsedSession);
    if (!normalizedSession) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return initialSessionState;
    }

    return {
      ...normalizedSession,
      isLoading: false,
    };
  } catch {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return initialSessionState;
  }
}

function normalizeStoredSession(value: unknown): SessionState | null {
  if (!isRecord(value)) {
    return null;
  }

  const candidate = {
    ...value,
    intent: value.intent ?? value.learner_intent ?? null,
    learningPlan: getStoredLearningPlan(value),
    progress: value.progress ?? value.progress_report ?? null,
    feedback: value.feedback ?? value.feedback_report ?? null,
    nudges: value.nudges ?? value.nudge_report ?? null,
    completedTopics: isCompletedTopics(value.completedTopics)
      ? value.completedTopics
      : {},
    calendar: isCalendarConnection(value.calendar)
      ? value.calendar
      : { connected: false, connectionId: null },
    generatedSchedule: Array.isArray(value.generatedSchedule)
      ? value.generatedSchedule.filter(isStudyScheduleEvent)
      : [],
    upcomingStudySession: isStudyScheduleEvent(value.upcomingStudySession)
      ? value.upcomingStudySession
      : null,
  };

  if (!isValidSessionState(candidate)) {
    return null;
  }

  return candidate;
}

function getStoredLearningPlan(value: Record<string, unknown>): LearningPlan | null {
  const camelPlan = value.learningPlan;
  const snakePlan = value.learning_plan;
  const genericPlan = value.plan;

  if (isLearningPlan(camelPlan)) {
    return camelPlan;
  }
  if (isLearningPlan(snakePlan)) {
    return snakePlan;
  }
  if (isLearningPlan(genericPlan)) {
    return genericPlan;
  }
  if (isRecord(genericPlan) && isLearningPlan(genericPlan.plan_json)) {
    return genericPlan.plan_json;
  }

  return null;
}

function isValidSessionState(value: unknown): value is SessionState {
  if (!isRecord(value)) {
    return false;
  }

  return (
    "user" in value &&
    "intent" in value &&
    "learningPlan" in value &&
    "progress" in value &&
    "feedback" in value &&
    "nudges" in value &&
    "completedTopics" in value &&
    isCompletedTopics(value.completedTopics) &&
    "calendar" in value &&
    isCalendarConnection(value.calendar) &&
    "generatedSchedule" in value &&
    Array.isArray(value.generatedSchedule) &&
    value.generatedSchedule.every(isStudyScheduleEvent) &&
    "upcomingStudySession" in value &&
    (value.upcomingStudySession === null ||
      isStudyScheduleEvent(value.upcomingStudySession)) &&
    typeof value.workflowCompleted === "boolean" &&
    (typeof value.currentStage === "string" || value.currentStage === null) &&
    typeof value.isLoading === "boolean" &&
    (typeof value.error === "string" || value.error === null)
  );
}

function isCalendarConnection(value: unknown): value is CalendarConnection {
  return (
    isRecord(value) &&
    typeof value.connected === "boolean" &&
    (typeof value.connectionId === "string" || value.connectionId === null)
  );
}

function isStudyScheduleEvent(value: unknown): value is StudyScheduleEvent {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    typeof value.start === "string" &&
    typeof value.end === "string" &&
    typeof value.topic === "string" &&
    typeof value.phase === "string" &&
    typeof value.durationMinutes === "number" &&
    typeof value.description === "string"
  );
}

function isCompletedTopics(value: unknown): value is Record<string, boolean> {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every((item) => typeof item === "boolean");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

function isEmptySession(state: SessionState): boolean {
  return (
    state.user === null &&
    state.intent === null &&
    state.learningPlan === null &&
    state.progress === null &&
    state.feedback === null &&
    state.nudges === null &&
    Object.keys(state.completedTopics).length === 0 &&
    state.calendar.connected === false &&
    state.generatedSchedule.length === 0 &&
    state.upcomingStudySession === null &&
    state.workflowCompleted === false &&
    state.currentStage === null &&
    state.error === null
  );
}
