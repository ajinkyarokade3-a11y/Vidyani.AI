import { Activity } from "lucide-react";

type ProgressOverviewProps = {
  completionPercentage: number;
  currentPhase: number;
  learnerStatus: string;
  summary: string;
};

export function ProgressOverview({
  completionPercentage,
  currentPhase,
  learnerStatus,
  summary,
}: ProgressOverviewProps) {
  const boundedCompletion = Math.min(Math.max(completionPercentage, 0), 100);

  return (
    <section className="glass-panel rounded-[24px] p-5 transition hover:-translate-y-0.5 sm:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-violet-500 text-white">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-slate-500">
            Progress Summary
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-normal text-slate-950">
            Phase {currentPhase} - {learnerStatus}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {summary}
          </p>
        </div>
        <div className="blue-pill min-w-36 rounded-[18px] p-4 text-white">
          <p className="text-xs font-semibold uppercase text-slate-300">
            Completion
          </p>
          <p className="mt-2 text-3xl font-bold">{boundedCompletion}%</p>
        </div>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
          style={{ width: `${boundedCompletion}%` }}
        />
      </div>
    </section>
  );
}
