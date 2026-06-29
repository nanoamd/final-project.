import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/env";

/**
 * Supabase client for use in the browser (Client Components). Uses the public
 * anon key and is safe to ship to the client.
 */
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
