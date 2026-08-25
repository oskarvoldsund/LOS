"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/services/calendar";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, userId: user.id };
}

const createEventSchema = z.object({
  title: z.string().min(1),
  startsAt: z.string(),
  endsAt: z.string(),
  description: z.string().optional(),
});

export async function createEvent(input: z.infer<typeof createEventSchema>) {
  const parsed = createEventSchema.parse(input);
  const { supabase, userId } = await requireUser();
  const event = await createCalendarEvent(supabase, userId, parsed);
  revalidatePath("/calendar");
  revalidatePath("/today");
  return event;
}

export async function deleteEvent(id: string) {
  const { supabase, userId } = await requireUser();
  await deleteCalendarEvent(supabase, userId, id);
  revalidatePath("/calendar");
  revalidatePath("/today");
}
