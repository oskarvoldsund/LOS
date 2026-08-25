import { formatEventTimeRange } from "@/lib/format";
import { DeleteEventButton } from "./delete-event-button";
import type { Tables } from "@/lib/types";

export function DayView({ events }: { events: Tables<"calendar_events">[] }) {
  const sorted = [...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  if (sorted.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Nothing scheduled.</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {sorted.map((event) => (
        <div key={event.id} className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-secondary/40">
          <span className="w-36 shrink-0 text-sm text-muted-foreground tabular-nums">
            {event.all_day ? "All day" : formatEventTimeRange(event.starts_at, event.ends_at)}
          </span>
          <span className="flex-1 text-sm">{event.title}</span>
          <DeleteEventButton id={event.id} />
        </div>
      ))}
    </div>
  );
}
