import { MessageSquareText } from "lucide-react";

import type { InterviewQuestion } from "@/types/interview";

type InterviewQuestionCardProps = {
  question: InterviewQuestion;
};

export function InterviewQuestionCard({
  question,
}: InterviewQuestionCardProps) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
          <MessageSquareText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-blue-600">
            Interview Question
          </p>
          <h2 className="mt-2 text-xl font-bold leading-8 text-slate-950 sm:text-2xl">
            {question.question}
          </h2>
        </div>
      </div>
    </article>
  );
}
