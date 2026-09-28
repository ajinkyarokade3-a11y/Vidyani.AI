import { TrendingUp } from "lucide-react";

type ProgressSummaryCardProps = {
  completedTopics: number;
  percentage: number;
  summary: string | null;
  totalTopics: number;
};

export function ProgressSummaryCard({
  completedTopics,
  percentage,
  summary,
  totalTopics,
}: ProgressSummaryCardProps) {
  const normalizedPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <section className="glass-panel rounded-[26px] p-5 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,420px)] lg:items-center">
        <div className="flex items-start gap-3">
          <span className="blue-pill flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-black text-slate-950">Progress Summary</h2>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
              {summary ??
                `${completedTopics} of ${totalTopics} roadmap topics completed.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="w-12 text-right text-lg font-black text-slate-950">
            {normalizedPercentage}%
          </span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div
              className="blue-pill h-full rounded-full"
              style={{ width: `${normalizedPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
