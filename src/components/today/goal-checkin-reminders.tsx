import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalCheckinToggle } from "@/components/goals/goal-checkin-toggle";
import type { GoalCheckinStatus } from "@/lib/services/goal-checkins";

/**
 * The primary Goals touchpoint on Home (docs/product-architecture.md §5.1 —
 * "what have I forgotten?"). Goals not yet done this period sort first so
 * the reminder is actually useful, not just a status log.
 */
export function GoalCheckinReminders({ checkins }: { checkins: GoalCheckinStatus[] }) {
  const sorted = [...checkins].sort((a, b) => Number(a.doneThisPeriod) - Number(b.doneThisPeriod));
  const pendingCount = checkins.filter((c) => !c.doneThisPeriod).length;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          Goal check-ins
          {pendingCount ? (
            <span className="ml-1.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700 dark:bg-orange-950/60 dark:text-orange-400">
              {pendingCount} not done
            </span>
          ) : null}
        </CardTitle>
        <Link href="/goals" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          All goals <ArrowRight className="size-3" />
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No goals with a check-in cadence yet — add one from Goals.
          </p>
        ) : (
          sorted.map(({ goal, doneThisPeriod, streak }) => (
            <Link
              key={goal.id}
              href={`/goals/${goal.id}`}
              className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-secondary/40"
            >
              <GoalCheckinToggle
                goalId={goal.id}
                frequency={goal.check_frequency}
                doneThisPeriod={doneThisPeriod}
                streak={streak}
                size="sm"
                showLabel={false}
              />
              <span className="truncate text-sm font-medium">{goal.title}</span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
