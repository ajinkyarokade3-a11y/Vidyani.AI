import { Clock3 } from "lucide-react";

import { formatStudyTime } from "@/components/onboarding/formatters";
import { StepHeader } from "@/components/onboarding/StepHeader";

type StudyTimeStepProps = {
  onChange: (studyHours: number) => void;
  value: number;
};

export function StudyTimeStep({ onChange, value }: StudyTimeStepProps) {
  const percentage = ((value - 0.5) / 5.5) * 100;

  return (
    <div>
      <StepHeader
        description="Choose a sustainable daily commitment. Vidyani will shape the roadmap around the time you can consistently protect."
        icon={Clock3}
        step={3}
        title="How much time can you study each day?"
      />

      <div className="mt-10 rounded-md border border-white/12 bg-black/10 p-5 sm:p-7">
        <div className="text-center" aria-live="polite">
          <p className="text-4xl font-bold text-white sm:text-5xl">
            {formatStudyTime(value)}
          </p>
          <p className="mt-2 text-sm text-slate-400">every day</p>
        </div>

        <label className="sr-only" htmlFor="study-time">
          Daily study time
        </label>
        <input
          className="onboarding-range mt-10 w-full"
          id="study-time"
          max="6"
          min="0.5"
          onChange={(event) => onChange(Number(event.target.value))}
          step="0.5"
          style={{ "--range-progress": `${percentage}%` } as React.CSSProperties}
          type="range"
          value={value}
        />
        <div className="mt-3 flex justify-between text-xs font-medium text-slate-500">
          <span>30 mins</span>
          <span>6 hours</span>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-md border border-emerald-300/15 bg-emerald-400/8 p-4 text-sm leading-6 text-emerald-100">
        <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Consistency matters more than choosing the largest number. Pick a pace
        you can maintain.
      </div>
    </div>
  );
}
