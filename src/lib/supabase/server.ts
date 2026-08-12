import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env, requireEnv } from "@/env";

/**
 * Supabase client for use on the server (Server Components, Server Actions,
 * Route Handlers). Bound to the incoming request's cookies so the user session
 * is read and refreshed correctly.
 *
 * `cookies()` is async in this version of Next.js, so this factory is async.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      env.NEXT_PUBLIC_SUPABASE_URL,
      "customer accounts are unavailable",
    ),
    requireEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "customer accounts are unavailable",
    ),
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
            // `setAll` was called from a Server Component, where writing
            // cookies is not allowed. Safe to ignore when session refresh is
            // handled in middleware.
          }
        },
      },
    },
  );
}
