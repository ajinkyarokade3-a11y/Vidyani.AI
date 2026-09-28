import { Clock } from "lucide-react";

import type { StudyScheduleEvent } from "@/types/calendar";

type ScheduleEventCardProps = {
  event: StudyScheduleEvent;
};

export function ScheduleEventCard({ event }: ScheduleEventCardProps) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-950">{event.topic}</p>
      <p className="mt-1 text-xs text-slate-500">{event.phase}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
        <span>{formatDate(event.start)}</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {formatTime(event.start)} - {formatTime(event.end)}
        </span>
        <span>{event.durationMinutes} min</span>
      </div>
    </article>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
