"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import * as trainingService from "@/lib/services/training";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, userId: user.id };
}

const ACTIVITY_TYPES = [
  "strength",
  "running",
  "cycling",
  "walking",
  "football",
  "mobility",
  "skierg",
  "other",
] as const;

function revalidateTrainingPaths() {
  revalidatePath("/training");
  revalidatePath("/today");
  revalidatePath("/calendar");
}

const createWorkoutSchema = z.object({
  activityType: z.enum(ACTIVITY_TYPES),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  durationMinutes: z.number().optional(),
  distanceKm: z.number().optional(),
  notes: z.string().optional(),
  goalId: z.string().uuid().optional(),
});

export async function createWorkout(input: z.infer<typeof createWorkoutSchema>) {
  const parsed = createWorkoutSchema.parse(input);
  const { supabase, userId } = await requireUser();
  const workout = await trainingService.createWorkout(supabase, userId, {
    activity_type: parsed.activityType,
    status: "planned",
    scheduled_date: parsed.scheduledDate,
    scheduled_time: parsed.scheduledTime,
    duration_minutes: parsed.durationMinutes,
    distance_km: parsed.distanceKm,
    notes: parsed.notes,
    goal_id: parsed.goalId,
  });
  revalidateTrainingPaths();
  return workout;
}

export async function completeWorkout(
  id: string,
  details: { durationMinutes?: number; distanceKm?: number; perceivedEffort?: number; notes?: string } = {},
) {
  const { supabase, userId } = await requireUser();
  const workout = await trainingService.completeWorkout(supabase, userId, id, {
    duration_minutes: details.durationMinutes,
    distance_km: details.distanceKm,
    perceived_effort: details.perceivedEffort,
    notes: details.notes,
  });
  revalidateTrainingPaths();
  return workout;
}

const logWorkoutSchema = z.object({
  activityType: z.enum(ACTIVITY_TYPES),
  date: z.string().optional(),
  durationMinutes: z.number().optional(),
  distanceKm: z.number().optional(),
  intensity: z.enum(["low", "medium", "high"]).optional(),
  perceivedEffort: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});

/**
 * Quick-log an already-completed session directly — distinct from
 * createWorkout (which always starts 'planned'). This is what the Home
 * page's "Log workout" quick-add calls.
 */
export async function logWorkout(input: z.infer<typeof logWorkoutSchema>) {
  const parsed = logWorkoutSchema.parse(input);
  const { supabase, userId } = await requireUser();
  const now = new Date();
  const date = parsed.date ?? now.toISOString().slice(0, 10);
  const workout = await trainingService.createWorkout(supabase, userId, {
    activity_type: parsed.activityType,
    status: "completed",
    scheduled_date: date,
    completed_at: now.toISOString(),
    duration_minutes: parsed.durationMinutes,
    distance_km: parsed.distanceKm,
    intensity: parsed.intensity,
    perceived_effort: parsed.perceivedEffort,
    notes: parsed.notes,
  });
  revalidateTrainingPaths();
  return workout;
}
