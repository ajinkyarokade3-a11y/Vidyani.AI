import { CheckCircle2, CircleDashed } from "lucide-react";

type CalendarStatusProps = {
  connected: boolean;
};

export function CalendarStatus({ connected }: CalendarStatusProps) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold">
      {connected ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          <span className="text-emerald-700">Connected</span>
        </>
      ) : (
        <>
          <CircleDashed className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <span className="text-slate-600">Not Connected</span>
        </>
      )}
    </div>
  );
}
