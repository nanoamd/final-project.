"use server";

import "server-only";

import { getBasketAddOns } from "@/lib/sanity/queries/product";
import type { SanityProduct } from "@/types/sanity-content";

/**
 * What else is worth adding to this basket, asked from the basket page.
 *
 * A server action rather than a server component because the basket lives in
 * the browser — `useCart` holds it, nothing on the server knows what is in it
 * until the page says so.
 *
 * Only slugs cross the wire, and the margin test runs inside GROQ, so no cost
 * price is involved in answering. The suppliers that make an add-on's carriage
 * free are resolved from those slugs server-side rather than accepted from the
 * caller.
 *
 * Note every export from a `"use server"` module must be an async function —
 * a synchronous helper here passes `tsc` and its own tests and then fails the
 * Turbopack build, which is how an hour went missing on 26 October.
 */
export async function fetchBasketAddOns(
  slugs: string[],
  limit = 4,
): Promise<SanityProduct[]> {
  // Bounded before it reaches the query: a basket is a handful of items, and
  // this is a public endpoint like any other server action.
  const safe = slugs
    .filter((slug) => typeof slug === "string" && slug.length < 200)
    .slice(0, 50);
  if (!safe.length) return [];
  return getBasketAddOns(safe, Math.min(Math.max(limit, 1), 8));
}
