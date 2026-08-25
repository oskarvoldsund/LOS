import { Progress } from "@/components/ui/progress";

export function GoalProgressBar({ progress, label }: { progress: number; label?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span>{progress}%</span>
        </div>
      ) : null}
      <Progress value={progress} className="h-1.5" />
    </div>
  );
}
