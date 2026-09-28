import type { LucideIcon } from "lucide-react";

type StepHeaderProps = {
  description: string;
  icon: LucideIcon;
  step: number;
  title: string;
};

export function StepHeader({
  description,
  icon: Icon,
  step,
  title,
}: StepHeaderProps) {
  return (
    <header>
      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-blue-300/20 bg-blue-400/10 text-blue-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-5 text-xs font-bold uppercase text-blue-300">
        Step {step}
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-normal text-white sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
        {description}
      </p>
    </header>
  );
}
