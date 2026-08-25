import type { Db, GoalCheckFrequency, Tables } from "@/lib/types";
import { isoWeekStart } from "./weekly-plan";

/** Normalizes a date to the period key for a given cadence. */
export function periodKey(frequency: GoalCheckFrequency, date = new Date()): string {
  if (frequency === "weekly") return isoWeekStart(date);
  if (frequency === "monthly") return firstOfMonth(date);
  return date.toISOString().slice(0, 10);
}

function firstOfMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function stepPeriod(periodDateIso: string, frequency: GoalCheckFrequency, deltaPeriods: number): string {
  const d = new Date(`${periodDateIso}T00:00:00`);
  if (frequency === "monthly") {
    d.setMonth(d.getMonth() + deltaPeriods);
    return firstOfMonth(d);
  }
  if (frequency === "weekly") {
    d.setDate(d.getDate() + deltaPeriods * 7);
    return isoWeekStart(d);
  }
  d.setDate(d.getDate() + deltaPeriods);
  return d.toISOString().slice(0, 10);
}

export async function getCheckinsForGoal(
  db: Db,
  userId: string,
  goalId: string,
  limit = 400,
): Promise<Tables<"goal_checkins">[]> {
  const { data, error } = await db
    .from("goal_checkins")
    .select("*")
    .eq("user_id", userId)
    .eq("goal_id", goalId)
    .order("period_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function checkInGoal(
  db: Db,
  userId: string,
  goalId: string,
  frequency: GoalCheckFrequency,
  date = new Date(),
): Promise<Tables<"goal_checkins">> {
  const { data, error } = await db
    .from("goal_checkins")
    .upsert(
      { user_id: userId, goal_id: goalId, period_date: periodKey(frequency, date) },
      { onConflict: "goal_id,period_date" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function uncheckInGoal(
  db: Db,
  userId: string,
  goalId: string,
  frequency: GoalCheckFrequency,
  date = new Date(),
): Promise<void> {
  const { error } = await db
    .from("goal_checkins")
    .delete()
    .eq("user_id", userId)
    .eq("goal_id", goalId)
    .eq("period_date", periodKey(frequency, date));
  if (error) throw error;
}

export interface GoalStreak {
  current: number;
  longest: number;
}

/** Pure — takes period_date strings (any order), returns streak info. */
export function computeStreak(periodDates: string[], frequency: GoalCheckFrequency, now = new Date()): GoalStreak {
  if (periodDates.length === 0) return { current: 0, longest: 0 };
  const set = new Set(periodDates);

  const today = periodKey(frequency, now);
  let current = 0;
  let cursor = set.has(today) ? today : stepPeriod(today, frequency, -1);
  while (set.has(cursor)) {
    current++;
    cursor = stepPeriod(cursor, frequency, -1);
  }

  const sortedAsc = [...set].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const p of sortedAsc) {
    run = prev && stepPeriod(prev, frequency, 1) === p ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = p;
  }

  return { current, longest: Math.max(longest, current) };
}

/** % of the last `windowPeriods` periods (ending at the current one) that have a check-in. */
export function computeCompletionRate(
  periodDates: string[],
  frequency: GoalCheckFrequency,
  windowPeriods: number,
  now = new Date(),
): number {
  const set = new Set(periodDates);
  let cursor = periodKey(frequency, now);
  let done = 0;
  for (let i = 0; i < windowPeriods; i++) {
    if (set.has(cursor)) done++;
    cursor = stepPeriod(cursor, frequency, -1);
  }
  return Math.round((done / windowPeriods) * 100);
}

const DEFAULT_WINDOW: Record<Exclude<GoalCheckFrequency, "none">, number> = {
  daily: 30,
  weekly: 12,
  monthly: 12,
};

export interface GoalCheckinStats {
  streak: GoalStreak;
  completionRate: number;
  windowPeriods: number;
  recentPeriods: { period: string; done: boolean }[];
}

export async function getGoalCheckinStats(
  db: Db,
  userId: string,
  goal: Tables<"goals">,
  now = new Date(),
  windowOverride?: number,
): Promise<GoalCheckinStats | null> {
  if (goal.check_frequency === "none") return null;
  const frequency = goal.check_frequency;
  const checkins = await getCheckinsForGoal(db, userId, goal.id);
  const periodDates = checkins.map((c) => c.period_date);
  const windowPeriods = windowOverride ?? DEFAULT_WINDOW[frequency];

  const recentPeriods: { period: string; done: boolean }[] = [];
  let cursor = periodKey(frequency, now);
  const set = new Set(periodDates);
  for (let i = 0; i < windowPeriods; i++) {
    recentPeriods.unshift({ period: cursor, done: set.has(cursor) });
    cursor = stepPeriod(cursor, frequency, -1);
  }

  return {
    streak: computeStreak(periodDates, frequency, now),
    completionRate: computeCompletionRate(periodDates, frequency, windowPeriods, now),
    windowPeriods,
    recentPeriods,
  };
}

export interface GoalCheckinStatus {
  goal: Tables<"goals">;
  doneThisPeriod: boolean;
  streak: number;
}

/** Batch current-period status + streak for a set of (cadenced) goals in one query. */
export async function getCheckinStatusForGoals(
  db: Db,
  userId: string,
  goals: Tables<"goals">[],
): Promise<Map<string, { doneThisPeriod: boolean; streak: number }>> {
  const cadenced = goals.filter((g) => g.check_frequency !== "none");
  const result = new Map<string, { doneThisPeriod: boolean; streak: number }>();
  if (cadenced.length === 0) return result;

  const { data: checkins, error } = await db
    .from("goal_checkins")
    .select("*")
    .eq("user_id", userId)
    .in(
      "goal_id",
      cadenced.map((g) => g.id),
    );
  if (error) throw error;

  for (const goal of cadenced) {
    const periodDates = checkins.filter((c) => c.goal_id === goal.id).map((c) => c.period_date);
    const today = periodKey(goal.check_frequency, new Date());
    result.set(goal.id, {
      doneThisPeriod: periodDates.includes(today),
      streak: computeStreak(periodDates, goal.check_frequency).current,
    });
  }
  return result;
}

/**
 * Every active, cadenced goal with its current-period status and streak, so
 * the UI can show a checkbox + a "not done yet" reminder in one place.
 * `frequencies` narrows which cadences to include — Home only wants
 * daily/weekly (monthly goals don't need a front-page reminder), while
 * other callers (e.g. the weekly stats bar) want every cadence.
 */
export async function getGoalCheckinReminders(
  db: Db,
  userId: string,
  frequencies: GoalCheckFrequency[] = ["daily", "weekly", "monthly"],
): Promise<GoalCheckinStatus[]> {
  const { data: goals, error } = await db
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .eq("status", "active")
    .in("check_frequency", frequencies);
  if (error) throw error;
  if (goals.length === 0) return [];

  const statusByGoalId = await getCheckinStatusForGoals(db, userId, goals);

  return goals.map((goal) => {
    const status = statusByGoalId.get(goal.id) ?? { doneThisPeriod: false, streak: 0 };
    return { goal, ...status };
  });
}
