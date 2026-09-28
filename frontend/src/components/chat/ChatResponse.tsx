import {
  BookOpen,
  CheckCircle2,
  Clock,
  Lightbulb,
  MessageCircle,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";

import type { LearningSessionResponse } from "@/types/learning";

type ChatResponseProps = {
  response: LearningSessionResponse;
};

export function ChatResponse({ response }: ChatResponseProps) {
  const intent = response.learner_intent;
  const plan = response.learning_plan;
  const progress = response.progress_report;
  const feedback = response.feedback_report;
  const nudge = response.nudge_report;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        {response.workflow_completed
          ? "Learning workflow completed"
          : `Current stage: ${response.current_stage}`}
      </div>

      {intent ? (
        <ResponseCard
          icon={<Target className="h-5 w-5" aria-hidden="true" />}
          title="Learner Intent"
        >
          <DetailGrid>
            <DetailItem label="Learning Goal" value={intent.learning_goal} />
            <DetailItem label="Subject" value={intent.subject} />
            <DetailItem
              label="Current Skill Level"
              value={intent.current_skill_level}
            />
            <DetailItem label="Target Deadline" value={intent.target_deadline} />
            <DetailItem label="Available Time" value={intent.available_time} />
            <DetailItem
              label="Learning Style"
              value={intent.preferred_learning_style}
            />
          </DetailGrid>
        </ResponseCard>
      ) : null}

      {plan ? (
        <ResponseCard
          icon={<BookOpen className="h-5 w-5" aria-hidden="true" />}
          title="Learning Plan"
        >
          <DetailGrid>
            <DetailItem label="Learning Goal" value={plan.learning_goal} />
            <DetailItem label="Subject" value={plan.subject} />
            <DetailItem label="Current Skill Level" value={plan.learner_level} />
            <DetailItem label="Target Deadline" value={plan.target_deadline} />
          </DetailGrid>
          {plan.overview ? (
            <div className="mt-4 rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Overview
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {plan.overview}
              </p>
            </div>
          ) : null}
          {plan.phases.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {plan.phases.map((phase) => (
                <div
                  className="rounded-md border border-slate-200 p-4"
                  key={`${phase.phase_number}-${phase.title}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-950">
                      {phase.phase_number}. {phase.title}
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {phase.estimated_duration}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {phase.objective}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </ResponseCard>
      ) : null}

      {progress ? (
        <ResponseCard
          icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
          title="Progress Summary"
        >
          <p className="text-sm leading-6 text-slate-700">{progress.summary}</p>
          <DetailGrid>
            <DetailItem
              label="Completion"
              value={`${progress.overall_completion_percentage}%`}
            />
            <DetailItem label="Status" value={progress.learner_status} />
            <DetailItem
              label="Next Task"
              value={progress.next_recommended_task}
            />
          </DetailGrid>
        </ResponseCard>
      ) : null}

      {feedback ? (
        <ResponseCard
          icon={<Lightbulb className="h-5 w-5" aria-hidden="true" />}
          title="Latest Feedback"
        >
          <p className="text-sm leading-6 text-slate-700">
            {feedback.overall_performance_assessment}
          </p>
          <p className="mt-3 text-sm font-medium text-slate-950">
            {feedback.motivation_message}
          </p>
        </ResponseCard>
      ) : null}

      {nudge ? (
        <ResponseCard
          icon={<MessageCircle className="h-5 w-5" aria-hidden="true" />}
          title="Latest Nudge"
        >
          <p className="text-sm leading-6 text-slate-700">
            {nudge.personalized_message}
          </p>
          <DetailGrid>
            <DetailItem label="Urgency" value={nudge.urgency} />
            <DetailItem label="Recommended Action" value={nudge.recommended_action} />
          </DetailGrid>
        </ResponseCard>
      ) : null}
    </section>
  );
}

type ResponseCardProps = {
  children: ReactNode;
  icon: ReactNode;
  title: string;
};

function ResponseCard({ children, icon, title }: ResponseCardProps) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white">
          {icon}
        </span>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <Sparkles className="ml-auto h-4 w-4 text-slate-400" aria-hidden="true" />
      </div>
      {children}
    </article>
  );
}

type DetailGridProps = {
  children: ReactNode;
};

function DetailGrid({ children }: DetailGridProps) {
  return <dl className="mt-4 grid gap-3 sm:grid-cols-2">{children}</dl>;
}

type DetailItemProps = {
  label: string;
  value: string | number | null | undefined;
};

function DetailItem({ label, value }: DetailItemProps) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return (
    <div className="rounded-md bg-slate-50 p-3">
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}
