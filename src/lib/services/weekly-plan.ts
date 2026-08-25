import type { Db, Tables } from "@/lib/types";
import { getTasks } from "./tasks";
import { getGoals } from "./goals";
import { getWorkouts } from "./training";
import { getCalendarEvents, findFreeCalendarSlots } from "./calendar";
import { getRoutines } from "./routines";

export function isoWeekStart(date = new Date()): string {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function isoWeekEnd(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

export async function getOrCreateWeeklyPlan(
  db: Db,
  userId: string,
  weekStartDate = isoWeekStart(),
): Promise<Tables<"weekly_plans">> {
  const { data: existing, error: findError } = await db
    .from("weekly_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start_date", weekStartDate)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing;

  const { data: created, error: insertError } = await db
    .from("weekly_plans")
    .insert({ user_id: userId, week_start_date: weekStartDate })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return created;
}

export async function getWeeklyPriorities(
  db: Db,
  userId: string,
  weeklyPlanId: string,
): Promise<Tables<"weekly_priorities">[]> {
  const { data, error } = await db
    .from("weekly_priorities")
    .select("*")
    .eq("user_id", userId)
    .eq("weekly_plan_id", weeklyPlanId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data;
}

export interface SetPriorityInput {
  title: string;
  taskId?: string;
  goalId?: string;
}

/** Replaces all priorities for the plan (max 3) — see AIAction write-tool of the same name. */
export async function setWeeklyPriorities(
  db: Db,
  userId: string,
  weeklyPlanId: string,
  priorities: SetPriorityInput[],
): Promise<Tables<"weekly_priorities">[]> {
  const capped = priorities.slice(0, 3);
  const { error: deleteError } = await db
    .from("weekly_priorities")
    .delete()
    .eq("user_id", userId)
    .eq("weekly_plan_id", weeklyPlanId);
  if (deleteError) throw deleteError;

  const { data, error } = await db
    .from("weekly_priorities")
    .insert(
      capped.map((p, i) => ({
        user_id: userId,
        weekly_plan_id: weeklyPlanId,
        title: p.title,
        task_id: p.taskId,
        goal_id: p.goalId,
        sort_order: i + 1,
      })),
    )
    .select("*");
  if (error) throw error;
  return data;
}

export interface WeeklyContext {
  weekStartDate: string;
  weekEndDate: string;
  calendarEvents: Tables<"calendar_events">[];
  unfinishedTasks: Tables<"tasks">[];
  activeGoals: Awaited<ReturnType<typeof getGoals>>;
  plannedWorkouts: Tables<"workouts">[];
  routines: Tables<"routines">[];
  freeSlots: Awaited<ReturnType<typeof findFreeCalendarSlots>>;
  priorities: Tables<"weekly_priorities">[];
}

/**
 * The single entry point Claude's `get_weekly_context` tool calls, and what
 * the Weekly Planner page renders. One assembled, minimum-necessary bundle
 * instead of five separate broad queries — see docs/claude-integration.md §5.
 */
export async function getWeeklyContext(
  db: Db,
  userId: string,
  weekStartDate = isoWeekStart(),
): Promise<WeeklyContext> {
  const weekEndDate = isoWeekEnd(weekStartDate);
  const plan = await getOrCreateWeeklyPlan(db, userId, weekStartDate);

  const [calendarEvents, unfinishedTasks, activeGoals, plannedWorkouts, routines, freeSlots, priorities] =
    await Promise.all([
      getCalendarEvents(db, userId, {
        from: `${weekStartDate}T00:00:00.000Z`,
        to: `${weekEndDate}T23:59:59.999Z`,
      }),
      getTasks(db, userId, { dueBefore: weekEndDate, status: ["inbox", "todo", "in_progress"] }),
      getGoals(db, userId, { status: "active" }),
      getWorkouts(db, userId, { from: weekStartDate, to: weekEndDate }),
      getRoutines(db, userId),
      findFreeCalendarSlots(db, userId, {
        from: `${weekStartDate}T00:00:00.000Z`,
        to: `${weekEndDate}T23:59:59.999Z`,
      }),
      getWeeklyPriorities(db, userId, plan.id),
    ]);

  return {
    weekStartDate,
    weekEndDate,
    calendarEvents,
    unfinishedTasks,
    activeGoals,
    plannedWorkouts,
    routines,
    freeSlots,
    priorities,
  };
}
