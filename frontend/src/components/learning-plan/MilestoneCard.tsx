import { Flag } from "lucide-react";

type MilestoneCardProps = {
  milestones: string[];
};

export function MilestoneCard({ milestones }: MilestoneCardProps) {
  if (milestones.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Flag className="h-4 w-4 text-slate-500" aria-hidden="true" />
        <h4 className="text-sm font-semibold text-slate-950">Milestones</h4>
      </div>
      <ul className="space-y-2">
        {milestones.map((milestone) => (
          <li className="flex gap-2 text-sm leading-6 text-slate-700" key={milestone}>
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
            <span>{milestone}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
