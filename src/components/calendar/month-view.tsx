import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/types";

export function MonthView({
  monthStart,
  events,
}: {
  monthStart: string; // YYYY-MM-01
  events: Tables<"calendar_events">[];
}) {
  const first = new Date(`${monthStart}T00:00:00`);
  const year = first.getFullYear();
  const month = first.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (first.getDay() + 6) % 7; // Monday = 0

  const cells: (Date | null)[] = Array(firstWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date().toDateString();
  const eventsByDay = new Map<string, Tables<"calendar_events">[]>();
  for (const event of events) {
    const key = event.starts_at.slice(0, 10);
    eventsByDay.set(key, [...(eventsByDay.get(key) ?? []), event]);
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const key = date.toISOString().slice(0, 10);
          const dayEvents = eventsByDay.get(key) ?? [];
          const isToday = date.toDateString() === today;
          return (
            <Link
              href={`/calendar?view=day&date=${key}`}
              key={key}
              className={cn(
                "flex min-h-16 flex-col gap-0.5 rounded-md border p-1.5 text-xs hover:bg-secondary/40",
                isToday && "border-primary",
              )}
            >
              <span className={cn("font-medium", isToday && "text-primary")}>{date.getDate()}</span>
              {dayEvents.slice(0, 2).map((e) => (
                <span key={e.id} className="truncate rounded bg-secondary px-1 py-0.5 text-[10px]">
                  {e.title}
                </span>
              ))}
              {dayEvents.length > 2 ? (
                <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 2} more</span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
