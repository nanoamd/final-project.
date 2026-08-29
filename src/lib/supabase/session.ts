import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/** Whether the request carries a Supabase auth cookie of any kind. */
export function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"),
    );
}

/**
 * Refreshes the Supabase auth session for an incoming request and returns a
 * response carrying any updated auth cookies. Called from the root proxy
 * (the Next 16 replacement for middleware).
 *
 * If Supabase isn't configured yet (no public env vars), this is a no-op so the
 * app still serves public routes. It reads `process.env` directly on purpose:
 * the validated `@/env` module throws at import time when unconfigured, which
 * must never break the proxy on every request.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return response;
  }

  // No auth cookie means no session, and there is nothing to refresh.
  //
  // This ran `getUser()` on every page request, which is a network call to
  // Supabase from a billed function invocation. Almost every request to a shop
  // is anonymous — every crawler, every first-time visitor, every share-link
  // click — so almost every one of those calls was work done to discover that
  // there was no session, which the cookies already said.
  //
  // Supabase names its cookie `sb-<project-ref>-auth-token`, and chunks large
  // ones with a numeric suffix, so the prefix is what to look for rather than
  // an exact name.
  if (!hasSupabaseAuthCookie(request)) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh the session so expired tokens are renewed. Keep this call
  // immediately after client creation with nothing in between, per Supabase
  // guidance, to avoid hard-to-debug session bugs.
  await supabase.auth.getUser();

  return response;
}
