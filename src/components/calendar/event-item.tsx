import { formatEventTimeRange } from "@/lib/format";
import type { Tables } from "@/lib/types";

export function EventItem({ event }: { event: Tables<"calendar_events"> }) {
  return (
    <div className="flex items-center gap-3 px-2 py-1.5 text-sm">
      <span className="w-32 shrink-0 text-xs text-muted-foreground tabular-nums">
        {event.all_day ? "All day" : formatEventTimeRange(event.starts_at, event.ends_at)}
      </span>
      <span className="truncate">{event.title}</span>
    </div>
  );
}
