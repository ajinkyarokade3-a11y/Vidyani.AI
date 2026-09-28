import { apiClient } from "@/api/apiClient";
import type {
  CalendarConnectApiResponse,
  CalendarEventsApiResponse,
  CalendarStatusApiResponse,
  StudyScheduleEvent,
} from "@/types/calendar";

export async function connectCalendar(
  authorizationCode: string
): Promise<CalendarConnectApiResponse> {
  const response = await apiClient.post<CalendarConnectApiResponse>(
    "/calendar/connect",
    { authorization_code: authorizationCode }
  );
  return response.data;
}

export async function getCalendarStatus(
  connectionId: string | null
): Promise<CalendarStatusApiResponse> {
  const response = await apiClient.get<CalendarStatusApiResponse>(
    "/calendar/status",
    { params: { connection_id: connectionId } }
  );
  return response.data;
}

export async function createCalendarEvents(
  connectionId: string,
  events: StudyScheduleEvent[]
): Promise<CalendarEventsApiResponse> {
  const response = await apiClient.post<CalendarEventsApiResponse>(
    "/calendar/events",
    {
      connection_id: connectionId,
      events: events.map((event) => ({
        title: "📚 Vidyani.AI Study Session",
        description: event.description,
        start: event.start,
        end: event.end,
        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })),
    }
  );
  return response.data;
}
