import { Target } from "lucide-react";

type ImprovementsCardProps = {
  improvements: string[];
};

export function ImprovementsCard({ improvements }: ImprovementsCardProps) {
  if (improvements.length === 0) {
    return null;
  }

  return (
    <section className="metric-card h-full p-5 transition hover:-translate-y-0.5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="liquid-danger inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white">
          <Target className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-base font-black text-slate-950">
          Areas for Improvement
        </h2>
      </div>
      <ul className="space-y-3">
        {improvements.map((improvement) => (
          <li className="flex gap-3 text-sm font-medium leading-6 text-slate-600" key={improvement}>
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
            <span>{improvement}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
