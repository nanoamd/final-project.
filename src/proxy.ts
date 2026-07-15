import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/session";

/**
 * Root proxy (Next 16's replacement for `middleware`). Runs before routes are
 * rendered; here it keeps the Supabase auth session fresh on every navigation.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on all request paths except Next.js internals, static assets, API
  // routes and the Sanity Studio. /api/** is excluded so this never adds
  // Supabase-health latency to Stripe webhook delivery (which has its own
  // timeout/retry semantics); /studio/** is excluded since Studio has its
  // own auth and doesn't need the storefront session refreshed.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|studio/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
