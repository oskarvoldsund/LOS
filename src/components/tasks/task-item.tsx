"use client";

import { useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { PriorityBadge } from "./priority-badge";
import { formatDueDate } from "@/lib/format";
import { toggleTaskComplete } from "@/lib/actions/tasks";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/types";

export function TaskItem({ task }: { task: Tables<"tasks"> }) {
  const [pending, startTransition] = useTransition();
  const completed = task.status === "completed";
  const overdue =
    !completed && task.due_date && new Date(task.due_date) < new Date(new Date().toDateString());

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-secondary/50",
        pending && "opacity-60",
      )}
    >
      <Checkbox
        checked={completed}
        onCheckedChange={(checked) =>
          startTransition(() => {
            void toggleTaskComplete(task.id, checked === true);
          })
        }
        className="shrink-0"
      />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className={cn("truncate text-sm", completed && "text-muted-foreground line-through")}>
          {task.title}
        </span>
        <PriorityBadge priority={task.priority} />
      </div>
      {task.due_date ? (
        <span className={cn("shrink-0 text-xs text-muted-foreground", overdue && "text-destructive")}>
          {formatDueDate(task.due_date)}
        </span>
      ) : null}
    </div>
  );
}
