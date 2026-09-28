import {
  BookOpenCheck,
  BriefcaseBusiness,
  ClipboardCheck,
  Flame,
  type LucideIcon,
} from "lucide-react";

type QuickStatsProps = {
  completedTopics: number;
  totalTopics: number;
};

export function QuickStats({ completedTopics, totalTopics }: QuickStatsProps) {
  const completion =
    totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);
  const stats: Array<{
    detail: string;
    icon: LucideIcon;
    label: string;
    primary?: boolean;
    value: string;
  }> = [
    {
      detail: `${completion}% completed`,
      icon: BookOpenCheck,
      label: "Topics Completed",
      primary: true,
      value: `${completedTopics} / ${totalTopics}`,
    },
    {
      detail: "Complete a quiz to begin",
      icon: ClipboardCheck,
      label: "Quiz Average",
      value: "-",
    },
    {
      detail: "No completed interviews",
      icon: BriefcaseBusiness,
      label: "Mock Interviews",
      value: "0",
    },
    {
      detail: "Start learning today",
      icon: Flame,
      label: "Study Streak",
      value: "-",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ detail, icon: Icon, label, primary, value }) => (
        <article
          className={`min-h-36 p-5 transition hover:-translate-y-1 ${
            primary ? "metric-card-primary" : "metric-card"
          }`}
          key={label}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-[15px] ${
                primary ? "bg-white/95 text-blue-600" : "blue-pill text-white"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p
              className={`text-sm font-bold ${
                primary ? "text-blue-50" : "text-slate-500"
              }`}
            >
              {label}
            </p>
          </div>
          <p
            className={`mt-4 text-3xl font-black ${
              primary ? "text-white" : "text-slate-950"
            }`}
          >
            {value}
          </p>
          <p
            className={`mt-2 text-xs font-semibold ${
              primary ? "text-blue-100" : "text-slate-500"
            }`}
          >
            {detail}
          </p>
        </article>
      ))}
    </section>
  );
}
