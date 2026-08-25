import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCalendarEvents } from "@/lib/services/calendar";
import { isoWeekStart } from "@/lib/services/weekly-plan";
import { WeekView } from "@/components/calendar/week-view";
import { DayView } from "@/components/calendar/day-view";
import { MonthView } from "@/components/calendar/month-view";
import { NewEventDialog } from "@/components/calendar/new-event-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { todayIso } from "@/lib/format";

const VIEWS = ["day", "week", "month"] as const;
type ViewKey = (typeof VIEWS)[number];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const { view: viewParam, date: dateParam } = await searchParams;
  const view = (VIEWS.includes(viewParam as ViewKey) ? viewParam : "week") as ViewKey;
  const date = dateParam ?? todayIso();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { rangeFrom, rangeTo, title } = getRange(view, date);
  const events = await getCalendarEvents(supabase, user.id, {
    from: `${rangeFrom}T00:00:00.000Z`,
    to: `${rangeTo}T23:59:59.999Z`,
  });

  const { prev, next } = getAdjacent(view, date);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        <NewEventDialog defaultDate={date} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            nativeButton={false}
            render={
              <Link href={`/calendar?view=${view}&date=${prev}`}>
                <ChevronLeft className="size-4" />
              </Link>
            }
          />
          <Button
            size="icon"
            variant="ghost"
            nativeButton={false}
            render={
              <Link href={`/calendar?view=${view}&date=${next}`}>
                <ChevronRight className="size-4" />
              </Link>
            }
          />
          <Button
            size="sm"
            variant="ghost"
            nativeButton={false}
            render={<Link href={`/calendar?view=${view}&date=${todayIso()}`}>Today</Link>}
          />
        </div>
        <div className="flex gap-1 rounded-md border p-0.5">
          {VIEWS.map((v) => (
            <Link
              key={v}
              href={`/calendar?view=${v}&date=${date}`}
              className={cn(
                "rounded px-2.5 py-1 text-xs capitalize text-muted-foreground hover:text-foreground",
                view === v && "bg-secondary font-medium text-foreground",
              )}
            >
              {v}
            </Link>
          ))}
        </div>
      </div>

      {view === "day" ? <DayView events={events} /> : null}
      {view === "week" ? <WeekView weekStartDate={rangeFrom} events={events} /> : null}
      {view === "month" ? <MonthView monthStart={rangeFrom} events={events} /> : null}
    </div>
  );
}

function getRange(view: ViewKey, date: string): { rangeFrom: string; rangeTo: string; title: string } {
  const d = new Date(`${date}T00:00:00`);
  if (view === "day") {
    return { rangeFrom: date, rangeTo: date, title: d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) };
  }
  if (view === "month") {
    const monthStart = `${date.slice(0, 7)}-01`;
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return {
      rangeFrom: monthStart,
      rangeTo: lastDay.toISOString().slice(0, 10),
      title: d.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    };
  }
  const weekStart = isoWeekStart(d);
  const weekEnd = new Date(`${weekStart}T00:00:00`);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return {
    rangeFrom: weekStart,
    rangeTo: weekEnd.toISOString().slice(0, 10),
    title: `Week of ${new Date(`${weekStart}T00:00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric" })}`,
  };
}

function getAdjacent(view: ViewKey, date: string): { prev: string; next: string } {
  const d = new Date(`${date}T00:00:00`);
  const deltaDays = view === "day" ? 1 : view === "week" ? 7 : 30;
  const prev = new Date(d);
  prev.setDate(prev.getDate() - deltaDays);
  const next = new Date(d);
  next.setDate(next.getDate() + deltaDays);
  return { prev: prev.toISOString().slice(0, 10), next: next.toISOString().slice(0, 10) };
}
