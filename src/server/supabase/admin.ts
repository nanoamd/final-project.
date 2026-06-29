import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env } from "@/env";

/**
 * Privileged Supabase client using the service-role key. This bypasses Row
 * Level Security, so it must only ever run in trusted server code — never in
 * response to unauthenticated input without explicit authorization checks.
 *
 * Session persistence and token refresh are disabled because this client acts
 * on behalf of the system, not a user.
 */
export function createAdminClient() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
