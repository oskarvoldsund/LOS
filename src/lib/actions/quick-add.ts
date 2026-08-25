"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseQuickAdd } from "@/lib/parsing/quick-add";
import { createTask } from "@/lib/services/tasks";
import { createWorkout } from "@/lib/services/training";

export async function quickAdd(raw: string): Promise<{ kind: "task" | "workout"; title: string }> {
  const text = raw.trim();
  if (!text) throw new Error("Nothing to add.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const parsed = parseQuickAdd(text);

  if (parsed.kind === "workout" && parsed.activityType) {
    await createWorkout(supabase, user.id, {
      activity_type: parsed.activityType,
      status: "planned",
      scheduled_date: parsed.scheduledDate,
      distance_km: parsed.distanceKm,
      notes: text,
    });
  } else {
    await createTask(supabase, user.id, {
      title: parsed.title,
      due_date: parsed.dueDate,
    });
  }

  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/training");
  revalidatePath("/calendar");

  return { kind: parsed.kind, title: parsed.title };
}
