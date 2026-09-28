import { LoaderCircle } from "lucide-react";

export function QuizLoading() {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
      <LoaderCircle
        className="mx-auto h-8 w-8 animate-spin text-blue-600"
        aria-hidden="true"
      />
      <h2 className="mt-4 text-lg font-bold text-slate-950">
        Preparing your quiz
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Vidyani is turning your roadmap topics into five focused questions.
      </p>
    </section>
  );
}
