import type { Db, Tables, TablesInsert, TablesUpdate, WorkoutStatus } from "@/lib/types";

export interface WorkoutFilter {
  status?: WorkoutStatus | WorkoutStatus[];
  from?: string; // ISO date
  to?: string; // ISO date
  goalId?: string;
}

export async function getWorkouts(
  db: Db,
  userId: string,
  filter: WorkoutFilter = {},
): Promise<Tables<"workouts">[]> {
  let query = db.from("workouts").select("*").eq("user_id", userId);
  if (filter.status) {
    query = Array.isArray(filter.status)
      ? query.in("status", filter.status)
      : query.eq("status", filter.status);
  }
  if (filter.from) query = query.gte("scheduled_date", filter.from);
  if (filter.to) query = query.lte("scheduled_date", filter.to);
  if (filter.goalId) query = query.eq("goal_id", filter.goalId);

  const { data, error } = await query.order("scheduled_date", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getTrainingPlan(db: Db, userId: string): Promise<Tables<"workouts">[]> {
  const today = new Date().toISOString().slice(0, 10);
  return getWorkouts(db, userId, { status: "planned", from: today });
}

export async function getTrainingHistory(
  db: Db,
  userId: string,
  sinceDaysAgo = 90,
): Promise<Tables<"workouts">[]> {
  const since = new Date(Date.now() - sinceDaysAgo * 86_400_000).toISOString().slice(0, 10);
  const workouts = await getWorkouts(db, userId, { status: "completed", from: since });
  return workouts.sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
}

export async function getWorkoutWithExercises(
  db: Db,
  userId: string,
  id: string,
): Promise<{ workout: Tables<"workouts">; exercises: Tables<"workout_exercises">[] } | null> {
  const { data: workout, error } = await db
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!workout) return null;

  const { data: exercises, error: exerciseError } = await db
    .from("workout_exercises")
    .select("*")
    .eq("user_id", userId)
    .eq("workout_id", id)
    .order("sort_order", { ascending: true });
  if (exerciseError) throw exerciseError;

  return { workout, exercises };
}

export async function createWorkout(
  db: Db,
  userId: string,
  input: Omit<TablesInsert<"workouts">, "user_id">,
): Promise<Tables<"workouts">> {
  const { data, error } = await db
    .from("workouts")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateWorkout(
  db: Db,
  userId: string,
  id: string,
  input: TablesUpdate<"workouts">,
): Promise<Tables<"workouts">> {
  const { data, error } = await db
    .from("workouts")
    .update(input)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function completeWorkout(
  db: Db,
  userId: string,
  id: string,
  details: Partial<Pick<Tables<"workouts">, "duration_minutes" | "distance_km" | "perceived_effort" | "notes">> = {},
): Promise<Tables<"workouts">> {
  return updateWorkout(db, userId, id, {
    status: "completed",
    completed_at: new Date().toISOString(),
    ...details,
  });
}

export async function addExercise(
  db: Db,
  userId: string,
  input: Omit<TablesInsert<"workout_exercises">, "user_id">,
): Promise<Tables<"workout_exercises">> {
  const { data, error } = await db
    .from("workout_exercises")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export interface TrainingStats {
  plannedThisWeek: number;
  completedThisWeek: number;
  currentStreakDays: number;
  totalMinutesLast30Days: number;
}

export async function getTrainingStats(db: Db, userId: string): Promise<TrainingStats> {
  const now = new Date();
  const weekStart = startOfIsoWeek(now).toISOString().slice(0, 10);
  const weekEnd = endOfIsoWeek(now).toISOString().slice(0, 10);

  const [weekWorkouts, last30] = await Promise.all([
    getWorkouts(db, userId, { from: weekStart, to: weekEnd }),
    getTrainingHistory(db, userId, 30),
  ]);

  return {
    plannedThisWeek: weekWorkouts.filter((w) => w.status === "planned").length,
    completedThisWeek: weekWorkouts.filter((w) => w.status === "completed").length,
    currentStreakDays: 0, // deliberately simple in v1 — see product-architecture §5.4
    totalMinutesLast30Days: last30.reduce((sum, w) => sum + (w.duration_minutes ?? 0), 0),
  };
}

export interface ActivityStats {
  activityType: Tables<"workouts">["activity_type"];
  sessions: number;
  totalMinutes: number;
  totalDistanceKm: number;
}

/**
 * Per-activity totals — "how many strength workouts, how many km ran, how
 * much time on the skierg" — computed in code from completed workouts, not
 * stored redundantly. Sorted by session count, most-trained first.
 */
export async function getTrainingStatsByActivity(
  db: Db,
  userId: string,
  sinceDaysAgo = 90,
  activityType?: Tables<"workouts">["activity_type"],
): Promise<ActivityStats[]> {
  const allHistory = await getTrainingHistory(db, userId, sinceDaysAgo);
  const history = activityType ? allHistory.filter((w) => w.activity_type === activityType) : allHistory;
  const byActivity = new Map<string, ActivityStats>();

  for (const workout of history) {
    const existing = byActivity.get(workout.activity_type) ?? {
      activityType: workout.activity_type,
      sessions: 0,
      totalMinutes: 0,
      totalDistanceKm: 0,
    };
    existing.sessions += 1;
    existing.totalMinutes += workout.duration_minutes ?? 0;
    existing.totalDistanceKm += Number(workout.distance_km ?? 0);
    byActivity.set(workout.activity_type, existing);
  }

  return [...byActivity.values()].sort((a, b) => b.sessions - a.sessions);
}

function startOfIsoWeek(date: Date): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfIsoWeek(date: Date): Date {
  const start = startOfIsoWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
}
