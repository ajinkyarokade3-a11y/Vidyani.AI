import { Lightbulb } from "lucide-react";

import type { FeedbackReport } from "@/types/learning";

type FeedbackCardProps = {
  feedback: FeedbackReport | null;
};

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  return (
    <section className="metric-card h-full p-5 transition hover:-translate-y-0.5">
      <div className="mb-4 flex items-center gap-3">
        <span className="blue-pill inline-flex h-10 w-10 items-center justify-center rounded-full text-white">
          <Lightbulb className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-base font-black text-slate-950">Latest Feedback</h2>
      </div>
      {feedback ? (
        <div className="space-y-3">
          <p className="text-sm font-medium leading-6 text-slate-600">
            {feedback.overall_performance_assessment}
          </p>
          <p className="glass-control rounded-[18px] p-3 text-sm font-bold leading-6 text-slate-800">
            {feedback.motivation_message}
          </p>
        </div>
      ) : (
        <p className="text-sm font-semibold text-slate-500">
          No feedback available yet.
        </p>
      )}
    </section>
  );
}
