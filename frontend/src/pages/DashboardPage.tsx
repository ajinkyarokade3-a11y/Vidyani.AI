import { ArrowRight, Inbox } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { connectCalendar, createCalendarEvents } from "@/api/calendarApi";
import { ConnectCalendarCard } from "@/components/calendar/ConnectCalendarCard";
import { SchedulePreview } from "@/components/calendar/SchedulePreview";
import { FeedbackCard } from "@/components/dashboard/FeedbackCard";
import { InterviewAnalytics } from "@/components/dashboard/InterviewAnalytics";
import { NudgeCard } from "@/components/dashboard/NudgeCard";
import { ProgressSummaryCard } from "@/components/dashboard/ProgressSummaryCard";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { TodaysGoal } from "@/components/dashboard/TodaysGoal";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { WeeklyActivity } from "@/components/dashboard/WeeklyActivity";
import { useSession } from "@/context/SessionContext";
import {
  generateStudySchedule,
  parseDailyStudyHours,
} from "@/services/calendarService";
import type { GoogleCodeResponse } from "@/types/googleIdentity";

export function DashboardPage() {
  const {
    connectCalendar: saveCalendarConnection,
    markScheduleCreated,
    saveGeneratedSchedule,
    state,
  } = useSession();
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [isCalendarBusy, setIsCalendarBusy] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const hasActiveSession =
    state.intent !== null ||
    state.learningPlan !== null ||
    state.progress !== null ||
    state.feedback !== null ||
    state.nudges !== null ||
    state.currentStage !== null;

  if (!hasActiveSession) {
    return <EmptyDashboardState />;
  }

  const learningGoal =
    state.intent?.learning_goal ?? state.learningPlan?.learning_goal ?? null;
  const subject = state.intent?.subject ?? state.learningPlan?.subject ?? null;
  const topics =
    state.learningPlan?.phases.flatMap((phase) => phase.recommended_topics) ?? [];
  const completedTopics = Math.max(
    Object.values(state.completedTopics).filter(Boolean).length,
    state.progress?.completed_topics.length ?? 0
  );
  const progressPercentage =
    state.progress?.overall_completion_percentage ??
    (topics.length === 0
      ? 0
      : Math.round((completedTopics / topics.length) * 100));
  const todaysTask =
    state.progress?.next_recommended_task ??
    state.progress?.remaining_topics[0] ??
    topics.find((topic) => !state.progress?.completed_topics.includes(topic)) ??
    null;
  const estimatedMinutes = Math.min(
    Math.max(
      Math.round(
        parseDailyStudyHours(
          state.intent?.available_time ??
            state.learningPlan?.total_available_time
        ) * 60
      ),
      30
    ),
    120
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-5">
        <WelcomeCard
          learnerName={state.user?.name ?? null}
          learningGoal={learningGoal}
          subject={subject}
        />

        <QuickStats
          completedTopics={completedTopics}
          totalTopics={topics.length}
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <InterviewAnalytics />
          <WeeklyActivity />
        </div>

        <div className="grid items-stretch gap-5 md:grid-cols-2">
          <FeedbackCard feedback={state.feedback} />
          <NudgeCard nudge={state.nudges} />
        </div>

        <ProgressSummaryCard
          completedTopics={completedTopics}
          percentage={progressPercentage}
          summary={state.progress?.summary ?? null}
          totalTopics={topics.length}
        />
      </div>

      <aside className="space-y-5">
        <TodaysGoal
          estimatedMinutes={estimatedMinutes}
          progress={progressPercentage}
          task={todaysTask}
        />
        <div>
          <ConnectCalendarCard
            connected={state.calendar.connected}
            disabled={!state.learningPlan}
            isBusy={isCalendarBusy}
            onConnect={() => {
              void handleConnectCalendar();
            }}
            onGenerateSchedule={handleGenerateSchedule}
            upcomingStudySession={state.upcomingStudySession}
          />
          {calendarError ? (
            <p className="liquid-danger mt-3 rounded-[18px] p-3 text-sm font-bold text-white">
              {calendarError}
            </p>
          ) : null}
        </div>
      </aside>

      {isPreviewOpen ? (
        <SchedulePreview
          events={state.generatedSchedule}
          isCreating={isCalendarBusy}
          onCancel={() => setIsPreviewOpen(false)}
          onCreate={() => {
            void handleCreateCalendarEvents();
          }}
        />
      ) : null}
    </div>
  );

  async function handleConnectCalendar() {
    setCalendarError(null);
    setIsCalendarBusy(true);
    try {
      const code = await requestGoogleAuthorizationCode();
      const response = await connectCalendar(code);
      saveCalendarConnection({
        connected: response.data.connected,
        connectionId: response.data.connection_id,
      });
    } catch (error) {
      setCalendarError(
        error instanceof Error
          ? error.message
          : "Unable to connect Google Calendar."
      );
    } finally {
      setIsCalendarBusy(false);
    }
  }

  function handleGenerateSchedule() {
    if (!state.learningPlan) {
      setCalendarError("Generate a learning plan before scheduling sessions.");
      return;
    }

    const schedule = generateStudySchedule(state.learningPlan, {
      dailyStudyHours: parseDailyStudyHours(
        state.intent?.available_time ?? state.learningPlan.total_available_time
      ),
      learningGoal: learningGoal ?? state.learningPlan.learning_goal,
    });
    saveGeneratedSchedule(schedule);
    setIsPreviewOpen(true);
  }

  async function handleCreateCalendarEvents() {
    const connectionId = state.calendar.connectionId;
    if (!connectionId) {
      setCalendarError("Connect Google Calendar before creating events.");
      return;
    }

    setCalendarError(null);
    setIsCalendarBusy(true);
    try {
      await createCalendarEvents(connectionId, state.generatedSchedule);
      markScheduleCreated(state.generatedSchedule);
      setIsPreviewOpen(false);
    } catch (error) {
      setCalendarError(
        error instanceof Error
          ? error.message
          : "Unable to create Google Calendar events."
      );
    } finally {
      setIsCalendarBusy(false);
    }
  }

  async function requestGoogleAuthorizationCode(): Promise<string> {
    const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)
      ?.trim();
    if (!clientId) {
      throw new Error("Google Calendar client ID is not configured.");
    }

    await loadGoogleIdentityServices();

    return new Promise((resolve, reject) => {
      const codeClient = window.google?.accounts?.oauth2?.initCodeClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/calendar.events",
        ux_mode: "popup",
        callback: (response: GoogleCodeResponse) => {
          if (response.error) {
            reject(new Error("Google authorization was cancelled or failed."));
            return;
          }
          if (!response.code) {
            reject(new Error("Google authorization did not return a code."));
            return;
          }
          resolve(response.code);
        },
      });

      if (!codeClient) {
        reject(new Error("Google Identity Services failed to initialize."));
        return;
      }

      codeClient.requestCode();
    });
  }
}

function loadGoogleIdentityServices(): Promise<void> {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      "script[data-google-identity-services]"
    );
    if (existingScript) {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }

      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Unable to load Google Identity Services.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentityServices = "true";
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Unable to load Google Identity Services."));
    document.head.appendChild(script);
  });
}

function EmptyDashboardState() {
  return (
    <section className="glass-panel mx-auto flex max-w-2xl flex-col items-center rounded-[28px] p-8 text-center">
      <div className="glass-control mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full text-slate-700">
        <Inbox className="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-black tracking-normal text-slate-950">
        No active learning session yet
      </h1>
      <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
        Generate a learning plan from the chat page, then come back here to see
        your goal, progress, feedback, and nudges in one place.
      </p>
      <Link
        className="blue-pill mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black text-white"
        to="/chat"
      >
        Start in Chat
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}
