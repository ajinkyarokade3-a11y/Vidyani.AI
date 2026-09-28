import { X } from "lucide-react";

import { ScheduleEventCard } from "@/components/calendar/ScheduleEventCard";
import type { StudyScheduleEvent } from "@/types/calendar";

type SchedulePreviewProps = {
  events: StudyScheduleEvent[];
  isCreating: boolean;
  onCancel: () => void;
  onCreate: () => void;
};

export function SchedulePreview({
  events,
  isCreating,
  onCancel,
  onCreate,
}: SchedulePreviewProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm">
      <section className="glass-panel max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[28px]">
        <div className="flex items-center justify-between border-b border-white/70 p-5">
          <div>
            <h2 className="text-lg font-black text-slate-950">Review Schedule</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">
              {events.length} study sessions will be added to your primary calendar.
            </p>
          </div>
          <button
            aria-label="Close schedule preview"
            className="glass-control rounded-full p-2 text-slate-600"
            onClick={onCancel}
            type="button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto bg-white/25 p-5">
          {events.map((event) => (
            <ScheduleEventCard event={event} key={event.id} />
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t border-white/70 p-5 sm:flex-row sm:justify-end">
          <button
            className="glass-control rounded-full px-5 py-2.5 text-sm font-black text-slate-700"
            disabled={isCreating}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="blue-pill rounded-full px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isCreating}
            onClick={onCreate}
            type="button"
          >
            {isCreating ? "Creating events..." : "Create Calendar Events"}
          </button>
        </div>
      </section>
    </div>
  );
}
