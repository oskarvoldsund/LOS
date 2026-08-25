import type { Tables } from "@/lib/types";

export interface DateRange {
  from: string; // ISO datetime
  to: string; // ISO datetime
}

export interface CreateEventInput {
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt: string;
  allDay?: boolean;
  sourceType?: Tables<"calendar_events">["source_type"];
}

export type UpdateEventInput = Partial<CreateEventInput>;

/**
 * One interface, swappable implementations. v1 ships only
 * MockCalendarProvider (backed by the calendar_events table itself); a real
 * provider (Google/Outlook/Apple) implements this same contract and plugs
 * into the registry in index.ts without touching any caller.
 * See docs/technical-architecture.md §4.
 */
export interface CalendarProvider {
  id: string;
  listEvents(range: DateRange): Promise<Tables<"calendar_events">[]>;
  createEvent(input: CreateEventInput): Promise<Tables<"calendar_events">>;
  updateEvent(id: string, input: UpdateEventInput): Promise<Tables<"calendar_events">>;
  deleteEvent(id: string): Promise<void>;
}
