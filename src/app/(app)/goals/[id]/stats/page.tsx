import Link from "next/link";
import { ArrowLeft, Flame } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGoalById } from "@/lib/services/goals";
import { getGoalCheckinStats } from "@/lib/services/goal-checkins";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckinHeatmap } from "@/components/goals/checkin-heatmap";

const HISTORY_WINDOW: Record<"daily" | "weekly" | "monthly", number> = {
  daily: 90,
  weekly: 26,
  monthly: 24,
};

export default async function GoalStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const goal = await getGoalById(supabase, user.id, id);
  if (!goal) notFound();
  if (goal.check_frequency === "none") redirect(`/goals/${id}`);

  const stats = await getGoalCheckinStats(
    supabase,
    user.id,
    goal,
    new Date(),
    HISTORY_WINDOW[goal.check_frequency],
  );
  if (!stats) redirect(`/goals/${id}`);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href={`/goals/${id}`}
          className="mb-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          {goal.title}
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Check-in stats</h1>
        <p className="text-sm text-muted-foreground capitalize">{goal.check_frequency} cadence</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Current streak"
          value={String(stats.streak.current)}
          icon={<Flame className="size-4 text-orange-500" />}
        />
        <StatCard label="Longest streak" value={String(stats.streak.longest)} />
        <StatCard label={`Last ${stats.windowPeriods}`} value={`${stats.completionRate}%`} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">History</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckinHeatmap periods={stats.recentPeriods} />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <Card className="py-3">
      <CardContent className="flex flex-col gap-0.5 px-4">
        <span className="flex items-center gap-1.5 text-xl font-semibold tabular-nums">
          {icon}
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}
