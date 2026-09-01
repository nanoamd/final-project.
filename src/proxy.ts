import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/session";

/**
 * Root proxy (Next 16's replacement for `middleware`). Runs before routes are
 * rendered; here it keeps the Supabase auth session fresh on every
 * navigation, and rejects junk top-level paths before that Supabase round
 * trip or any page rendering/Sanity query happens at all.
 *
 * The rejection is a real incident, not a guess: a scraping bot generated a
 * fresh random path per request (`/7ba622c6bf704055/view` and similar)
 * specifically to defeat caching. No per-path cache helps against a path
 * that's never repeated — the only fix that works regardless of how many
 * distinct junk paths a bot invents is rejecting anything that doesn't match
 * a route this site actually has, at the cheapest point available. One day
 * of this traffic reached 25.9M Sanity CDN requests, 3.7TB of bandwidth, and
 * a matching spike in Vercel's own bot-driven usage — comfortably enough to
 * trigger a four-figure overage on both.
 *
 * This is a second layer alongside Vercel's Firewall/Bot Protection, not a
 * replacement for it — the firewall blocks by behaviour and fingerprint
 * before the request reaches this code at all, which is the more effective
 * defence. This layer specifically protects the cases that get past it: it
 * costs nothing per legitimate request (real routes match instantly) and
 * stops paying for a Supabase call or a Sanity lookup on paths that were
 * never going to exist.
 *
 * Deliberately conservative — allowlist, not a blocklist of "looks like a
 * bot" patterns, so it can't misclassify a real route added later without
 * this file being updated too. Anything with a file extension (favicon.ico,
 * robots.txt, sitemap.xml, images in /public) is let through rather than
 * matched against the list, since Next's own special-file routes and static
 * assets live at the root and would otherwise need enumerating one by one.
 */
const ALLOWED_TOP_LEVEL_SEGMENTS = new Set([
  "about",
  "account",
  "admin",
  "api",
  "auth",
  "cart",
  "checkout",
  "compare",
  "contact",
  "cookies",
  "delivery",
  "experience",
  "faq",
  "guided-buying",
  "inspiration",
  "journal",
  "learn",
  "newsletter",
  "privacy",
  "quote",
  "returns",
  "saved",
  "search",
  "shop",
  "studio",
  "terms",
  "tools",
  "track",
  "warranty",
]);

function isJunkPath(pathname: string): boolean {
  if (pathname === "/" || pathname.includes(".")) return false;
  const firstSegment = pathname.split("/")[1] ?? "";
  return !ALLOWED_TOP_LEVEL_SEGMENTS.has(firstSegment);
}

export async function proxy(request: NextRequest) {
  if (isJunkPath(request.nextUrl.pathname)) {
    return new NextResponse("Not found", { status: 404 });
  }
  return updateSession(request);
}

export const config = {
  // Run on all request paths except Next.js internals, static assets, API
  // routes and the Sanity Studio. /api/** is excluded so this never adds
  // Supabase-health latency to Stripe webhook delivery (which has its own
  // timeout/retry semantics); /studio/** is excluded since Studio has its
  // own auth and doesn't need the storefront session refreshed. Both are
  // real allowlisted prefixes above regardless, so nothing changes for them
  // if this matcher is ever loosened later.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|studio/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
