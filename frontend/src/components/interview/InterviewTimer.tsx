import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

import { formatElapsedTime } from "@/utils/interview";

type InterviewTimerProps = {
  startedAt: number;
};

export function InterviewTimer({ startedAt }: InterviewTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    getElapsedSeconds(startedAt)
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds(getElapsedSeconds(startedAt));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  return (
    <div className="inline-flex h-11 items-center gap-2 rounded-md border border-white/10 bg-white/[0.05] px-4 font-mono text-sm font-bold text-white">
      <Clock3 className="h-4 w-4 text-blue-400" aria-hidden="true" />
      {formatElapsedTime(elapsedSeconds)}
    </div>
  );
}

function getElapsedSeconds(startedAt: number): number {
  return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
}
