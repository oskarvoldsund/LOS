import type { Db, Tables, TablesInsert, TablesUpdate, TaskStatus } from "@/lib/types";

export interface TaskFilter {
  status?: TaskStatus | TaskStatus[];
  dueBefore?: string; // ISO date, inclusive
  dueAfter?: string; // ISO date, inclusive
  goalId?: string;
  categoryId?: string;
  includeCompleted?: boolean;
}

const BASE_SELECT = "*";

export async function getTasks(
  db: Db,
  userId: string,
  filter: TaskFilter = {},
): Promise<Tables<"tasks">[]> {
  let query = db
    .from("tasks")
    .select(BASE_SELECT)
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (filter.status) {
    query = Array.isArray(filter.status)
      ? query.in("status", filter.status)
      : query.eq("status", filter.status);
  } else if (!filter.includeCompleted) {
    query = query.neq("status", "completed").neq("status", "cancelled");
  }
  if (filter.dueBefore) query = query.lte("due_date", filter.dueBefore);
  if (filter.dueAfter) query = query.gte("due_date", filter.dueAfter);
  if (filter.goalId) query = query.eq("goal_id", filter.goalId);
  if (filter.categoryId) query = query.eq("category_id", filter.categoryId);

  const { data, error } = await query
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("priority", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getInboxTasks(db: Db, userId: string): Promise<Tables<"tasks">[]> {
  return getTasks(db, userId, { status: "inbox" });
}

export async function getTodayTasks(db: Db, userId: string): Promise<Tables<"tasks">[]> {
  const today = new Date().toISOString().slice(0, 10);
  return getTasks(db, userId, { dueBefore: today, status: ["todo", "in_progress"] });
}

export async function getOverdueTasks(db: Db, userId: string): Promise<Tables<"tasks">[]> {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  void today;
  return getTasks(db, userId, { dueBefore: yesterday, status: ["todo", "in_progress", "inbox"] });
}

export async function getTaskById(
  db: Db,
  userId: string,
  id: string,
): Promise<Tables<"tasks"> | null> {
  const { data, error } = await db
    .from("tasks")
    .select(BASE_SELECT)
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createTask(
  db: Db,
  userId: string,
  input: Omit<TablesInsert<"tasks">, "user_id">,
): Promise<Tables<"tasks">> {
  const status = input.status ?? (input.due_date || input.category_id ? "todo" : "inbox");
  const { data, error } = await db
    .from("tasks")
    .insert({ ...input, user_id: userId, status })
    .select(BASE_SELECT)
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(
  db: Db,
  userId: string,
  id: string,
  input: TablesUpdate<"tasks">,
): Promise<Tables<"tasks">> {
  const { data, error } = await db
    .from("tasks")
    .update(input)
    .eq("id", id)
    .eq("user_id", userId)
    .select(BASE_SELECT)
    .single();
  if (error) throw error;
  return data;
}

export async function completeTask(db: Db, userId: string, id: string): Promise<Tables<"tasks">> {
  return updateTask(db, userId, id, { status: "completed", completed_at: new Date().toISOString() });
}

export async function reopenTask(db: Db, userId: string, id: string): Promise<Tables<"tasks">> {
  return updateTask(db, userId, id, { status: "todo", completed_at: null });
}

export async function softDeleteTask(db: Db, userId: string, id: string): Promise<void> {
  const { error } = await db
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}
