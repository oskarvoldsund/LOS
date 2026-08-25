"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import * as goalsService from "@/lib/services/goals";
import { checkInGoal, uncheckInGoal } from "@/lib/services/goal-checkins";
import type { GoalCheckFrequency, TablesUpdate } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, userId: user.id };
}

const createGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  whyItMatters: z.string().optional(),
  goalType: z.enum(["life", "annual", "quarterly", "monthly"]),
  parentGoalId: z.string().uuid().optional(),
  targetDate: z.string().optional(),
  checkFrequency: z.enum(["none", "daily", "weekly", "monthly"]).optional(),
  categoryId: z.string().uuid().optional(),
});

export async function createGoal(input: z.infer<typeof createGoalSchema>) {
  const parsed = createGoalSchema.parse(input);
  const { supabase, userId } = await requireUser();
  const goal = await goalsService.createGoal(supabase, userId, {
    title: parsed.title,
    description: parsed.description,
    why_it_matters: parsed.whyItMatters,
    goal_type: parsed.goalType,
    parent_goal_id: parsed.parentGoalId,
    target_date: parsed.targetDate,
    check_frequency: parsed.checkFrequency,
    category_id: parsed.categoryId,
  });
  revalidatePath("/goals");
  return goal;
}

export async function updateGoal(id: string, input: TablesUpdate<"goals">) {
  const { supabase, userId } = await requireUser();
  const goal = await goalsService.updateGoal(supabase, userId, id, input);
  revalidatePath("/goals");
  revalidatePath(`/goals/${id}`);
  return goal;
}

export async function createMilestone(goalId: string, title: string, targetDate?: string) {
  const { supabase, userId } = await requireUser();
  const milestone = await goalsService.createMilestone(supabase, userId, {
    goal_id: goalId,
    title,
    target_date: targetDate,
  });
  revalidatePath(`/goals/${goalId}`);
  return milestone;
}

export async function toggleMilestone(goalId: string, milestoneId: string, done: boolean) {
  const { supabase, userId } = await requireUser();
  const milestone = await goalsService.updateMilestone(supabase, userId, milestoneId, {
    status: done ? "done" : "pending",
    completed_at: done ? new Date().toISOString() : null,
  });
  revalidatePath(`/goals/${goalId}`);
  revalidatePath("/goals");
  return milestone;
}

export async function toggleGoalCheckin(goalId: string, frequency: GoalCheckFrequency, done: boolean) {
  const { supabase, userId } = await requireUser();
  if (done) {
    await checkInGoal(supabase, userId, goalId, frequency);
  } else {
    await uncheckInGoal(supabase, userId, goalId, frequency);
  }
  revalidatePath(`/goals/${goalId}`);
  revalidatePath(`/goals/${goalId}/stats`);
  revalidatePath("/goals");
  revalidatePath("/today");
}
