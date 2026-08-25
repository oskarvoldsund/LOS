import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getTrainingPlan,
  getTrainingHistory,
  getTrainingStats,
  getTrainingStatsByActivity,
} from "@/lib/services/training";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkoutItem } from "@/components/training/workout-item";
import { NewWorkoutDialog } from "@/components/training/new-workout-dialog";
import { LogWorkoutDialog } from "@/components/training/log-workout-dialog";
import { ActivityStatsList } from "@/components/training/activity-stats";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ACTIVITY_TYPES } from "@/lib/training-constants";
import { cn } from "@/lib/utils";
import type { ActivityType } from "@/lib/types";

const RANGE_FILTERS = [
  { key: "week", label: "This week", days: 7 },
  { key: "month", label: "This month", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
  { key: "all", label: "All time", days: 3650 },
] as const;

type RangeKey = (typeof RANGE_FILTERS)[number]["key"];

export default async function TrainingPage({
  searchParams,
}: {
  searchParams: Promise<{ activity?: string; range?: string }>;
}) {
  const { activity, range } = await searchParams;
  const activeRange = (RANGE_FILTERS.find((r) => r.key === range)?.key ?? "90d") as RangeKey;
  const rangeDays = RANGE_FILTERS.find((r) => r.key === activeRange)!.days;
  const activeActivity = ACTIVITY_TYPES.includes(activity as ActivityType) ? (activity as ActivityType) : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [plan, history, stats, activityStats] = await Promise.all([
    getTrainingPlan(supabase, user.id),
    getTrainingHistory(supabase, user.id, 60),
    getTrainingStats(supabase, user.id),
    getTrainingStatsByActivity(supabase, user.id, rangeDays, activeActivity),
  ]);

  function filterHref(next: { activity?: string; range?: string }) {
    const params = new URLSearchParams();
    const nextActivity = next.activity ?? activeActivity;
    const nextRange = next.range ?? activeRange;
    if (nextActivity) params.set("activity", nextActivity);
    if (nextRange !== "90d") params.set("range", nextRange);
    const qs = params.toString();
    return qs ? `/training?${qs}` : "/training";
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Training</h1>
          <p className="text-sm text-muted-foreground">Plan ahead, log what actually happened.</p>
        </div>
        <div className="flex gap-2">
          <LogWorkoutDialog
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="size-4" />
                Log workout
              </Button>
            }
          />
          <NewWorkoutDialog />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Planned this week" value={stats.plannedThisWeek} />
        <StatCard label="Completed this week" value={stats.completedThisWeek} />
        <StatCard label="Minutes (30d)" value={stats.totalMinutesLast30Days} />
      </div>

      <Card>
        <CardHeader className="flex-col items-start gap-2 pb-2">
          <CardTitle className="text-sm font-medium">By activity</CardTitle>
          <div className="flex flex-wrap gap-1 text-xs">
            {RANGE_FILTERS.map((r) => (
              <Link
                key={r.key}
                href={filterHref({ range: r.key })}
                className={cn(
                  "rounded-md px-2 py-1 text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  activeRange === r.key && "bg-secondary font-medium text-foreground",
                )}
              >
                {r.label}
              </Link>
            ))}
            <span className="mx-1 text-muted-foreground/40">·</span>
            <Link
              href={filterHref({ activity: "" })}
              className={cn(
                "rounded-md px-2 py-1 text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                !activeActivity && "bg-secondary font-medium text-foreground",
              )}
            >
              All
            </Link>
            {ACTIVITY_TYPES.map((a) => (
              <Link
                key={a}
                href={filterHref({ activity: a })}
                className={cn(
                  "rounded-md px-2 py-1 capitalize text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  activeActivity === a && "bg-secondary font-medium text-foreground",
                )}
              >
                {a}
              </Link>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <ActivityStatsList stats={activityStats} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Training plan</CardTitle>
        </CardHeader>
        <CardContent>
          {plan.length ? (
            <div className="flex flex-col gap-0.5">
              {plan.map((w) => (
                <WorkoutItem key={w.id} workout={w} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing planned yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Training log</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length ? (
            <div className="flex flex-col gap-0.5">
              {history.map((w) => (
                <WorkoutItem key={w.id} workout={w} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No completed workouts yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="py-3">
      <CardContent className="flex flex-col gap-0.5 px-4">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}
