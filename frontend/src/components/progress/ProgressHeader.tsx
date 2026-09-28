import { ArrowLeft, LayoutDashboard, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

type ProgressHeaderProps = {
  currentStage: string | null;
  goal: string | null;
  subject: string | null;
  workflowCompleted: boolean;
};

export function ProgressHeader({
  currentStage,
  goal,
  subject,
  workflowCompleted,
}: ProgressHeaderProps) {
  return (
    <section className="glass-panel rounded-[24px] p-6 sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-violet-500 text-white">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-slate-500">
            Learning Progress
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
            Study tracking overview
          </h1>
          {goal ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {goal}
            </p>
          ) : null}
        </div>
        <div className="glass-control inline-flex w-full flex-col gap-1 rounded-[22px] p-1 sm:w-auto sm:flex-row lg:flex-col">
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[18px] px-4 py-2 text-sm font-black text-slate-700"
            to="/learning-plan"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Learning Plan
          </Link>
          <Link
            className="blue-pill inline-flex min-h-10 items-center justify-center gap-2 rounded-[18px] px-4 py-2 text-sm font-black text-white"
            to="/dashboard"
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatusMeta label="Subject" value={subject} />
        <StatusMeta label="Current Stage" value={currentStage} />
        <StatusMeta
          label="Workflow Status"
          value={workflowCompleted ? "Completed" : "In progress"}
        />
      </div>
    </section>
  );
}

type StatusMetaProps = {
  label: string;
  value: string | null;
};

function StatusMeta({ label, value }: StatusMetaProps) {
  if (!value) {
    return null;
  }

  return (
    <div className="glass-control rounded-[18px] p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
