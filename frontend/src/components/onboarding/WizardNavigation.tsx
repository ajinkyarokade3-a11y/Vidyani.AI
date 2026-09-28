import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/common/Button";
import type { WizardStep } from "@/components/onboarding/types";

type WizardNavigationProps = {
  canContinue: boolean;
  currentStep: WizardStep;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
};

export function WizardNavigation({
  canContinue,
  currentStep,
  onBack,
  onNext,
  onSubmit,
}: WizardNavigationProps) {
  const isFinalStep = currentStep === 5;

  return (
    <footer className="flex flex-col-reverse gap-3 border-t border-white/10 bg-black/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <Button
        className={currentStep === 1 ? "invisible" : ""}
        disabled={currentStep === 1}
        onClick={onBack}
        variant="secondary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </Button>

      <Button
        className="w-full sm:w-auto"
        disabled={!canContinue}
        onClick={isFinalStep ? onSubmit : onNext}
        size="large"
      >
        {isFinalStep ? (
          <>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Generate Learning Plan
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </Button>
    </footer>
  );
}
