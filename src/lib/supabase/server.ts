import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * Session-bound, RLS-scoped Supabase client for Server Components, Server
 * Actions, and Route Handlers. Never use the service-role key here — every
 * query (including the ones Claude's tools make) goes through this client so
 * Postgres RLS is the actual access-control boundary (see
 * docs/technical-architecture.md §9).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component render — the middleware
            // refreshes the session on the next request instead.
          }
        },
      },
    },
  );
}
