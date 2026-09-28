import {
  CheckCircle2,
  RefreshCw,
  Target,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/common/Button";
import type { QuizSubmissionResult } from "@/types/quiz";

type QuizResultsProps = {
  isGenerating: boolean;
  onGenerateNew: () => void;
  result: QuizSubmissionResult;
};

export function QuizResults({
  isGenerating,
  onGenerateNew,
  result,
}: QuizResultsProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Quiz complete</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">
              Your results
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Review every answer and use the explanations to strengthen weak
              areas.
            </p>
          </div>
          <Button disabled={isGenerating} onClick={onGenerateNew}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {isGenerating ? "Generating..." : "Generate New Quiz"}
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <ResultMetric label="Score" value={`${result.score}`} />
          <ResultMetric
            label="Percentage"
            value={`${result.percentage}%`}
          />
          <ResultMetric
            label="Questions"
            value={`${result.total_questions}`}
          />
        </div>
      </section>

      <section className="space-y-3">
        {result.results.map((item) => (
          <article
            className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
            key={item.question_number}
          >
            <div className="flex gap-3">
              {item.is_correct ? (
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
              ) : (
                <XCircle
                  className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Question {item.question_number}
                </p>
                <h2 className="mt-1 text-base font-bold leading-7 text-slate-950">
                  {item.question}
                </h2>
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <AnswerDetail
                    label="Your answer"
                    value={item.selected_answer}
                  />
                  <AnswerDetail
                    label="Correct answer"
                    value={item.correct_answer}
                  />
                </div>
                <div className="mt-4 rounded-md bg-slate-50 p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                    <Target className="h-3.5 w-3.5" aria-hidden="true" />
                    Explanation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {item.explanation}
                  </p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-4 text-center">
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase text-slate-500">
        {label}
      </p>
    </div>
  );
}

function AnswerDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
