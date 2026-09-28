import { CalendarPlus, LoaderCircle, WandSparkles } from "lucide-react";

type CalendarActionsProps = {
  connected: boolean;
  disabled: boolean;
  isBusy: boolean;
  onConnect: () => void;
  onGenerateSchedule: () => void;
};

export function CalendarActions({
  connected,
  disabled,
  isBusy,
  onConnect,
  onGenerateSchedule,
}: CalendarActionsProps) {
  return connected ? (
    <button
      className="blue-pill inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || isBusy}
      onClick={onGenerateSchedule}
      type="button"
    >
      {isBusy ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <WandSparkles className="h-4 w-4" aria-hidden="true" />
      )}
      Generate Study Schedule
    </button>
  ) : (
    <button
      className="blue-pill inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isBusy}
      onClick={onConnect}
      type="button"
    >
      {isBusy ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <CalendarPlus className="h-4 w-4" aria-hidden="true" />
      )}
      Connect Calendar
    </button>
  );
}
