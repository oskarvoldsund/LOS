import type { Db, Tables } from "@/lib/types";
import { getTasks, getOverdueTasks } from "./tasks";
import { getWorkouts } from "./training";
import { getGoalCheckinReminders, type GoalCheckinStatus } from "./goal-checkins";

export interface TodayContext {
  date: string;
  todayTasks: Tables<"tasks">[];
  overdueTasks: Tables<"tasks">[];
  plannedWorkout: Tables<"workouts"> | null;
  goalCheckins: GoalCheckinStatus[];
}

/**
 * Everything the Home page needs, in one call. Deliberately narrow — this is
 * the "what matters today" slice, not a database dump (see
 * docs/product-architecture.md §5.1). Calendar is intentionally excluded —
 * the Calendar page/service is unlinked from navigation for now (still
 * reachable directly, code untouched), so there's nowhere to populate events
 * from and no reason to fetch them here.
 */
export async function getTodayContext(db: Db, userId: string): Promise<TodayContext> {
  const today = new Date().toISOString().slice(0, 10);

  const [todayTasks, overdueTasks, todayWorkouts, goalCheckins] = await Promise.all([
    getTasks(db, userId, { dueBefore: today, dueAfter: today, status: ["todo", "in_progress"] }),
    getOverdueTasks(db, userId),
    getWorkouts(db, userId, { from: today, to: today }),
    // Monthly-cadence goals don't need a front-page reminder — only daily/weekly.
    getGoalCheckinReminders(db, userId, ["daily", "weekly"]),
  ]);

  return {
    date: today,
    todayTasks,
    overdueTasks,
    plannedWorkout: todayWorkouts.find((w) => w.status === "planned") ?? null,
    goalCheckins,
  };
}
