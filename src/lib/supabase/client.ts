import { createBrowserClient } from "@supabase/ssr";

import { env, requireEnv } from "@/env";

/**
 * Supabase client for use in the browser (Client Components). Uses the public
 * anon key and is safe to ship to the client.
 */
export function createClient() {
  return createBrowserClient(
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
  );
}
