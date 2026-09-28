import type {
  OnboardingFormState,
  WizardStep,
} from "@/components/onboarding/types";

export function isStepValid(
  step: WizardStep,
  formState: OnboardingFormState,
  today: string
): boolean {
  return getStepError(step, formState, today) === null;
}

export function getStepError(
  step: WizardStep,
  formState: OnboardingFormState,
  today: string
): string | null {
  if (step === 1 && formState.goal.trim().length < 3) {
    return "Choose a learning goal or enter a custom goal.";
  }
  if (step === 2 && !formState.skillLevel) {
    return "Select your current skill level.";
  }
  if (
    step === 3 &&
    (formState.studyHours < 0.5 || formState.studyHours > 6)
  ) {
    return "Choose a daily study time between 30 minutes and 6 hours.";
  }
  if (step === 4 && !formState.targetDate) {
    return "Choose a target completion date.";
  }
  if (step === 4 && formState.targetDate < today) {
    return "Your target completion date cannot be in the past.";
  }
  if (step === 5 && formState.preferences.length === 0) {
    return "Select at least one learning preference.";
  }
  return null;
}

export function getTodayInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
