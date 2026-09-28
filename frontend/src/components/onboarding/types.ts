export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";

export type LearningPreference =
  | "Videos"
  | "Articles"
  | "Hands-on Projects"
  | "Quizzes"
  | "Flashcards";

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export type OnboardingFormState = {
  goal: string;
  skillLevel: SkillLevel | "";
  studyHours: number;
  targetDate: string;
  preferences: LearningPreference[];
};
