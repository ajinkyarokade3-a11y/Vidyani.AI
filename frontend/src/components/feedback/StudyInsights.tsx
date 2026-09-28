import { BarChart3 } from "lucide-react";

type StudyInsightsProps = {
  completionPercentage: number | null;
  currentGoal: string | null;
  currentPhase: number | null;
  progressStatus: string | null;
  recommendedFocus: string | null;
};

export function StudyInsights({
  completionPercentage,
  currentGoal,
  currentPhase,
  progressStatus,
  recommendedFocus,
}: StudyInsightsProps) {
  const insights = [
    { label: "Current Goal", value: currentGoal },
    {
      label: "Current Phase",
      value: currentPhase == null ? null : `Phase ${currentPhase}`,
    },
    { label: "Progress Status", value: progressStatus },
    {
      label: "Completion",
      value:
        completionPercentage == null ? null : `${completionPercentage}% complete`,
    },
    { label: "Recommended Focus", value: recommendedFocus },
  ].filter((item) => item.value);

  if (insights.length === 0) {
    return null;
  }

  return (
    <section className="metric-card h-full p-5 transition hover:-translate-y-0.5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="blue-pill inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white">
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-base font-black text-slate-950">Study Insights</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {insights.map((item) => (
          <div className="glass-control rounded-[18px] p-3" key={item.label}>
            <p className="text-xs font-black uppercase text-slate-400">
              {item.label}
            </p>
            <p className="mt-1 text-sm font-black leading-6 text-slate-950">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
