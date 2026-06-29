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
  // Run on all request paths except Next.js internals and static assets, so the
  // proxy never blocks CSS/JS/images from loading.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
