import type { Db } from "@/lib/types";
import type { CalendarProvider, CreateEventInput, DateRange, UpdateEventInput } from "./types";

/**
 * Reads/writes calendar_events directly. Every "external" provider added
 * later still lands its synced events in the same table (with
 * source_type='external' and an external_event_id) — the calendar UI never
 * needs to know which provider an event came from.
 */
export class MockCalendarProvider implements CalendarProvider {
  id = "mock";

  constructor(
    private readonly db: Db,
    private readonly userId: string,
  ) {}

  async listEvents(range: DateRange) {
    const { data, error } = await this.db
      .from("calendar_events")
      .select("*")
      .eq("user_id", this.userId)
      .neq("status", "cancelled")
      .gte("starts_at", range.from)
      .lte("starts_at", range.to)
      .order("starts_at", { ascending: true });
    if (error) throw error;
    return data;
  }

  async createEvent(input: CreateEventInput) {
    const { data, error } = await this.db
      .from("calendar_events")
      .insert({
        user_id: this.userId,
        title: input.title,
        description: input.description,
        location: input.location,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        all_day: input.allDay ?? false,
        source_type: input.sourceType ?? "manual",
      })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  async updateEvent(id: string, input: UpdateEventInput) {
    const { data, error } = await this.db
      .from("calendar_events")
      .update({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
        ...(input.startsAt !== undefined ? { starts_at: input.startsAt } : {}),
        ...(input.endsAt !== undefined ? { ends_at: input.endsAt } : {}),
        ...(input.allDay !== undefined ? { all_day: input.allDay } : {}),
      })
      .eq("id", id)
      .eq("user_id", this.userId)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  async deleteEvent(id: string) {
    const { error } = await this.db
      .from("calendar_events")
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId);
    if (error) throw error;
  }
}
