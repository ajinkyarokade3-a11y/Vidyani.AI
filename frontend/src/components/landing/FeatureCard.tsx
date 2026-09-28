import type { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  description: string;
  icon: LucideIcon;
  tone: "blue" | "violet" | "emerald" | "amber" | "rose" | "cyan";
  title: string;
};

const iconTones = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
};

export function FeatureCard({
  description,
  icon: Icon,
  tone,
  title,
}: FeatureCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ring-1 ${iconTones[tone]}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-400 transition-transform duration-300 group-hover:scale-x-100" />
    </article>
  );
}
