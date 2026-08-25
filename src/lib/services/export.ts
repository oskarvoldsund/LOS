import type { Db } from "@/lib/types";

const BUSINESS_TABLES = [
  "categories",
  "tasks",
  "goals",
  "goal_milestones",
  "goal_checkins",
  "calendar_accounts",
  "calendar_events",
  "workouts",
  "workout_exercises",
  "meals",
  "diary_entries",
  "routines",
  "routine_completions",
  "weekly_plans",
  "weekly_priorities",
  "notes",
  "preferences",
] as const;

const AI_TABLES = ["ai_conversations", "ai_messages", "ai_actions"] as const;

/** JSON export of all user-owned business data (docs/technical-architecture.md §10). */
export async function exportBusinessData(db: Db, userId: string) {
  const entries = await Promise.all(
    BUSINESS_TABLES.map(async (table) => {
      const { data, error } = await db.from(table).select("*").eq("user_id", userId);
      if (error) throw error;
      return [table, data] as const;
    }),
  );
  return Object.fromEntries(entries);
}

/** Separate bundle so a user can keep business data but discard AI history, or vice versa. */
export async function exportAiHistory(db: Db, userId: string) {
  const entries = await Promise.all(
    AI_TABLES.map(async (table) => {
      const { data, error } = await db.from(table).select("*").eq("user_id", userId);
      if (error) throw error;
      return [table, data] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export function toCsv<T extends Record<string, unknown>>(rows: T[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const str = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(","));
  return lines.join("\n");
}
