import type { Db, Tables, TablesInsert, TablesUpdate } from "@/lib/types";

export async function getRoutines(db: Db, userId: string, activeOnly = true): Promise<Tables<"routines">[]> {
  let query = db.from("routines").select("*").eq("user_id", userId);
  if (activeOnly) query = query.eq("active", true);
  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createRoutine(
  db: Db,
  userId: string,
  input: Omit<TablesInsert<"routines">, "user_id">,
): Promise<Tables<"routines">> {
  const { data, error } = await db
    .from("routines")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateRoutine(
  db: Db,
  userId: string,
  id: string,
  input: TablesUpdate<"routines">,
): Promise<Tables<"routines">> {
  const { data, error } = await db
    .from("routines")
    .update(input)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function getRoutineCompletions(
  db: Db,
  userId: string,
  routineId: string,
  sinceDaysAgo = 30,
): Promise<Tables<"routine_completions">[]> {
  const since = new Date(Date.now() - sinceDaysAgo * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await db
    .from("routine_completions")
    .select("*")
    .eq("user_id", userId)
    .eq("routine_id", routineId)
    .gte("completed_date", since)
    .order("completed_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getTodayCompletedRoutineIds(db: Db, userId: string): Promise<Set<string>> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await db
    .from("routine_completions")
    .select("routine_id")
    .eq("user_id", userId)
    .eq("completed_date", today);
  if (error) throw error;
  return new Set(data.map((r) => r.routine_id));
}

export async function markRoutineComplete(
  db: Db,
  userId: string,
  routineId: string,
  date = new Date().toISOString().slice(0, 10),
): Promise<Tables<"routine_completions">> {
  const { data, error } = await db
    .from("routine_completions")
    .upsert(
      { user_id: userId, routine_id: routineId, completed_date: date },
      { onConflict: "routine_id,completed_date" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function unmarkRoutineComplete(
  db: Db,
  userId: string,
  routineId: string,
  date = new Date().toISOString().slice(0, 10),
): Promise<void> {
  const { error } = await db
    .from("routine_completions")
    .delete()
    .eq("user_id", userId)
    .eq("routine_id", routineId)
    .eq("completed_date", date);
  if (error) throw error;
}
