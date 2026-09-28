import { BriefcaseBusiness, Clock3, Play } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/common/Button";
import type {
  InterviewDifficulty,
  InterviewStartRequest,
} from "@/types/interview";
import { cn } from "@/utils/cn";

const DIFFICULTIES: InterviewDifficulty[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
];
const QUESTION_COUNTS = [5, 10, 15] as const;

type InterviewSetupProps = {
  isLoading: boolean;
  learningGoal: string;
  onStart: (request: InterviewStartRequest) => void;
};

export function InterviewSetup({
  isLoading,
  learningGoal,
  onStart,
}: InterviewSetupProps) {
  const [interviewRole, setInterviewRole] = useState(
    getDefaultRole(learningGoal)
  );
  const [difficulty, setDifficulty] =
    useState<InterviewDifficulty>("Intermediate");
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedRole = interviewRole.trim();
    if (trimmedRole.length < 3) {
      return;
    }

    onStart({
      learning_goal: learningGoal,
      interview_role: trimmedRole,
      difficulty,
      number_of_questions: numberOfQuestions,
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-violet-600 text-white">
            <BriefcaseBusiness className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Practice Workspace
            </p>
            <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
              Mock Interview
            </h1>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
          Configure a focused text interview based on your current learning
          goal.
        </p>
      </section>

      <section className="space-y-6 rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <Field label="Learning Goal">
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-700 outline-none"
            readOnly
            value={learningGoal}
          />
        </Field>

        <Field label="Interview Role">
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            maxLength={100}
            minLength={3}
            onChange={(event) => setInterviewRole(event.target.value)}
            placeholder="e.g. Data Scientist"
            required
            value={interviewRole}
          />
        </Field>

        <Field label="Difficulty">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {DIFFICULTIES.map((option) => (
              <button
                aria-pressed={difficulty === option}
                className={cn(
                  "rounded-md border px-4 py-3 text-sm font-semibold",
                  difficulty === option
                    ? "blue-pill border-blue-500 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                )}
                key={option}
                onClick={() => setDifficulty(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Number of Questions">
          <div className="grid grid-cols-3 gap-3">
            {QUESTION_COUNTS.map((count) => (
              <button
                aria-pressed={numberOfQuestions === count}
                className={cn(
                  "rounded-md border px-4 py-3 text-sm font-semibold",
                  numberOfQuestions === count
                    ? "blue-pill border-violet-500 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                )}
                key={count}
                onClick={() => setNumberOfQuestions(count)}
                type="button"
              >
                {count}
              </button>
            ))}
          </div>
        </Field>

        <div className="flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock3 className="h-4 w-4 text-blue-600" aria-hidden="true" />
            Estimated duration: {numberOfQuestions * 2} minutes
          </div>
          <Button
            disabled={isLoading || interviewRole.trim().length < 3}
            type="submit"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            {isLoading ? "Starting..." : "Start Interview"}
          </Button>
        </div>
      </section>
    </form>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {children}
    </label>
  );
}

function getDefaultRole(learningGoal: string): string {
  return learningGoal
    .replace(/^i want to\s+/i, "")
    .replace(/^become\s+(?:a|an)\s+/i, "")
    .replace(/^learn\s+/i, "")
    .replace(/[.!?]+$/, "")
    .trim()
    .slice(0, 100);
}
