import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGoalById } from "@/lib/services/goals";
import { getGoalCheckinStats } from "@/lib/services/goal-checkins";
import { getTasks } from "@/lib/services/tasks";
import { getWorkouts } from "@/lib/services/training";
import { getCategories } from "@/lib/services/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GoalProgressBar } from "@/components/goals/goal-progress-bar";
import { GoalCheckinToggle } from "@/components/goals/goal-checkin-toggle";
import { MilestoneList } from "@/components/goals/milestone-list";
import { TaskList } from "@/components/tasks/task-list";

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const goal = await getGoalById(supabase, user.id, id);
  if (!goal) notFound();

  const [tasks, workouts, checkinStats, categories] = await Promise.all([
    getTasks(supabase, user.id, { goalId: id, includeCompleted: true }),
    getWorkouts(supabase, user.id, { goalId: id }),
    getGoalCheckinStats(supabase, user.id, goal),
    getCategories(supabase, user.id),
  ]);
  const categoryName = categories.find((c) => c.id === goal.category_id)?.name;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{goal.title}</h1>
          <Badge variant="outline" className="capitalize">
            {goal.goal_type}
          </Badge>
          {categoryName ? <Badge variant="secondary">{categoryName}</Badge> : null}
        </div>
        {goal.why_it_matters ? (
          <p className="mt-1 text-sm text-muted-foreground">{goal.why_it_matters}</p>
        ) : null}
      </div>

      {checkinStats ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Check-in</CardTitle>
            <Link
              href={`/goals/${goal.id}/stats`}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Stats <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <GoalCheckinToggle
              goalId={goal.id}
              frequency={goal.check_frequency}
              doneThisPeriod={checkinStats.recentPeriods.at(-1)?.done ?? false}
              streak={checkinStats.streak.current}
            />
            <span className="text-xs text-muted-foreground">
              {checkinStats.completionRate}% of the last {checkinStats.windowPeriods}
            </span>
          </CardContent>
        </Card>
      ) : null}

      <GoalProgressBar progress={goal.progress} label="Progress" />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <MilestoneList goalId={goal.id} milestones={goal.milestones} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Linked tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskList tasks={tasks} emptyMessage="No tasks linked to this goal yet." />
        </CardContent>
      </Card>

      {workouts.length ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Linked training</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1.5 text-sm">
              {workouts.map((w) => (
                <li key={w.id} className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {w.activity_type}
                  </Badge>
                  <span className="text-muted-foreground">
                    {w.scheduled_date ?? w.completed_at?.slice(0, 10)} · {w.status}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
