type PhaseProgressProps = {
  completedCount: number;
  totalCount: number;
};

export function PhaseProgress({ completedCount, totalCount }: PhaseProgressProps) {
  if (totalCount === 0) {
    return null;
  }

  const percentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="rounded-md bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-950">Phase Progress</p>
        <p className="text-sm font-semibold text-slate-600">
          {completedCount}/{totalCount} topics
        </p>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-slate-900 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
