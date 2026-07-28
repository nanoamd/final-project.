import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for the link in the "confirm your email" signup email.
 * Exchanges the one-time code for a real session (has to happen in a Route
 * Handler, not a Server Component — Server Components can't write the
 * session cookie), then redirects into the signed-in account area.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/account?confirmed=1`);
    }
  }

  return NextResponse.redirect(`${origin}/account/login?error=invalid-link`);
}
