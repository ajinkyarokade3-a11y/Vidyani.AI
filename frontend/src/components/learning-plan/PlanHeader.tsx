import { ArrowLeft, ArrowRight, CalendarDays, GraduationCap } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import type { LearningPlan } from "@/types/learning";

type PlanHeaderProps = {
  plan: LearningPlan;
};

export function PlanHeader({ plan }: PlanHeaderProps) {
  return (
    <section className="glass-panel rounded-[28px] p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="blue-pill mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full text-white">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold text-slate-500">Learning Plan</p>
          <h1 className="mt-2 text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">
            {plan.learning_goal}
          </h1>
          {plan.overview ? (
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-600">
              {plan.overview}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <Link
            className="glass-control inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black text-slate-700"
            to="/dashboard"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Link>
          <Link
            className="blue-pill inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black text-white"
            to="/progress"
          >
            Continue to Progress
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PlanMeta label="Subject" value={plan.subject} />
        <PlanMeta label="Skill Level" value={plan.learner_level} />
        <PlanMeta label="Target Completion" value={plan.target_deadline} />
        <PlanMeta
          icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
          label="Daily Study Time"
          value={plan.total_available_time}
        />
      </div>
    </section>
  );
}

type PlanMetaProps = {
  icon?: ReactNode;
  label: string;
  value: string | null;
};

function PlanMeta({ icon, label, value }: PlanMetaProps) {
  if (!value) {
    return null;
  }

  return (
    <div className="glass-control rounded-[18px] p-3">
      <p className="flex items-center gap-2 text-xs font-black uppercase text-slate-400">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}
