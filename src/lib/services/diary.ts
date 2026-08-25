import type { Db, Tables, TablesInsert } from "@/lib/types";

export async function getDiaryEntriesForRange(
  db: Db,
  userId: string,
  from: string,
  to: string,
): Promise<Tables<"diary_entries">[]> {
  const { data, error } = await db
    .from("diary_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("entry_date", from)
    .lte("entry_date", to)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** For the PIN-gated overview — everything ever written, newest first. */
export async function getAllDiaryEntries(db: Db, userId: string): Promise<Tables<"diary_entries">[]> {
  const { data, error } = await db
    .from("diary_entries")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createDiaryEntry(
  db: Db,
  userId: string,
  input: Omit<TablesInsert<"diary_entries">, "user_id">,
): Promise<Tables<"diary_entries">> {
  const { data, error } = await db
    .from("diary_entries")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDiaryEntry(db: Db, userId: string, id: string): Promise<void> {
  const { error } = await db.from("diary_entries").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
