"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import * as diaryService from "@/lib/services/diary";
import { setDiaryPin as setDiaryPinService, verifyDiaryPin } from "@/lib/services/diary-lock";

const UNLOCK_COOKIE = "diary_unlocked";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, userId: user.id };
}

const createDiaryEntrySchema = z.object({
  entryDate: z.string().optional(),
  body: z.string().min(1),
});

export async function createDiaryEntry(input: z.infer<typeof createDiaryEntrySchema>) {
  const parsed = createDiaryEntrySchema.parse(input);
  const { supabase, userId } = await requireUser();
  const entry = await diaryService.createDiaryEntry(supabase, userId, {
    entry_date: parsed.entryDate ?? new Date().toISOString().slice(0, 10),
    body: parsed.body,
  });
  revalidatePath("/diary");
  revalidatePath("/today");
  return entry;
}

export async function deleteDiaryEntry(id: string) {
  const { supabase, userId } = await requireUser();
  await diaryService.deleteDiaryEntry(supabase, userId, id);
  revalidatePath("/diary");
}

export async function setDiaryPin(pin: string) {
  if (pin.length < 4) throw new Error("PIN must be at least 4 characters.");
  const { supabase, userId } = await requireUser();
  await setDiaryPinService(supabase, userId, pin);
  revalidatePath("/diary");
}

/**
 * A soft privacy gate, not real access control — the diary_entries table is
 * already RLS-scoped to the signed-in user regardless of this cookie. This
 * just re-prompts for a PIN before *rendering* entries, e.g. on a shared or
 * unlocked device.
 */
export async function unlockDiary(pin: string): Promise<{ ok: boolean }> {
  const { supabase, userId } = await requireUser();
  const ok = await verifyDiaryPin(supabase, userId, pin);
  if (ok) {
    const cookieStore = await cookies();
    cookieStore.set(UNLOCK_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/diary",
      // No maxAge — session cookie, cleared when the browser closes.
    });
  }
  return { ok };
}

export async function lockDiary() {
  const cookieStore = await cookies();
  cookieStore.delete(UNLOCK_COOKIE);
  revalidatePath("/diary");
}
