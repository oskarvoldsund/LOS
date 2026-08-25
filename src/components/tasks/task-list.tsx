import { TaskItem } from "./task-item";
import type { Tables } from "@/lib/types";

export function TaskList({
  tasks,
  emptyMessage = "Nothing here.",
}: {
  tasks: Tables<"tasks">[];
  emptyMessage?: string;
}) {
  if (tasks.length === 0) {
    return <p className="px-2 py-6 text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  );
}
