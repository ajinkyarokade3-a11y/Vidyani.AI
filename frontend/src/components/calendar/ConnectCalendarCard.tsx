import { CalendarDays, ExternalLink } from "lucide-react";

import { CalendarActions } from "@/components/calendar/CalendarActions";
import { CalendarStatus } from "@/components/calendar/CalendarStatus";
import type { StudyScheduleEvent } from "@/types/calendar";

type ConnectCalendarCardProps = {
  connected: boolean;
  disabled: boolean;
  isBusy: boolean;
  onConnect: () => void;
  onGenerateSchedule: () => void;
  upcomingStudySession: StudyScheduleEvent | null;
};

export function ConnectCalendarCard({
  connected,
  disabled,
  isBusy,
  onConnect,
  onGenerateSchedule,
  upcomingStudySession,
}: ConnectCalendarCardProps) {
  return (
    <section className="metric-card flex h-full flex-col p-5 transition hover:-translate-y-0.5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="blue-pill inline-flex h-10 w-10 items-center justify-center rounded-full text-white">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-black text-slate-950">
              Google Calendar
            </h2>
            <CalendarStatus connected={connected} />
          </div>
        </div>
      </div>

      {upcomingStudySession ? (
        <div className="glass-control mb-4 rounded-[20px] p-4">
          <p className="text-xs font-black uppercase text-slate-400">
            Upcoming Study Session
          </p>
          <p className="mt-2 text-sm font-black text-slate-950">
            {formatRelativeDate(upcomingStudySession.start)}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-600">
            {formatTime(upcomingStudySession.start)} - {upcomingStudySession.topic}
          </p>
          <a
            className="mt-3 inline-flex items-center gap-2 text-sm font-black text-blue-600 hover:underline"
            href="https://calendar.google.com/calendar/u/0/r"
            rel="noreferrer"
            target="_blank"
          >
            Open Google Calendar
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      ) : null}

      <div className="mt-auto">
        <CalendarActions
          connected={connected}
          disabled={disabled}
          isBusy={isBusy}
          onConnect={onConnect}
          onGenerateSchedule={onGenerateSchedule}
        />
      </div>
    </section>
  );
}

function formatRelativeDate(value: string): string {
  const eventDate = new Date(value);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (eventDate.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(eventDate);
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
