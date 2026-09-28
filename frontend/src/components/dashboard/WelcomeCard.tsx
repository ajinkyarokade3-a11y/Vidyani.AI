import { ArrowRight, BookOpenCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

type WelcomeCardProps = {
  learnerName: string | null;
  learningGoal: string | null;
  subject: string | null;
};

export function WelcomeCard({
  learnerName,
  learningGoal,
  subject,
}: WelcomeCardProps) {
  return (
    <section className="glass-panel rounded-[26px] p-5 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <div className="glass-control mb-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black text-blue-600">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Active learning workspace
          </div>
          <p className="text-sm font-bold text-slate-500">
            Welcome{learnerName ? `, ${learnerName}` : ""}
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">
            Your personal learning report
          </h2>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
            {learningGoal ??
              "Build a roadmap from chat, then track study goals, feedback, nudges, and schedules here."}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
          <Link
            className="blue-pill inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-black text-white"
            to="/learning-plan"
          >
            Learning Plan
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            className="glass-control inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-black text-slate-800"
            to="/progress"
          >
            Progress
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {subject ? (
        <div className="glass-control mt-5 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-slate-700">
          <BookOpenCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />
          {subject}
        </div>
      ) : null}
    </section>
  );
}
