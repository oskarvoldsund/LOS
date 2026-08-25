import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GoalProgressBar } from "./goal-progress-bar";
import { GoalCheckinToggle } from "./goal-checkin-toggle";
import type { GoalWithProgress } from "@/lib/services/goals";

export function GoalCard({
  goal,
  checkinStatus,
  categoryName,
}: {
  goal: GoalWithProgress;
  checkinStatus?: { doneThisPeriod: boolean; streak: number };
  categoryName?: string;
}) {
  const cadenced = goal.check_frequency !== "none";

  return (
    <Link href={`/goals/${goal.id}`}>
      <Card
        className={
          cadenced && checkinStatus?.doneThisPeriod
            ? "border-orange-200 bg-orange-50/40 transition-colors hover:bg-orange-50/70 dark:border-orange-900 dark:bg-orange-950/10 dark:hover:bg-orange-950/20"
            : "transition-colors hover:bg-secondary/30"
        }
      >
        {cadenced ? (
          <CardContent className="flex flex-col gap-3 pt-6">
            <div className="flex items-center gap-3">
              <GoalCheckinToggle
                goalId={goal.id}
                frequency={goal.check_frequency}
                doneThisPeriod={checkinStatus?.doneThisPeriod ?? false}
                streak={checkinStatus?.streak ?? 0}
                showLabel={false}
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{goal.title}</span>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  <Badge variant="outline" className="w-fit text-xs capitalize">
                    {goal.goal_type}
                  </Badge>
                  {categoryName ? (
                    <Badge variant="secondary" className="w-fit text-xs">
                      {categoryName}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
            <GoalProgressBar progress={goal.progress} />
          </CardContent>
        ) : (
          <>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{goal.title}</CardTitle>
              <div className="flex gap-1">
                <Badge variant="outline" className="capitalize text-xs">
                  {goal.goal_type}
                </Badge>
                {categoryName ? (
                  <Badge variant="secondary" className="text-xs">
                    {categoryName}
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <GoalProgressBar progress={goal.progress} />
              {goal.milestones.length ? (
                <p className="text-xs text-muted-foreground">
                  {goal.milestones.filter((m) => m.status === "done").length}/{goal.milestones.length} milestones
                </p>
              ) : null}
            </CardContent>
          </>
        )}
      </Card>
    </Link>
  );
}
