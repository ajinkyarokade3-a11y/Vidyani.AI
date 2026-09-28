import type { ApiSuccessResponse } from "@/types/api";

export type StudyScheduleEvent = {
  id: string;
  date: string;
  start: string;
  end: string;
  topic: string;
  phase: string;
  durationMinutes: number;
  description: string;
};

export type CalendarConnection = {
  connected: boolean;
  connectionId: string | null;
};

export type CreatedCalendarEvent = {
  id: string;
  htmlLink: string;
};

export type CalendarConnectApiResponse = ApiSuccessResponse<{
  connected: boolean;
  connection_id: string;
}>;

export type CalendarStatusApiResponse = ApiSuccessResponse<{
  connected: boolean;
}>;

export type CalendarEventsApiResponse =
  ApiSuccessResponse<CreatedCalendarEvent[]>;
