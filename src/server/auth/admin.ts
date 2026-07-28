import "server-only";

import { env } from "@/env";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/server/supabase/admin";

export interface AuthorizedAdmin {
  email: string;
  role: "owner" | "staff";
}

/**
 * The single source of truth for "is this person allowed into /admin."
 * ADMIN_EMAIL is always the implicit owner (unchanged behaviour from
 * before multi-user support existed); anyone else needs a row in
 * `admin_users` (added via SQL for now — there's no Settings UI yet to
 * manage this). Every admin-gated page/action should call this instead of
 * re-checking ADMIN_EMAIL inline, so there's exactly one place that knows
 * who's allowed in.
 */
export async function getAuthorizedAdmin(): Promise<AuthorizedAdmin | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  return resolveAdmin(user.email);
}

/** Pre-authentication check (e.g. before attempting sign-in) — doesn't
 * require an active session, just an email address to check. */
export async function isAuthorizedAdminEmail(email: string): Promise<boolean> {
  return (await resolveAdmin(email)) !== null;
}

async function resolveAdmin(rawEmail: string): Promise<AuthorizedAdmin | null> {
  const email = rawEmail.trim().toLowerCase();
  const adminEmail = env.ADMIN_EMAIL;
  if (adminEmail && email === adminEmail.toLowerCase()) {
    return { email, role: "owner" };
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_users")
    .select("email, role")
    .ilike("email", email)
    .maybeSingle();
  if (!data) return null;

  return { email: data.email, role: data.role === "owner" ? "owner" : "staff" };
}
