import {
  BarChart3,
  Check,
  Cloud,
  Code2,
  GraduationCap,
  Target,
} from "lucide-react";

import { StepHeader } from "@/components/onboarding/StepHeader";
import { cn } from "@/utils/cn";

const quickGoals = [
  { label: "Become a Data Scientist", icon: BarChart3 },
  { label: "Crack AWS Solutions Architect", icon: Cloud },
  { label: "Learn Full Stack Development", icon: Code2 },
  { label: "Master Data Analytics", icon: Target },
  { label: "Prepare for GATE CSE", icon: GraduationCap },
];

type GoalStepProps = {
  error: string | null;
  onChange: (goal: string) => void;
  value: string;
};

export function GoalStep({ error, onChange, value }: GoalStepProps) {
  const selectedQuickGoal = quickGoals.some((goal) => goal.label === value);
  const customGoal = selectedQuickGoal ? "" : value;

  return (
    <div>
      <StepHeader
        description="Choose a popular path or describe the outcome you want Vidyani.AI to help you reach."
        icon={Target}
        step={1}
        title="What do you want to achieve?"
      />

      <div
        aria-label="Quick learning goals"
        className="mt-8 grid gap-3 sm:grid-cols-2"
        role="radiogroup"
      >
        {quickGoals.map((goal) => {
          const Icon = goal.icon;
          const isSelected = value === goal.label;

          return (
            <button
              aria-checked={isSelected}
              className={cn(
                "flex min-h-16 items-center gap-3 rounded-md border px-4 py-3 text-left text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                isSelected
                  ? "border-blue-400 bg-blue-400/12 text-white"
                  : "border-white/12 bg-black/10 text-slate-200 hover:border-white/25 hover:bg-white/6"
              )}
              key={goal.label}
              onClick={() => onChange(goal.label)}
              role="radio"
              type="button"
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                  isSelected
                    ? "bg-blue-500 text-white"
                    : "bg-white/8 text-slate-400"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">{goal.label}</span>
              {isSelected ? (
                <Check className="h-4 w-4 shrink-0 text-blue-300" aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase text-slate-500">
        <span className="h-px flex-1 bg-white/10" />
        Or enter a custom goal
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <label className="block text-sm font-semibold text-slate-200" htmlFor="custom-goal">
        Custom learning goal
      </label>
      <input
        aria-describedby={error ? "goal-error" : undefined}
        aria-invalid={Boolean(error)}
        className="mt-2 min-h-12 w-full rounded-md border border-white/12 bg-black/15 px-4 text-base text-white outline-none transition-colors placeholder:text-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
        id="custom-goal"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Example: Learn product design for a career switch"
        type="text"
        value={customGoal}
      />
      {error ? (
        <p className="mt-2 text-sm text-rose-300" id="goal-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
