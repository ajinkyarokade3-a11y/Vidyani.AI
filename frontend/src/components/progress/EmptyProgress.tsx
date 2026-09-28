import { ArrowRight, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

export function EmptyProgress() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-700">
        <BarChart3 className="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold tracking-normal text-slate-950">
        No progress recorded yet
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Start a learning session in chat. Once the workflow produces a progress
        report, your completion metrics and next action will appear here.
      </p>
      <Link
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        to="/chat"
      >
        Start Learning Session
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}
