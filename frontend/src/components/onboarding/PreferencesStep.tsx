import {
  Check,
  FileText,
  GalleryHorizontalEnd,
  Hammer,
  ListChecks,
  Play,
  SlidersHorizontal,
} from "lucide-react";

import { StepHeader } from "@/components/onboarding/StepHeader";
import type { LearningPreference } from "@/components/onboarding/types";
import { cn } from "@/utils/cn";

const preferences: Array<{
  description: string;
  icon: typeof Play;
  value: LearningPreference;
}> = [
  {
    value: "Videos",
    description: "Visual explanations and guided walkthroughs",
    icon: Play,
  },
  {
    value: "Articles",
    description: "Detailed reading and reference material",
    icon: FileText,
  },
  {
    value: "Hands-on Projects",
    description: "Practical work that turns concepts into skills",
    icon: Hammer,
  },
  {
    value: "Quizzes",
    description: "Quick checks to reinforce understanding",
    icon: ListChecks,
  },
  {
    value: "Flashcards",
    description: "Short-form revision for important concepts",
    icon: GalleryHorizontalEnd,
  },
];

type PreferencesStepProps = {
  error: string | null;
  onToggle: (preference: LearningPreference) => void;
  values: LearningPreference[];
};

export function PreferencesStep({
  error,
  onToggle,
  values,
}: PreferencesStepProps) {
  return (
    <div>
      <StepHeader
        description="Select every format that helps you stay engaged. Vidyani will include these preferences in your learning profile."
        icon={SlidersHorizontal}
        step={5}
        title="How do you prefer to learn?"
      />

      <div
        aria-describedby={error ? "preferences-error" : undefined}
        aria-label="Learning preferences"
        className="mt-8 grid gap-3 sm:grid-cols-2"
        role="group"
      >
        {preferences.map((preference) => {
          const Icon = preference.icon;
          const isSelected = values.includes(preference.value);

          return (
            <button
              aria-pressed={isSelected}
              className={cn(
                "flex min-h-20 items-center gap-3 rounded-md border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                isSelected
                  ? "border-violet-400 bg-violet-400/12"
                  : "border-white/12 bg-black/10 hover:border-white/25 hover:bg-white/6"
              )}
              key={preference.value}
              onClick={() => onToggle(preference.value)}
              type="button"
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
                  isSelected
                    ? "bg-violet-500 text-white"
                    : "bg-white/8 text-slate-400"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">
                  {preference.value}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-400">
                  {preference.description}
                </span>
              </span>
              {isSelected ? (
                <Check className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="mt-3 text-sm text-rose-300" id="preferences-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
