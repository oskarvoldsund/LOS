"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import * as dietService from "@/lib/services/diet";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, userId: user.id };
}

const createMealSchema = z.object({
  mealDate: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  calories: z.number().optional(),
  proteinG: z.number().optional(),
  carbsG: z.number().optional(),
  fatG: z.number().optional(),
});

export async function createMeal(input: z.infer<typeof createMealSchema>) {
  const parsed = createMealSchema.parse(input);
  const { supabase, userId } = await requireUser();
  const meal = await dietService.createMeal(supabase, userId, {
    meal_date: parsed.mealDate,
    title: parsed.title,
    description: parsed.description,
    calories: parsed.calories,
    protein_g: parsed.proteinG,
    carbs_g: parsed.carbsG,
    fat_g: parsed.fatG,
  });
  revalidatePath("/diet");
  return meal;
}

export async function completeMeal(id: string) {
  const { supabase, userId } = await requireUser();
  const meal = await dietService.completeMeal(supabase, userId, id);
  revalidatePath("/diet");
  return meal;
}

export async function deleteMeal(id: string) {
  const { supabase, userId } = await requireUser();
  await dietService.deleteMeal(supabase, userId, id);
  revalidatePath("/diet");
}
