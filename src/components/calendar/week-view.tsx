import { formatEventTimeRange } from "@/lib/format";
import { DeleteEventButton } from "./delete-event-button";
import type { Tables } from "@/lib/types";

export function WeekView({
  weekStartDate,
  events,
}: {
  weekStartDate: string;
  events: Tables<"calendar_events">[];
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${weekStartDate}T00:00:00`);
    d.setDate(d.getDate() + i);
    return d;
  });

  const today = new Date().toDateString();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day) => {
        const dayKey = day.toISOString().slice(0, 10);
        const dayEvents = events
          .filter((e) => e.starts_at.slice(0, 10) === dayKey)
          .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
        const isToday = day.toDateString() === today;

        return (
          <div key={dayKey} className="flex flex-col gap-1.5">
            <div
              className={
                isToday
                  ? "rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
                  : "px-2 py-1 text-xs font-medium text-muted-foreground"
              }
            >
              {day.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
            </div>
            <div className="flex flex-col gap-1">
              {dayEvents.length === 0 ? (
                <div className="px-2 text-xs text-muted-foreground/60">—</div>
              ) : (
                dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="group flex items-start justify-between gap-1 rounded-md bg-secondary/50 px-2 py-1.5 text-xs"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{event.title}</span>
                      <span className="text-muted-foreground">
                        {event.all_day ? "All day" : formatEventTimeRange(event.starts_at, event.ends_at)}
                      </span>
                    </div>
                    <DeleteEventButton id={event.id} />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
