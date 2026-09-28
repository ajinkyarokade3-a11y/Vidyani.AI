import { BarChart3, CalendarClock, Target, UserRound } from "lucide-react";
import type { ReactNode } from "react";

type SummaryCardsProps = {
  currentSkillLevel: string | null;
  learningGoal: string | null;
  progressSummary: string | null;
  subject: string | null;
  targetDeadline: string | null;
};

export function SummaryCards({
  currentSkillLevel,
  learningGoal,
  progressSummary,
  subject,
  targetDeadline,
}: SummaryCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <SummaryCard
        icon={<Target className="h-5 w-5" aria-hidden="true" />}
        label="Current Goal"
        value={learningGoal}
      />
      <SummaryCard
        icon={<BarChart3 className="h-5 w-5" aria-hidden="true" />}
        label="Subject"
        value={subject}
      />
      <SummaryCard
        icon={<UserRound className="h-5 w-5" aria-hidden="true" />}
        label="Current Skill Level"
        value={currentSkillLevel}
      />
      <SummaryCard
        icon={<CalendarClock className="h-5 w-5" aria-hidden="true" />}
        label="Target Deadline"
        value={targetDeadline}
      />
      <article className="rounded-md border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
        <p className="text-sm font-semibold text-slate-500">Progress Summary</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {progressSummary ?? "No progress summary available yet."}
        </p>
      </article>
    </section>
  );
}

type SummaryCardProps = {
  icon: ReactNode;
  label: string;
  value: string | null;
};

function SummaryCard({ icon, label, value }: SummaryCardProps) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
        {icon}
      </div>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold leading-6 text-slate-950">
        {value ?? "Not available"}
      </p>
    </article>
  );
}
