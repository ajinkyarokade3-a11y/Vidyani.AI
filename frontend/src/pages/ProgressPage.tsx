import { Layers3 } from "lucide-react";

import { EmptyProgress } from "@/components/progress/EmptyProgress";
import {
  EstimatedCompletionCard,
  type CompletionEstimate,
} from "@/components/progress/EstimatedCompletionCard";
import { NextActionCard } from "@/components/progress/NextActionCard";
import { ProgressCards } from "@/components/progress/ProgressCards";
import { ProgressHeader } from "@/components/progress/ProgressHeader";
import { ProgressOverview } from "@/components/progress/ProgressOverview";
import {
  ProgressTimeline,
  type ProgressTimelineEntry,
} from "@/components/progress/ProgressTimeline";
import { useSession } from "@/context/SessionContext";
import type { LearningPlan, ProgressReport } from "@/types/learning";

export function ProgressPage() {
  const { state } = useSession();
  const progress = state.progress;

  if (!progress) {
    return <EmptyProgress />;
  }

  const goal =
    state.intent?.learning_goal ?? state.learningPlan?.learning_goal ?? null;
  const subject = state.intent?.subject ?? state.learningPlan?.subject ?? null;
  const timelineEntries = buildTimelineEntries(progress, state.learningPlan);
  const remainingMilestonesCount = getRemainingMilestonesCount(
    progress,
    state.learningPlan
  );
  const estimate = buildCompletionEstimate({
    completedTopics: progress.completed_topics.length,
    plan: state.learningPlan,
    targetDeadline:
      state.intent?.target_deadline ??
      state.learningPlan?.target_deadline ??
      null,
    totalTopics:
      state.learningPlan?.phases.reduce(
        (total, phase) => total + phase.recommended_topics.length,
        0
      ) ??
      progress.completed_topics.length + progress.remaining_topics.length,
    userCreatedAt: state.user?.created_at ?? null,
  });

  return (
    <div className="space-y-5">
      <ProgressHeader
        currentStage={state.currentStage}
        goal={goal}
        subject={subject}
        workflowCompleted={state.workflowCompleted}
      />

      <EstimatedCompletionCard estimate={estimate} />

      <div className="grid items-stretch gap-5 lg:grid-cols-12">
        <main className="flex min-w-0 flex-col gap-5 lg:col-span-8">
          <ProgressOverview
            completionPercentage={progress.overall_completion_percentage}
            currentPhase={progress.current_phase}
            learnerStatus={progress.learner_status}
            summary={progress.summary}
          />
          <ProgressCards
            completedMilestonesCount={progress.completed_milestones.length}
            completionPercentage={progress.overall_completion_percentage}
            currentPhase={progress.current_phase}
            estimatedTimeRemaining={null}
            remainingMilestonesCount={remainingMilestonesCount}
          />
          <ProgressTimeline entries={timelineEntries} />
        </main>

        <aside className="flex min-w-0 flex-col gap-5 lg:col-span-4">
          <NextActionCard nextAction={progress.next_recommended_task} />
          <TopicCard
            completedTopics={progress.completed_topics}
            remainingTopics={progress.remaining_topics}
          />
        </aside>
      </div>
    </div>
  );
}

type CompletionEstimateInput = {
  completedTopics: number;
  plan: LearningPlan | null;
  targetDeadline: string | null;
  totalTopics: number;
  userCreatedAt: string | null;
};

function buildCompletionEstimate({
  completedTopics,
  plan,
  targetDeadline,
  totalTopics,
  userCreatedAt,
}: CompletionEstimateInput): CompletionEstimate {
  const today = startOfDay(new Date());
  const targetDate = parseDate(targetDeadline);
  const startDate =
    parseDate(plan?.phases[0]?.start_date ?? null) ??
    parseDate(userCreatedAt);
  const daysRemaining = targetDate
    ? Math.ceil((targetDate.getTime() - today.getTime()) / 86_400_000)
    : null;

  if (!targetDate || !startDate || totalTopics <= 0 || completedTopics < 2) {
    return {
      daysRemaining,
      estimatedCompletionDate: null,
      message:
        "Complete a few more topics to estimate your completion date.",
      status:
        targetDate && daysRemaining !== null && daysRemaining < 0
          ? "Behind Schedule"
          : null,
      targetDate,
    };
  }

  if (completedTopics >= totalTopics) {
    return {
      daysRemaining,
      estimatedCompletionDate: today,
      message: "All roadmap topics are complete.",
      status: today <= targetDate ? "On Track" : "Behind Schedule",
      targetDate,
    };
  }

  const elapsedDays = Math.max(
    1,
    Math.ceil((today.getTime() - startDate.getTime()) / 86_400_000)
  );
  const topicsPerDay = completedTopics / elapsedDays;
  if (!Number.isFinite(topicsPerDay) || topicsPerDay <= 0) {
    return {
      daysRemaining,
      estimatedCompletionDate: null,
      message:
        "Complete a few more topics to estimate your completion date.",
      status: null,
      targetDate,
    };
  }

  const remainingTopics = totalTopics - completedTopics;
  const projectedDays = Math.ceil(remainingTopics / topicsPerDay);
  const estimatedCompletionDate = new Date(today);
  estimatedCompletionDate.setDate(today.getDate() + projectedDays);

  return {
    daysRemaining,
    estimatedCompletionDate,
    message: `Based on ${completedTopics} completed topics over ${elapsedDays} ${
      elapsedDays === 1 ? "day" : "days"
    }.`,
    status:
      estimatedCompletionDate <= targetDate
        ? "On Track"
        : "Behind Schedule",
    targetDate,
  };
}

function parseDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
}

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function buildTimelineEntries(
  progress: ProgressReport,
  plan: LearningPlan | null
): ProgressTimelineEntry[] {
  const completedEntries = progress.completed_topics.map((topic) => ({
    label: `Completed ${topic}`,
    status: "completed" as const,
  }));

  const currentTopic = progress.remaining_topics[0];
  const currentEntry = currentTopic
    ? [
        {
          label: `Currently studying ${currentTopic}`,
          status: "current" as const,
        },
      ]
    : [];

  const upcomingEntries = progress.remaining_topics.slice(1, 5).map((topic) => ({
    label: `Upcoming: ${topic}`,
    status: "upcoming" as const,
  }));

  if (completedEntries.length || currentEntry.length || upcomingEntries.length) {
    return [...completedEntries, ...currentEntry, ...upcomingEntries];
  }

  if (!plan) {
    return [];
  }

  return plan.phases
    .filter((phase) => phase.phase_number >= progress.current_phase)
    .slice(0, 4)
    .map((phase, index) => ({
      label:
        index === 0
          ? `Currently studying ${phase.title}`
          : `Upcoming: ${phase.title}`,
      status: index === 0 ? "current" : "upcoming",
    }));
}

function getRemainingMilestonesCount(
  progress: ProgressReport,
  plan: LearningPlan | null
) {
  if (!plan) {
    return null;
  }

  const allMilestones = plan.phases.flatMap((phase) => phase.milestones);
  const completedMilestones = new Set(
    progress.completed_milestones.map((milestone) => milestone.toLowerCase())
  );
  const remainingMilestones = allMilestones.filter(
    (milestone) => !completedMilestones.has(milestone.toLowerCase())
  );

  return remainingMilestones.length;
}

type TopicCardProps = {
  completedTopics: string[];
  remainingTopics: string[];
};

function TopicCard({ completedTopics, remainingTopics }: TopicCardProps) {
  if (completedTopics.length === 0 && remainingTopics.length === 0) {
    return null;
  }

  return (
    <section className="glass-panel flex flex-1 flex-col rounded-[24px] p-5 transition hover:-translate-y-0.5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-violet-500 text-white">
          <Layers3 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">
            Roadmap Coverage
          </p>
          <h2 className="mt-0.5 text-base font-bold text-slate-950">Topics</h2>
        </div>
      </div>
      {completedTopics.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Completed
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {completedTopics.map((topic) => (
              <span
                className="rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700"
                key={topic}
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {remainingTopics.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Remaining
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {remainingTopics.slice(0, 8).map((topic) => (
              <span
                className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700"
                key={topic}
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
