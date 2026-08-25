import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTodayContext } from "@/lib/services/dashboard";
import { getWeeklyProgress } from "@/lib/services/weekly-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskList } from "@/components/tasks/task-list";
import { GoalCheckinReminders } from "@/components/today/goal-checkin-reminders";
import { QuickAddBar } from "@/components/home/quick-add-bar";
import { WeeklyProgressBars } from "@/components/home/weekly-progress-bars";
import { Dumbbell, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [context, weeklyProgress] = await Promise.all([
    getTodayContext(supabase, user.id),
    getWeeklyProgress(supabase, user.id),
  ]);

  const dateLabel = new Date(`${context.date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <QuickAddBar today={context.date} />

      <div>
        <h1 className="text-xl font-semibold tracking-tight">{dateLabel}</h1>
        <p className="text-sm text-muted-foreground">
          {context.todayTasks.length} task{context.todayTasks.length === 1 ? "" : "s"} today
          {context.overdueTasks.length ? ` · ${context.overdueTasks.length} overdue` : ""}
        </p>
      </div>

      <WeeklyProgressBars progress={weeklyProgress} />

      <GoalCheckinReminders checkins={context.goalCheckins} />

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Today</CardTitle>
          <Link href="/tasks?view=today" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            All tasks <ArrowRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <TaskList tasks={context.todayTasks} emptyMessage="Nothing due today." />
        </CardContent>
      </Card>

      {context.overdueTasks.length ? (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList tasks={context.overdueTasks.slice(0, 5)} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Dumbbell className="size-4" />
            Training today
          </CardTitle>
        </CardHeader>
        <CardContent>
          {context.plannedWorkout ? (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="capitalize">
                {context.plannedWorkout.activity_type}
              </Badge>
              {context.plannedWorkout.scheduled_time ? (
                <span className="text-muted-foreground">at {context.plannedWorkout.scheduled_time}</span>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing planned — rest day, or add one.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
