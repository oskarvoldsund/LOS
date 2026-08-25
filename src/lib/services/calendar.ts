import type { Db, Tables } from "@/lib/types";
import { getCalendarProvider } from "./calendar-providers";
import type { CreateEventInput, DateRange } from "./calendar-providers/types";

export async function getCalendarEvents(
  db: Db,
  userId: string,
  range: DateRange,
): Promise<Tables<"calendar_events">[]> {
  return getCalendarProvider(db, userId).listEvents(range);
}

export async function createCalendarEvent(
  db: Db,
  userId: string,
  input: CreateEventInput,
): Promise<Tables<"calendar_events">> {
  return getCalendarProvider(db, userId).createEvent(input);
}

export async function createCalendarBlock(
  db: Db,
  userId: string,
  input: CreateEventInput,
): Promise<Tables<"calendar_events">> {
  return createCalendarEvent(db, userId, {
    ...input,
    sourceType: input.sourceType ?? "manual",
  });
}

export async function deleteCalendarEvent(db: Db, userId: string, id: string): Promise<void> {
  return getCalendarProvider(db, userId).deleteEvent(id);
}

export interface FreeSlot {
  start: string;
  end: string;
  durationMinutes: number;
}

/**
 * Naive free-slot finder over a single day's events: sorts events, walks the
 * gaps between them within [dayStart, dayEnd], keeps gaps >= minMinutes.
 * Deterministic and cheap — no model call needed for this (see
 * docs/technical-architecture.md §8).
 */
export async function findFreeCalendarSlots(
  db: Db,
  userId: string,
  params: { from: string; to: string; minMinutes?: number; dayStartHour?: number; dayEndHour?: number },
): Promise<FreeSlot[]> {
  const { from, to, minMinutes = 30, dayStartHour = 8, dayEndHour = 20 } = params;
  const events = await getCalendarEvents(db, userId, { from, to });
  const slots: FreeSlot[] = [];

  const start = new Date(from);
  const end = new Date(to);
  for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    const dayStart = new Date(day);
    dayStart.setHours(dayStartHour, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(dayEndHour, 0, 0, 0);

    const dayEvents = events
      .filter((e) => !e.all_day)
      .filter((e) => {
        const s = new Date(e.starts_at);
        return s >= dayStart && s <= dayEnd;
      })
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

    let cursor = dayStart;
    for (const event of dayEvents) {
      const eventStart = new Date(event.starts_at);
      const eventEnd = new Date(event.ends_at);
      if (eventStart > cursor) {
        pushIfLongEnough(slots, cursor, eventStart, minMinutes);
      }
      if (eventEnd > cursor) cursor = eventEnd;
    }
    if (cursor < dayEnd) pushIfLongEnough(slots, cursor, dayEnd, minMinutes);
  }

  return slots;
}

function pushIfLongEnough(slots: FreeSlot[], start: Date, end: Date, minMinutes: number) {
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60_000);
  if (durationMinutes >= minMinutes) {
    slots.push({ start: start.toISOString(), end: end.toISOString(), durationMinutes });
  }
}
