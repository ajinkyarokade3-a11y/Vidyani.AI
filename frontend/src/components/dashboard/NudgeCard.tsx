import { MessageCircle } from "lucide-react";

import type { NudgeReport } from "@/types/learning";

type NudgeCardProps = {
  nudge: NudgeReport | null;
};

export function NudgeCard({ nudge }: NudgeCardProps) {
  return (
    <section className="metric-card h-full p-5 transition hover:-translate-y-0.5">
      <div className="mb-4 flex items-center gap-3">
        <span className="liquid-danger inline-flex h-10 w-10 items-center justify-center rounded-full text-white">
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-base font-black text-slate-950">Latest Nudge</h2>
      </div>
      {nudge ? (
        <div className="space-y-3">
          <p className="text-sm font-medium leading-6 text-slate-600">
            {nudge.personalized_message}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass-control rounded-[18px] p-3">
              <p className="text-xs font-black uppercase text-slate-400">
                Urgency
              </p>
              <p className="mt-1 text-sm font-black text-slate-950">
                {nudge.urgency}
              </p>
            </div>
            <div className="glass-control rounded-[18px] p-3">
              <p className="text-xs font-black uppercase text-slate-400">
                Action
              </p>
              <p className="mt-1 text-sm font-black leading-6 text-slate-950">
                {nudge.recommended_action}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm font-semibold text-slate-500">
          No nudge available yet.
        </p>
      )}
    </section>
  );
}
