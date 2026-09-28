import { ArrowLeft, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { ProgressBar } from "@/components/onboarding/ProgressBar";
import type { WizardStep } from "@/components/onboarding/types";

type OnboardingLayoutProps = {
  children: ReactNode;
  currentStep: WizardStep;
};

export function OnboardingLayout({
  children,
  currentStep,
}: OnboardingLayoutProps) {
  return (
    <div className="onboarding-shell relative isolate min-h-screen overflow-hidden bg-[#080b14] text-white">
      <div className="landing-grid absolute inset-0 -z-20 opacity-25" />
      <div className="landing-light-path absolute inset-0 -z-10" />

      <header className="border-b border-white/10 bg-[#080b14]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-18 w-[min(100%-2rem,1120px)] items-center justify-between">
          <Link
            aria-label="Return to Vidyani.AI home"
            className="inline-flex items-center gap-2.5 font-semibold"
            to="/"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-500 shadow-[0_8px_24px_rgba(59,130,246,0.35)]">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg">Vidyani.AI</span>
          </Link>
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            to="/"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Back to home</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-[min(100%-2rem,920px)] flex-col py-8 sm:py-12">
        <ProgressBar currentStep={currentStep} />
        <div className="mt-7 overflow-hidden rounded-lg border border-white/12 bg-white/8 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          {children}
        </div>
      </main>
    </div>
  );
}
