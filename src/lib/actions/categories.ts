"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import * as categoriesService from "@/lib/services/categories";
import { setPreference } from "@/lib/services/preferences";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, userId: user.id };
}

export async function createCategory(name: string) {
  const { supabase, userId } = await requireUser();
  const category = await categoriesService.createCategory(supabase, userId, { name });
  revalidatePath("/settings");
  return category;
}

export async function deleteCategory(id: string) {
  const { supabase, userId } = await requireUser();
  await categoriesService.deleteCategory(supabase, userId, id);
  revalidatePath("/settings");
}

export async function setAiLoggingPreference(enabled: boolean) {
  const { supabase, userId } = await requireUser();
  await setPreference(supabase, userId, "ai_logging_enabled", enabled);
  revalidatePath("/settings");
}
