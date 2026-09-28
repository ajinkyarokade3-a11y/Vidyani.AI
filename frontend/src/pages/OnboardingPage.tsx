import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { buildLearningPrompt } from "@/components/onboarding/formatters";
import { GoalStep } from "@/components/onboarding/GoalStep";
import { LoadingScreen } from "@/components/onboarding/LoadingScreen";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { PreferencesStep } from "@/components/onboarding/PreferencesStep";
import { SkillLevelStep } from "@/components/onboarding/SkillLevelStep";
import { StudyTimeStep } from "@/components/onboarding/StudyTimeStep";
import { TargetDateStep } from "@/components/onboarding/TargetDateStep";
import type {
  LearningPreference,
  OnboardingFormState,
  SkillLevel,
  WizardStep,
} from "@/components/onboarding/types";
import {
  getStepError,
  getTodayInputValue,
  isStepValid,
} from "@/components/onboarding/validation";
import { WizardNavigation } from "@/components/onboarding/WizardNavigation";
import { useSession } from "@/context/SessionContext";
import { useStartLearningSession } from "@/hooks/useLearningApi";

const initialFormState: OnboardingFormState = {
  goal: "",
  skillLevel: "",
  studyHours: 2,
  targetDate: "",
  preferences: [],
};

export function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formState, setFormState] =
    useState<OnboardingFormState>(initialFormState);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const startLearningSession = useStartLearningSession();
  const { saveWorkflow } = useSession();
  const navigate = useNavigate();
  const today = getTodayInputValue();
  const canContinue = isStepValid(currentStep, formState, today);

  function updateGoal(goal: string) {
    setFormState((current) => ({ ...current, goal }));
    setValidationError(null);
  }

  function updateSkillLevel(skillLevel: SkillLevel) {
    setFormState((current) => ({ ...current, skillLevel }));
    setValidationError(null);
  }

  function updateStudyHours(studyHours: number) {
    setFormState((current) => ({ ...current, studyHours }));
  }

  function updateTargetDate(targetDate: string) {
    setFormState((current) => ({ ...current, targetDate }));
    setValidationError(null);
  }

  function togglePreference(preference: LearningPreference) {
    setFormState((current) => ({
      ...current,
      preferences: current.preferences.includes(preference)
        ? current.preferences.filter((item) => item !== preference)
        : [...current.preferences, preference],
    }));
    setValidationError(null);
  }

  function handleNext() {
    const error = getStepError(currentStep, formState, today);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    setCurrentStep((current) => Math.min(current + 1, 5) as WizardStep);
  }

  function handleBack() {
    setValidationError(null);
    setSubmissionError(null);
    setCurrentStep((current) => Math.max(current - 1, 1) as WizardStep);
  }

  function handleSubmit() {
    const error = getStepError(5, formState, today);
    if (error) {
      setValidationError(error);
      return;
    }

    setSubmissionError(null);
    startLearningSession.mutate(
      {
        user_name: "Vidyani Learner",
        email: null,
        prompt: buildLearningPrompt(formState),
      },
      {
        onSuccess: (response) => {
          saveWorkflow(response.data);
          navigate("/dashboard");
        },
        onError: (requestError) => {
          setSubmissionError(requestError.message);
        },
      }
    );
  }

  if (startLearningSession.isPending) {
    return <LoadingScreen />;
  }

  return (
    <OnboardingLayout currentStep={currentStep}>
      {submissionError ? (
        <div
          className="flex items-start gap-3 border-b border-rose-300/15 bg-rose-400/10 px-5 py-4 text-sm text-rose-100 sm:px-8"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{submissionError}</span>
        </div>
      ) : null}

      <div
        className="onboarding-step min-h-[440px] px-5 py-7 sm:px-8 sm:py-9"
        key={currentStep}
      >
        {currentStep === 1 ? (
          <GoalStep
            error={validationError}
            onChange={updateGoal}
            value={formState.goal}
          />
        ) : null}
        {currentStep === 2 ? (
          <SkillLevelStep
            error={validationError}
            onChange={updateSkillLevel}
            value={formState.skillLevel}
          />
        ) : null}
        {currentStep === 3 ? (
          <StudyTimeStep
            onChange={updateStudyHours}
            value={formState.studyHours}
          />
        ) : null}
        {currentStep === 4 ? (
          <TargetDateStep
            error={validationError}
            minDate={today}
            onChange={updateTargetDate}
            value={formState.targetDate}
          />
        ) : null}
        {currentStep === 5 ? (
          <PreferencesStep
            error={validationError}
            onToggle={togglePreference}
            values={formState.preferences}
          />
        ) : null}
      </div>

      <WizardNavigation
        canContinue={canContinue}
        currentStep={currentStep}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleSubmit}
      />
    </OnboardingLayout>
  );
}
