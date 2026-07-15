import { sanityClient } from "@/lib/sanity/client";

/**
 * Fail-soft GROQ fetch — every query function in src/lib/sanity/queries/*.ts
 * is built on this. Never throws: a missing/invalid project ID, a network
 * failure, or an empty dataset all resolve to `fallback` instead of crashing
 * the caller. This matters most inside `generateStaticParams`, where an
 * uncaught throw fails the entire `next build`, not just one route.
 */
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown>,
  fallback: T,
): Promise<T> {
  try {
    const result = await sanityClient.fetch<T>(query, params);
    return result ?? fallback;
  } catch (error) {
    console.error("[sanity] query failed:", error);
    return fallback;
  }
}
