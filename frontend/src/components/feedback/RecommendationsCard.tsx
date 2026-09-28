import { ListChecks } from "lucide-react";

type RecommendationsCardProps = {
  recommendations: string[];
};

export function RecommendationsCard({
  recommendations,
}: RecommendationsCardProps) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="metric-card h-full p-5 transition hover:-translate-y-0.5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="blue-pill inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white">
          <ListChecks className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-base font-black text-slate-950">
          Recommendations
        </h2>
      </div>
      <div className="space-y-3">
        {recommendations.map((recommendation) => (
          <p
            className="glass-control rounded-[18px] p-3 text-sm font-medium leading-6 text-slate-600"
            key={recommendation}
          >
            {recommendation}
          </p>
        ))}
      </div>
    </section>
  );
}
