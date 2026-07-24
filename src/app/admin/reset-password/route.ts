import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for the link in the "reset your password" email. Exchanges
 * the one-time code for a real session (this has to happen in a Route
 * Handler, not a Server Component — Server Components can't write the
 * session cookie), then redirects to the actual new-password form.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/admin/reset-password/new`);
    }
  }

  return NextResponse.redirect(
    `${origin}/admin/forgot-password?error=invalid-link`,
  );
}
