import type { Db } from "@/lib/types";
import type { CalendarProvider } from "./types";
import { MockCalendarProvider } from "./mock-provider";

/**
 * Provider registry. Adding Google/Outlook/Apple later means implementing
 * CalendarProvider and adding a case here — nothing else in the app changes.
 */
export function getCalendarProvider(db: Db, userId: string, providerId = "mock"): CalendarProvider {
  switch (providerId) {
    case "mock":
    default:
      return new MockCalendarProvider(db, userId);
  }
}

export type { CalendarProvider, DateRange, CreateEventInput, UpdateEventInput } from "./types";
