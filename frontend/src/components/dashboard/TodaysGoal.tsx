import { ArrowRight, Clock3, Target } from "lucide-react";
import { Link } from "react-router-dom";

type TodaysGoalProps = {
  estimatedMinutes: number;
  progress: number;
  task: string | null;
};

export function TodaysGoal({
  estimatedMinutes,
  progress,
  task,
}: TodaysGoalProps) {
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <section className="metric-card flex h-full min-h-72 flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-black text-slate-950">Today&apos;s Goal</h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Recommended next step
          </p>
        </div>
        <span className="blue-pill flex h-10 w-10 items-center justify-center rounded-full text-white">
          <Target className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-6 flex flex-1 flex-col items-center text-center">
        <div
          className="grid h-32 w-32 place-items-center rounded-full"
          style={{
            background: `conic-gradient(#4058ff ${normalizedProgress * 3.6}deg, #e3e6ef 0deg)`,
          }}
        >
          <div className="grid h-24 w-24 place-items-center rounded-full bg-white shadow-inner">
            <span className="text-2xl font-black text-slate-950">
              {normalizedProgress}%
            </span>
          </div>
        </div>

        <p className="mt-5 text-base font-black leading-6 text-slate-950">
          {task ?? "Your next roadmap task will appear here."}
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-500">
          <Clock3 className="h-4 w-4 text-blue-600" aria-hidden="true" />
          {estimatedMinutes} min estimated
        </div>
      </div>

      <Link
        className="blue-pill mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-black text-white"
        to="/learning-plan"
      >
        Continue Learning
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}
