import { Check } from "lucide-react";

import { cn } from "@/utils/cn";

type QuizQuestionCardProps = {
  currentQuestion: number;
  onSelect: (answer: string) => void;
  options: string[];
  question: string;
  selectedAnswer: string;
  totalQuestions: number;
};

export function QuizQuestionCard({
  currentQuestion,
  onSelect,
  options,
  question,
  selectedAnswer,
  totalQuestions,
}: QuizQuestionCardProps) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-blue-600">
          Question {currentQuestion + 1}
        </p>
        <p className="text-sm font-medium text-slate-500">
          {currentQuestion + 1} of {totalQuestions}
        </p>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{
            width: `${((currentQuestion + 1) / totalQuestions) * 100}%`,
          }}
        />
      </div>

      <h2 className="mt-6 text-xl font-bold leading-8 text-slate-950">
        {question}
      </h2>

      <fieldset className="mt-6 grid gap-3">
        <legend className="sr-only">Choose one answer</legend>
        {options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          return (
            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md border p-4 text-sm font-medium transition",
                isSelected
                  ? "blue-pill border-blue-500 text-white"
                  : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              )}
              key={option}
            >
              <input
                checked={isSelected}
                className="sr-only"
                name={`quiz-question-${currentQuestion}`}
                onChange={() => onSelect(option)}
                type="radio"
                value={option}
              />
              <span
                className={cn(
                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {isSelected ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  String.fromCharCode(65 + index)
                )}
              </span>
              <span>{option}</span>
            </label>
          );
        })}
      </fieldset>
    </section>
  );
}
