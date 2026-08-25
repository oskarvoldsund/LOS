import { cn } from "@/lib/utils";

export function CheckinHeatmap({ periods }: { periods: { period: string; done: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {periods.map((p) => (
        <div
          key={p.period}
          title={`${p.period}${p.done ? " — done" : ""}`}
          className={cn(
            "size-3.5 rounded-sm",
            p.done ? "bg-orange-500 dark:bg-orange-500/80" : "bg-secondary",
          )}
        />
      ))}
    </div>
  );
}
