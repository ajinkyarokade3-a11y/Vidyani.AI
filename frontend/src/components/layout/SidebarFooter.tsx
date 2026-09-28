import { useSession } from "@/context/SessionContext";

export function SidebarFooter() {
  const { state } = useSession();
  const goal =
    state.intent?.learning_goal ?? state.learningPlan?.learning_goal ?? null;
  const progress = state.progress?.overall_completion_percentage ?? 0;
  const targetDate =
    state.intent?.target_deadline ?? state.learningPlan?.target_deadline ?? null;

  return (
    <footer className="mt-auto pt-5">
      <div className="rounded-[22px] bg-slate-950 p-4 text-white shadow-[0_18px_34px_rgba(15,23,42,0.18)]">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Current Goal
        </p>
        <p className="mt-2 line-clamp-3 text-sm font-bold leading-5 text-white">
          {goal ?? "No active roadmap"}
        </p>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-violet-400"
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Target Completion
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-200">
            {targetDate ?? "Not set"}
          </p>
        </div>

      </div>
    </footer>
  );
}
