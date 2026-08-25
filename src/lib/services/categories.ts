import type { Db, Tables, TablesInsert, TablesUpdate } from "@/lib/types";

export async function getCategories(db: Db, userId: string): Promise<Tables<"categories">[]> {
  const { data, error } = await db
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createCategory(
  db: Db,
  userId: string,
  input: Omit<TablesInsert<"categories">, "user_id">,
): Promise<Tables<"categories">> {
  const { data, error } = await db
    .from("categories")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(
  db: Db,
  userId: string,
  id: string,
  input: TablesUpdate<"categories">,
): Promise<Tables<"categories">> {
  const { data, error } = await db
    .from("categories")
    .update(input)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(db: Db, userId: string, id: string): Promise<void> {
  const { error } = await db.from("categories").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
