import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { Db, Json } from "@/lib/types";
import { getPreferences, setPreference } from "./preferences";

const PREFERENCE_KEY = "diary_pin";

interface StoredPin {
  salt: string;
  hash: string;
}

/**
 * A soft privacy gate on the diary overview, not a security boundary — the
 * app is already behind Supabase auth. Stored as a preference (no new
 * table) rather than plaintext, hashed with Node's built-in scrypt so no new
 * dependency is needed for a 4-10 character PIN.
 */
export async function hasDiaryPin(db: Db, userId: string): Promise<boolean> {
  const preferences = await getPreferences(db, userId);
  return preferences.some((p) => p.key === PREFERENCE_KEY);
}

export async function setDiaryPin(db: Db, userId: string, pin: string): Promise<void> {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 64).toString("hex");
  const stored: StoredPin = { salt, hash };
  await setPreference(db, userId, PREFERENCE_KEY, stored as unknown as Json);
}

export async function verifyDiaryPin(db: Db, userId: string, pin: string): Promise<boolean> {
  const preferences = await getPreferences(db, userId);
  const record = preferences.find((p) => p.key === PREFERENCE_KEY);
  if (!record) return false;

  const stored = record.value as unknown as StoredPin;
  if (!stored?.salt || !stored?.hash) return false;

  const candidate = scryptSync(pin, stored.salt, 64);
  const expected = Buffer.from(stored.hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}
