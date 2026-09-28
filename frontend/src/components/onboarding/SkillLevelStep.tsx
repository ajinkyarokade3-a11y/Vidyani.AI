import { BookOpen, Check, Layers3, Trophy } from "lucide-react";

import { StepHeader } from "@/components/onboarding/StepHeader";
import type { SkillLevel } from "@/components/onboarding/types";
import { cn } from "@/utils/cn";

const skillLevels: Array<{
  description: string;
  icon: typeof BookOpen;
  value: SkillLevel;
}> = [
  {
    value: "Beginner",
    description: "I am new to this topic or have only explored the basics.",
    icon: BookOpen,
  },
  {
    value: "Intermediate",
    description: "I understand the fundamentals and have some practical experience.",
    icon: Layers3,
  },
  {
    value: "Advanced",
    description: "I am comfortable with the topic and want deeper mastery.",
    icon: Trophy,
  },
];

type SkillLevelStepProps = {
  error: string | null;
  onChange: (skillLevel: SkillLevel) => void;
  value: SkillLevel | "";
};

export function SkillLevelStep({
  error,
  onChange,
  value,
}: SkillLevelStepProps) {
  return (
    <div>
      <StepHeader
        description="Your starting point helps Vidyani choose the right depth, pacing, and sequence."
        icon={Layers3}
        step={2}
        title="Where are you starting from?"
      />

      <div
        aria-describedby={error ? "skill-error" : undefined}
        aria-label="Current skill level"
        className="mt-8 grid gap-3 md:grid-cols-3"
        role="radiogroup"
      >
        {skillLevels.map((level) => {
          const Icon = level.icon;
          const isSelected = value === level.value;

          return (
            <button
              aria-checked={isSelected}
              className={cn(
                "relative min-h-44 rounded-md border p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                isSelected
                  ? "border-blue-400 bg-blue-400/12"
                  : "border-white/12 bg-black/10 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/6"
              )}
              key={level.value}
              onClick={() => onChange(level.value)}
              role="radio"
              type="button"
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-md",
                  isSelected
                    ? "bg-blue-500 text-white"
                    : "bg-white/8 text-slate-400"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="mt-5 block text-base font-semibold text-white">
                {level.value}
              </span>
              <span className="mt-2 block text-sm leading-6 text-slate-400">
                {level.description}
              </span>
              {isSelected ? (
                <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="mt-3 text-sm text-rose-300" id="skill-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
