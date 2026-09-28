import { Check } from "lucide-react";

import type { WizardStep } from "@/components/onboarding/types";
import { cn } from "@/utils/cn";

const stepLabels = ["Goal", "Level", "Study time", "Deadline", "Preferences"];

export function ProgressBar({ currentStep }: { currentStep: WizardStep }) {
  const progress = ((currentStep - 1) / (stepLabels.length - 1)) * 100;

  return (
    <div aria-label={`Step ${currentStep} of 5`} className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">
          Build your learning profile
        </p>
        <p className="text-xs font-medium text-slate-400">
          Step {currentStep} of 5
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-[10%] right-[10%] top-4 h-0.5 bg-white/10">
          <div
            className="h-full bg-blue-500 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <ol className="relative grid grid-cols-5">
          {stepLabels.map((label, index) => {
            const stepNumber = index + 1;
            const isComplete = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <li className="flex min-w-0 flex-col items-center" key={label}>
                <span
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-colors",
                    isComplete
                      ? "border-blue-500 bg-blue-500 text-white"
                      : isCurrent
                        ? "border-blue-400 bg-[#12182a] text-blue-300"
                        : "border-white/15 bg-[#0c1120] text-slate-500"
                  )}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    stepNumber
                  )}
                </span>
                <span
                  className={cn(
                    "mt-2 hidden truncate px-1 text-center text-xs sm:block",
                    isCurrent ? "font-semibold text-white" : "text-slate-500"
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
