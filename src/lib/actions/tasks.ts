"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import * as tasksService from "@/lib/services/tasks";
import type { TablesUpdate } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, userId: user.id };
}

function revalidateTaskPaths() {
  revalidatePath("/tasks");
  revalidatePath("/today");
  revalidatePath("/goals");
}

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().optional(),
  goalId: z.string().uuid().optional(),
  status: z.enum(["inbox", "todo", "in_progress", "completed", "cancelled"]).optional(),
});

export async function createTask(input: z.infer<typeof createTaskSchema>) {
  const parsed = createTaskSchema.parse(input);
  const { supabase, userId } = await requireUser();
  const task = await tasksService.createTask(supabase, userId, {
    title: parsed.title,
    description: parsed.description,
    category_id: parsed.categoryId,
    priority: parsed.priority,
    due_date: parsed.dueDate,
    goal_id: parsed.goalId,
    status: parsed.status,
  });
  revalidateTaskPaths();
  return task;
}

export async function updateTask(id: string, input: TablesUpdate<"tasks">) {
  const { supabase, userId } = await requireUser();
  const task = await tasksService.updateTask(supabase, userId, id, input);
  revalidateTaskPaths();
  return task;
}

export async function toggleTaskComplete(id: string, completed: boolean) {
  const { supabase, userId } = await requireUser();
  const task = completed
    ? await tasksService.completeTask(supabase, userId, id)
    : await tasksService.reopenTask(supabase, userId, id);
  revalidateTaskPaths();
  return task;
}

export async function deleteTask(id: string) {
  const { supabase, userId } = await requireUser();
  await tasksService.softDeleteTask(supabase, userId, id);
  revalidateTaskPaths();
}
