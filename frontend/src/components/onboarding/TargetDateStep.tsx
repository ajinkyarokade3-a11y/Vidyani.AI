import { CalendarDays, Route } from "lucide-react";

import { StepHeader } from "@/components/onboarding/StepHeader";

type TargetDateStepProps = {
  error: string | null;
  minDate: string;
  onChange: (targetDate: string) => void;
  value: string;
};

export function TargetDateStep({
  error,
  minDate,
  onChange,
  value,
}: TargetDateStepProps) {
  return (
    <div>
      <StepHeader
        description="Set the date you want to reach your goal. You can adjust your pace later as your learning journey evolves."
        icon={CalendarDays}
        step={4}
        title="When do you want to finish?"
      />

      <div className="mt-8">
        <label className="block text-sm font-semibold text-slate-200" htmlFor="target-date">
          Target completion date
        </label>
        <div className="relative mt-2">
          <CalendarDays
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            aria-describedby={error ? "date-error date-helper" : "date-helper"}
            aria-invalid={Boolean(error)}
            className="onboarding-date min-h-14 w-full rounded-md border border-white/12 bg-black/15 pl-12 pr-4 text-base text-white outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
            id="target-date"
            min={minDate}
            onChange={(event) => onChange(event.target.value)}
            type="date"
            value={value}
          />
        </div>
        {error ? (
          <p className="mt-2 text-sm text-rose-300" id="date-error">
            {error}
          </p>
        ) : null}
      </div>

      <div
        className="mt-6 flex items-start gap-3 rounded-md border border-blue-300/15 bg-blue-400/8 p-4 text-sm leading-6 text-blue-100"
        id="date-helper"
      >
        <Route className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Vidyani will use this deadline and your daily study time to personalize
        the number, pacing, and duration of roadmap phases.
      </div>
    </div>
  );
}
