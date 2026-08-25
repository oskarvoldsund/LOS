import type { Db, Tables, TablesInsert, TablesUpdate, GoalStatus } from "@/lib/types";

export interface GoalWithProgress extends Tables<"goals"> {
  progress: number; // 0-100, computed unless progress_override is set
  milestones: Tables<"goal_milestones">[];
}

export interface GoalFilter {
  status?: GoalStatus;
  goalType?: Tables<"goals">["goal_type"];
  categoryId?: string;
}

export async function getGoals(
  db: Db,
  userId: string,
  filter: GoalFilter = {},
): Promise<GoalWithProgress[]> {
  let query = db.from("goals").select("*").eq("user_id", userId).is("deleted_at", null);
  if (filter.status) query = query.eq("status", filter.status);
  if (filter.goalType) query = query.eq("goal_type", filter.goalType);
  if (filter.categoryId) query = query.eq("category_id", filter.categoryId);

  const { data: goals, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  if (goals.length === 0) return [];

  const { data: milestones, error: milestoneError } = await db
    .from("goal_milestones")
    .select("*")
    .eq("user_id", userId)
    .in(
      "goal_id",
      goals.map((g) => g.id),
    )
    .order("sort_order", { ascending: true });
  if (milestoneError) throw milestoneError;

  return goals.map((goal) => {
    const own = milestones.filter((m) => m.goal_id === goal.id);
    const progress =
      goal.progress_override != null
        ? Number(goal.progress_override)
        : computeMilestoneProgress(own);
    return { ...goal, progress, milestones: own };
  });
}

function computeMilestoneProgress(milestones: Tables<"goal_milestones">[]): number {
  if (milestones.length === 0) return 0;
  const done = milestones.filter((m) => m.status === "done").length;
  return Math.round((done / milestones.length) * 100);
}

export async function getGoalById(
  db: Db,
  userId: string,
  id: string,
): Promise<GoalWithProgress | null> {
  const { data: goal, error } = await db
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!goal) return null;

  const { data: milestones, error: milestoneError } = await db
    .from("goal_milestones")
    .select("*")
    .eq("user_id", userId)
    .eq("goal_id", id)
    .order("sort_order", { ascending: true });
  if (milestoneError) throw milestoneError;

  const progress =
    goal.progress_override != null
      ? Number(goal.progress_override)
      : computeMilestoneProgress(milestones);
  return { ...goal, progress, milestones };
}

export async function getGoalProgress(
  db: Db,
  userId: string,
  id: string,
): Promise<{ progress: number; milestones: Tables<"goal_milestones">[] } | null> {
  const goal = await getGoalById(db, userId, id);
  return goal ? { progress: goal.progress, milestones: goal.milestones } : null;
}

export async function createGoal(
  db: Db,
  userId: string,
  input: Omit<TablesInsert<"goals">, "user_id">,
): Promise<Tables<"goals">> {
  const { data, error } = await db
    .from("goals")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateGoal(
  db: Db,
  userId: string,
  id: string,
  input: TablesUpdate<"goals">,
): Promise<Tables<"goals">> {
  const { data, error } = await db
    .from("goals")
    .update(input)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function createMilestone(
  db: Db,
  userId: string,
  input: Omit<TablesInsert<"goal_milestones">, "user_id">,
): Promise<Tables<"goal_milestones">> {
  const { data, error } = await db
    .from("goal_milestones")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateMilestone(
  db: Db,
  userId: string,
  id: string,
  input: TablesUpdate<"goal_milestones">,
): Promise<Tables<"goal_milestones">> {
  const { data, error } = await db
    .from("goal_milestones")
    .update(input)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
