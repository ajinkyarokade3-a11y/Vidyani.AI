import { Check, Circle, LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/utils/cn";

const loadingStages = [
  "Understanding your learning goal...",
  "Building your personalized roadmap...",
  "Tracking milestones...",
  "Preparing AI feedback...",
  "Almost ready...",
];

export function LoadingScreen() {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveStage((current) =>
        Math.min(current + 1, loadingStages.length - 1)
      );
    }, 1800);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#080b14] px-4 text-white">
      <div className="landing-grid absolute inset-0 -z-20 opacity-25" />
      <div className="landing-light-path absolute inset-0 -z-10" />

      <div className="w-full max-w-lg text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-blue-300/20 bg-blue-400/10 text-blue-300">
          <Sparkles className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-bold tracking-normal sm:text-4xl">
          Vidyani is building your path
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
          Your five answers are being transformed into a personalized learning
          workflow.
        </p>

        <div
          aria-live="polite"
          className="mt-8 rounded-lg border border-white/12 bg-white/8 p-5 text-left backdrop-blur-xl"
        >
          {loadingStages.map((stage, index) => {
            const isComplete = index < activeStage;
            const isActive = index === activeStage;

            return (
              <div
                className={cn(
                  "flex min-h-11 items-center gap-3 border-b border-white/8 py-2 last:border-b-0",
                  isActive ? "text-white" : "text-slate-500"
                )}
                key={stage}
              >
                {isComplete ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                ) : isActive ? (
                  <LoaderCircle
                    className="h-6 w-6 animate-spin text-blue-400"
                    aria-hidden="true"
                  />
                ) : (
                  <Circle className="h-6 w-6 text-white/10" aria-hidden="true" />
                )}
                <span className="text-sm font-medium">{stage}</span>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
