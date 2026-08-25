import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTasks } from "@/lib/services/tasks";
import { getCategories } from "@/lib/services/categories";
import { getGoals } from "@/lib/services/goals";
import { TaskList } from "@/components/tasks/task-list";
import { NewTaskInput } from "@/components/tasks/new-task-input";
import { cn } from "@/lib/utils";
import { todayIso } from "@/lib/format";
import type { Tables } from "@/lib/types";

const VIEWS = [
  { key: "inbox", label: "Inbox" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "by-category", label: "By Category" },
  { key: "by-goal", label: "By Goal" },
] as const;

type ViewKey = (typeof VIEWS)[number]["key"];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: viewParam } = await searchParams;
  const view = (VIEWS.find((v) => v.key === viewParam)?.key ?? "inbox") as ViewKey;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = todayIso();
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));

  let tasks: Tables<"tasks">[] = [];
  let categories: Tables<"categories">[] = [];
  let goals: Awaited<ReturnType<typeof getGoals>> = [];

  if (view === "inbox") {
    tasks = await getTasks(supabase, user.id, { status: "inbox" });
  } else if (view === "today") {
    tasks = await getTasks(supabase, user.id, {
      dueBefore: today,
      status: ["todo", "in_progress", "inbox"],
    });
  } else if (view === "week") {
    tasks = await getTasks(supabase, user.id, {
      dueAfter: today,
      dueBefore: weekEnd.toISOString().slice(0, 10),
      status: ["todo", "in_progress"],
    });
  } else if (view === "upcoming") {
    tasks = await getTasks(supabase, user.id, {
      dueAfter: today,
      status: ["todo", "in_progress", "inbox"],
    });
  } else if (view === "completed") {
    tasks = await getTasks(supabase, user.id, { status: "completed", includeCompleted: true });
  } else if (view === "by-category") {
    [tasks, categories] = await Promise.all([
      getTasks(supabase, user.id, { status: ["inbox", "todo", "in_progress"] }),
      getCategories(supabase, user.id),
    ]);
  } else if (view === "by-goal") {
    [tasks, goals] = await Promise.all([
      getTasks(supabase, user.id, { status: ["inbox", "todo", "in_progress"] }),
      getGoals(supabase, user.id),
    ]);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-sm text-muted-foreground">Capture fast, organize later.</p>
      </div>

      <NewTaskInput defaultStatus={view === "inbox" ? "inbox" : "todo"} />

      <div className="flex flex-wrap gap-1 border-b pb-2 text-sm">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={`/tasks?view=${v.key}`}
            className={cn(
              "rounded-md px-2.5 py-1 text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              view === v.key && "bg-secondary font-medium text-foreground",
            )}
          >
            {v.label}
          </Link>
        ))}
      </div>

      {view === "by-category" ? (
        <div className="flex flex-col gap-6">
          {categories.map((category) => (
            <div key={category.id}>
              <h2 className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {category.name}
              </h2>
              <TaskList
                tasks={tasks.filter((t) => t.category_id === category.id)}
                emptyMessage="No tasks."
              />
            </div>
          ))}
          <div>
            <h2 className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Uncategorized
            </h2>
            <TaskList tasks={tasks.filter((t) => !t.category_id)} emptyMessage="No tasks." />
          </div>
        </div>
      ) : view === "by-goal" ? (
        <div className="flex flex-col gap-6">
          {goals.map((goal) => (
            <div key={goal.id}>
              <h2 className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {goal.title}
              </h2>
              <TaskList tasks={tasks.filter((t) => t.goal_id === goal.id)} emptyMessage="No tasks." />
            </div>
          ))}
          <div>
            <h2 className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Not linked to a goal
            </h2>
            <TaskList tasks={tasks.filter((t) => !t.goal_id)} emptyMessage="No tasks." />
          </div>
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          emptyMessage={view === "inbox" ? "Inbox zero. Nice." : "Nothing here."}
        />
      )}
    </div>
  );
}
