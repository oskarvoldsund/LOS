import type { Db, Tables, TablesInsert, TablesUpdate } from "@/lib/types";
import { isoWeekStart, isoWeekEnd } from "./weekly-plan";

export async function getMealsForRange(
  db: Db,
  userId: string,
  from: string,
  to: string,
): Promise<Tables<"meals">[]> {
  const { data, error } = await db
    .from("meals")
    .select("*")
    .eq("user_id", userId)
    .gte("meal_date", from)
    .lte("meal_date", to)
    .order("meal_date", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getMealsForWeek(
  db: Db,
  userId: string,
  weekStartDate = isoWeekStart(),
): Promise<Tables<"meals">[]> {
  return getMealsForRange(db, userId, weekStartDate, isoWeekEnd(weekStartDate));
}

export async function createMeal(
  db: Db,
  userId: string,
  input: Omit<TablesInsert<"meals">, "user_id">,
): Promise<Tables<"meals">> {
  const { data, error } = await db
    .from("meals")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateMeal(
  db: Db,
  userId: string,
  id: string,
  input: TablesUpdate<"meals">,
): Promise<Tables<"meals">> {
  const { data, error } = await db
    .from("meals")
    .update(input)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function completeMeal(db: Db, userId: string, id: string): Promise<Tables<"meals">> {
  return updateMeal(db, userId, id, { status: "completed" });
}

export async function deleteMeal(db: Db, userId: string, id: string): Promise<void> {
  const { error } = await db.from("meals").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export interface NutritionTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/** Deterministic aggregation — no model call needed for arithmetic (docs/technical-architecture.md §8). */
export function sumNutrition(meals: Tables<"meals">[]): NutritionTotals {
  return meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + (meal.calories ?? 0),
      proteinG: totals.proteinG + Number(meal.protein_g ?? 0),
      carbsG: totals.carbsG + Number(meal.carbs_g ?? 0),
      fatG: totals.fatG + Number(meal.fat_g ?? 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}
