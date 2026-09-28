import { AlertCircle, CalendarCheck2, CalendarClock, Clock3 } from "lucide-react";

export type CompletionEstimate = {
  daysRemaining: number | null;
  estimatedCompletionDate: Date | null;
  message: string | null;
  status: "On Track" | "Behind Schedule" | null;
  targetDate: Date | null;
};

type EstimatedCompletionCardProps = {
  estimate: CompletionEstimate;
};

export function EstimatedCompletionCard({
  estimate,
}: EstimatedCompletionCardProps) {
  const isBehind = estimate.status === "Behind Schedule";

  return (
    <section className="glass-panel rounded-[24px] p-5 transition hover:-translate-y-0.5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-violet-500 text-white">
            <CalendarCheck2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Estimated Completion
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              {estimate.estimatedCompletionDate
                ? formatDate(estimate.estimatedCompletionDate)
                : "Estimate not available yet"}
            </h2>
            {estimate.message ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {estimate.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
          <EstimateMetric
            icon={CalendarClock}
            label="Target Completion"
            value={estimate.targetDate ? formatDate(estimate.targetDate) : "Not set"}
          />
          <EstimateMetric
            icon={Clock3}
            label="Days Remaining"
            value={
              estimate.daysRemaining === null
                ? "Unavailable"
                : String(Math.max(estimate.daysRemaining, 0))
            }
          />
          <div className="glass-control rounded-[18px] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              Status
            </div>
            <p
              className={`mt-2 text-sm font-bold ${
                estimate.status === null
                  ? "text-slate-700"
                  : isBehind
                    ? "text-amber-300"
                    : "text-emerald-300"
              }`}
            >
              {estimate.status ?? "Pending estimate"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

type EstimateMetricProps = {
  icon: typeof Clock3;
  label: string;
  value: string;
};

function EstimateMetric({ icon: Icon, label, value }: EstimateMetricProps) {
  return (
    <div className="glass-control rounded-[18px] p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-2 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
