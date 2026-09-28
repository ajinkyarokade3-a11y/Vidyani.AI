import { Lightbulb } from "lucide-react";

type FeedbackSummaryProps = {
  confidenceLevel?: string | number | null;
  motivationMessage: string | null;
  summary: string | null;
};

export function FeedbackSummary({
  confidenceLevel,
  motivationMessage,
  summary,
}: FeedbackSummaryProps) {
  if (!summary && !motivationMessage && confidenceLevel == null) {
    return null;
  }

  return (
    <section className="metric-card h-full p-5 transition hover:-translate-y-0.5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="blue-pill inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white">
          <Lightbulb className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-base font-black text-slate-950">AI Feedback</h2>
      </div>
      <div className="space-y-3">
        {summary ? (
          <p className="text-sm font-medium leading-6 text-slate-600">{summary}</p>
        ) : null}
        {motivationMessage ? (
          <p className="glass-control rounded-[18px] p-3 text-sm font-black leading-6 text-slate-800">
            {motivationMessage}
          </p>
        ) : null}
        {confidenceLevel != null ? (
          <div className="inline-flex items-center rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            Confidence: {confidenceLevel}
          </div>
        ) : null}
      </div>
    </section>
  );
}
