import type { Db, Tables, Json } from "@/lib/types";

export async function getPreferences(db: Db, userId: string): Promise<Tables<"preferences">[]> {
  const { data, error } = await db.from("preferences").select("*").eq("user_id", userId);
  if (error) throw error;
  return data;
}

/**
 * User-stated preference — set directly from a Settings form. Never called
 * from a Claude tool handler; see confirmInferredPreference for the
 * AI-inference path (docs/product-architecture.md §7).
 */
export async function setPreference(
  db: Db,
  userId: string,
  key: string,
  value: Json,
): Promise<Tables<"preferences">> {
  const { data, error } = await db
    .from("preferences")
    .upsert(
      { user_id: userId, key, value, source: "user_stated", confidence: null },
      { onConflict: "user_id,key" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/**
 * Only called from a Server Action the user explicitly triggers by clicking
 * "confirm" on a surfaced inference — never automatically from within a
 * Claude tool loop. This is the one path that promotes an AI observation
 * into a stored fact-adjacent preference.
 */
export async function confirmInferredPreference(
  db: Db,
  userId: string,
  input: { key: string; value: Json; confidence: number; derivedFromAiMessageId?: string },
): Promise<Tables<"preferences">> {
  const { data, error } = await db
    .from("preferences")
    .upsert(
      {
        user_id: userId,
        key: input.key,
        value: input.value,
        source: "user_confirmed_inference",
        confidence: input.confidence,
        derived_from_ai_message_id: input.derivedFromAiMessageId,
      },
      { onConflict: "user_id,key" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
