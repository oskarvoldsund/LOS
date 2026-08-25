import type { Db } from "@/lib/types";
import { isoWeekStart, isoWeekEnd } from "./weekly-plan";
import { getWorkouts } from "./training";
import { getGoalCheckinReminders } from "./goal-checkins";

export interface ProgressBar {
  label: string;
  done: number;
  total: number;
  streak?: number;
}

export interface WeeklyProgress {
  weekStartDate: string;
  weekEndDate: string;
  bars: ProgressBar[];
}

/**
 * The Home page's "This week" bars: tasks due this week, training scheduled
 * this week, and goal check-ins — each as done/total, computed directly
 * from the tables (no model call needed for arithmetic).
 */
export async function getWeeklyProgress(db: Db, userId: string, now = new Date()): Promise<WeeklyProgress> {
  const weekStartDate = isoWeekStart(now);
  const weekEndDate = isoWeekEnd(weekStartDate);

  const [{ data: weekTasks, error: tasksError }, weekWorkouts, goalCheckins] = await Promise.all([
    db
      .from("tasks")
      .select("status")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .gte("due_date", weekStartDate)
      .lte("due_date", weekEndDate),
    getWorkouts(db, userId, { from: weekStartDate, to: weekEndDate }),
    getGoalCheckinReminders(db, userId),
  ]);
  if (tasksError) throw tasksError;

  const bars: ProgressBar[] = [
    {
      label: "Tasks this week",
      done: weekTasks.filter((t) => t.status === "completed").length,
      total: weekTasks.length,
    },
    {
      label: "Training this week",
      done: weekWorkouts.filter((w) => w.status === "completed").length,
      total: weekWorkouts.length,
    },
    {
      label: "Goal check-ins",
      done: goalCheckins.filter((c) => c.doneThisPeriod).length,
      total: goalCheckins.length,
      streak: Math.max(0, ...goalCheckins.map((c) => c.streak)),
    },
  ];

  return { weekStartDate, weekEndDate, bars };
}
