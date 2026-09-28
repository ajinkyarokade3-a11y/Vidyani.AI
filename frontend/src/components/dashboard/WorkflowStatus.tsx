import { CheckCircle2, CircleDashed } from "lucide-react";

type WorkflowStatusProps = {
  currentStage: string | null;
  workflowCompleted: boolean;
};

export function WorkflowStatus({
  currentStage,
  workflowCompleted,
}: WorkflowStatusProps) {
  const Icon = workflowCompleted ? CheckCircle2 : CircleDashed;

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Workflow Status
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Stage: {currentStage ?? "Not started"}
          </p>
        </div>
      </div>
      <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm font-medium text-slate-700">
        {workflowCompleted
          ? "Completed"
          : currentStage
            ? "In progress or awaiting next step"
            : "No workflow session yet"}
      </div>
    </section>
  );
}
