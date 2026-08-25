import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGoals, type GoalWithProgress } from "@/lib/services/goals";
import { getCheckinStatusForGoals } from "@/lib/services/goal-checkins";
import { getCategories } from "@/lib/services/categories";
import { GoalCard } from "@/components/goals/goal-card";
import { NewGoalDialog } from "@/components/goals/new-goal-dialog";
import { cn } from "@/lib/utils";

const TYPE_FILTERS = [
  { key: "all", label: "All" },
  { key: "life", label: "Life" },
  { key: "annual", label: "Annual" },
  { key: "quarterly", label: "Quarterly" },
  { key: "monthly", label: "Monthly" },
] as const;

type TypeFilterKey = (typeof TYPE_FILTERS)[number]["key"];

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; category?: string }>;
}) {
  const { type: typeParam, category: categoryParam } = await searchParams;
  const activeFilter = (TYPE_FILTERS.find((t) => t.key === typeParam)?.key ?? "all") as TypeFilterKey;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [allGoals, categories] = await Promise.all([
    getGoals(supabase, user.id, { status: "active" }),
    getCategories(supabase, user.id),
  ]);
  const checkinStatusByGoalId = await getCheckinStatusForGoals(supabase, user.id, allGoals);

  const activeCategoryId = categories.some((c) => c.id === categoryParam) ? categoryParam : undefined;
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const goals = allGoals
    .filter((g) => activeFilter === "all" || g.goal_type === activeFilter)
    .filter((g) => !activeCategoryId || g.category_id === activeCategoryId);

  const cadenced = goals.filter((g) => g.check_frequency !== "none");
  const dueNow = cadenced.filter((g) => !checkinStatusByGoalId.get(g.id)?.doneThisPeriod);
  const done = cadenced.filter((g) => checkinStatusByGoalId.get(g.id)?.doneThisPeriod);
  const milestoneGoals = goals.filter((g) => g.check_frequency === "none");

  function filterHref(next: { type?: string; category?: string }) {
    const params = new URLSearchParams();
    const nextType = next.type ?? activeFilter;
    const nextCategory = next.category ?? activeCategoryId;
    if (nextType !== "all") params.set("type", nextType);
    if (nextCategory) params.set("category", nextCategory);
    const qs = params.toString();
    return qs ? `/goals?${qs}` : "/goals";
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Goals</h1>
          <p className="text-sm text-muted-foreground">
            {allGoals.length} active
            {cadenced.length ? ` · ${dueNow.length} due now · ${done.length} done` : ""}
          </p>
        </div>
        <NewGoalDialog categories={categories} />
      </div>

      <div className="flex flex-wrap gap-1 border-b pb-2 text-sm">
        {TYPE_FILTERS.map((f) => (
          <Link
            key={f.key}
            href={filterHref({ type: f.key })}
            className={cn(
              "rounded-md px-2.5 py-1 text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              activeFilter === f.key && "bg-secondary font-medium text-foreground",
            )}
          >
            {f.label}
          </Link>
        ))}
        {categories.length ? (
          <>
            <span className="mx-1 self-center text-muted-foreground/40">·</span>
            <Link
              href={filterHref({ category: "" })}
              className={cn(
                "rounded-md px-2.5 py-1 text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                !activeCategoryId && "bg-secondary font-medium text-foreground",
              )}
            >
              All categories
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={filterHref({ category: c.id })}
                className={cn(
                  "rounded-md px-2.5 py-1 text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  activeCategoryId === c.id && "bg-secondary font-medium text-foreground",
                )}
              >
                {c.name}
              </Link>
            ))}
          </>
        ) : null}
      </div>

      {goals.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No active goals here yet. Start with one that matters.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          <GoalSection
            title="Due now"
            goals={dueNow}
            checkinStatusByGoalId={checkinStatusByGoalId}
            categoryById={categoryById}
            accent
          />
          <GoalSection
            title="Done"
            goals={done}
            checkinStatusByGoalId={checkinStatusByGoalId}
            categoryById={categoryById}
          />
          <GoalSection
            title="Milestone goals"
            goals={milestoneGoals}
            checkinStatusByGoalId={checkinStatusByGoalId}
            categoryById={categoryById}
          />
        </div>
      )}
    </div>
  );
}

function GoalSection({
  title,
  goals,
  checkinStatusByGoalId,
  categoryById,
  accent = false,
}: {
  title: string;
  goals: GoalWithProgress[];
  checkinStatusByGoalId: Map<string, { doneThisPeriod: boolean; streak: number }>;
  categoryById: Map<string, { name: string }>;
  accent?: boolean;
}) {
  if (goals.length === 0) return null;
  return (
    <div>
      <h2 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-medium normal-case tracking-normal",
            accent
              ? "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400"
              : "bg-secondary text-secondary-foreground",
          )}
        >
          {goals.length}
        </span>
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            checkinStatus={checkinStatusByGoalId.get(goal.id)}
            categoryName={goal.category_id ? categoryById.get(goal.category_id)?.name : undefined}
          />
        ))}
      </div>
    </div>
  );
}
