import { Badge } from "@/components/ui/badge";
import type { ActivityStats } from "@/lib/services/training";

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function ActivityStatsList({ stats }: { stats: ActivityStats[] }) {
  if (stats.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing logged yet.</p>;
  }

  return (
    <div className="flex flex-col divide-y">
      {stats.map((s) => (
        <div key={s.activityType} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
          <Badge variant="secondary" className="w-24 shrink-0 justify-center capitalize">
            {s.activityType}
          </Badge>
          <div className="flex flex-1 justify-end gap-4 text-sm">
            <span>
              <span className="font-medium tabular-nums">{s.sessions}</span>{" "}
              <span className="text-muted-foreground">session{s.sessions === 1 ? "" : "s"}</span>
            </span>
            {s.totalDistanceKm > 0 ? (
              <span>
                <span className="font-medium tabular-nums">{s.totalDistanceKm.toFixed(1)}</span>{" "}
                <span className="text-muted-foreground">km</span>
              </span>
            ) : null}
            {s.totalMinutes > 0 ? (
              <span>
                <span className="font-medium tabular-nums">{formatDuration(s.totalMinutes)}</span>
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
