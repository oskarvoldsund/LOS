import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/lib/types";

const STYLES: Record<TaskPriority, string> = {
  urgent: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400",
  high: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-400",
  medium: "border-transparent bg-secondary text-secondary-foreground",
  low: "border-transparent bg-transparent text-muted-foreground",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  if (priority === "medium") return null;
  return (
    <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px] font-medium capitalize", STYLES[priority])}>
      {priority}
    </Badge>
  );
}
