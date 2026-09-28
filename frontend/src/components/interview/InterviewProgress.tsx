type InterviewProgressProps = {
  current: number;
  total: number;
};

export function InterviewProgress({
  current,
  total,
}: InterviewProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div aria-label={`Question ${current} of ${total}`} className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <span className="text-sm font-bold text-white">
          Question {current} of {total}
        </span>
        <span className="text-xs font-semibold text-blue-300">
          {percentage}% complete
        </span>
      </div>
      <div
        aria-valuemax={total}
        aria-valuemin={1}
        aria-valuenow={current}
        className="h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-[width] duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
