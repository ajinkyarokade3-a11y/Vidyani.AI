import type { OnboardingFormState } from "@/components/onboarding/types";

export function buildLearningPrompt(formState: OnboardingFormState): string {
  const goal = normalizeGoal(formState.goal);
  const studyTime = formatStudyTime(formState.studyHours);
  const targetDate = formatTargetDate(formState.targetDate);
  const preferences = formatList(formState.preferences);

  return [
    `I want to ${goal}.`,
    `I am a ${formState.skillLevel}.`,
    `I can study ${studyTime} every day.`,
    `I want to finish by ${targetDate}.`,
    `I prefer ${preferences}.`,
  ].join("\n");
}

export function formatStudyTime(hours: number): string {
  if (hours === 0.5) {
    return "30 minutes";
  }
  if (hours === 1) {
    return "1 hour";
  }
  return `${hours} hours`;
}

function normalizeGoal(value: string): string {
  const withoutTrailingPunctuation = value.trim().replace(/[.!?]+$/, "");
  const withoutPrefix = withoutTrailingPunctuation.replace(/^I want to\s+/i, "");
  return withoutPrefix
    ? `${withoutPrefix.charAt(0).toLowerCase()}${withoutPrefix.slice(1)}`
    : withoutPrefix;
}

function formatTargetDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatList(values: string[]): string {
  if (values.length === 0) {
    return "";
  }
  if (values.length === 1) {
    return values[0];
  }
  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}
