import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgressBar, WeeklyProgress } from "@/lib/services/weekly-progress";

export function WeeklyProgressBars({ progress }: { progress: WeeklyProgress }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">This week</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {progress.bars.map((bar) => (
          <Bar key={bar.label} {...bar} />
        ))}
      </CardContent>
    </Card>
  );
}

function Bar({ label, done, total, streak }: ProgressBar) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="flex items-center gap-2">
          {streak ? (
            <span className="flex items-center gap-0.5 font-medium text-orange-600 dark:text-orange-400">
              <Flame className="size-3" />
              {streak}
            </span>
          ) : null}
          <span className="font-medium tabular-nums">
            {done}/{total}
          </span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-orange-100 dark:bg-orange-950/40">
        <div
          className="h-full rounded-full bg-orange-400 transition-all dark:bg-orange-500"
          style={{ width: `${total > 0 ? pct : 0}%` }}
        />
      </div>
    </div>
  );
}
