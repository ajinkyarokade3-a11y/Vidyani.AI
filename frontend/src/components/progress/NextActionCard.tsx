import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

type NextActionCardProps = {
  nextAction: string | null;
};

export function NextActionCard({ nextAction }: NextActionCardProps) {
  if (!nextAction) {
    return null;
  }

  return (
    <section className="glass-panel rounded-[24px] p-5 transition hover:-translate-y-0.5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-blue-500 text-white">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold text-slate-950">
          Next Recommended Action
        </h2>
      </div>
      <p className="text-sm leading-6 text-slate-700">{nextAction}</p>
      <Link
        className="glass-control mt-5 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-black text-slate-700"
        to="/learning-plan"
      >
        Review Roadmap
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}
