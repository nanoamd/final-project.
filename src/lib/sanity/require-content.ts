/**
 * Refuses to build a catalogue artefact out of nothing.
 *
 * ## Why this exists
 *
 * `sanityFetch` is fail-soft on purpose: a failed query resolves to the
 * caller's fallback so one bad request cannot take a page down. That is right
 * for a page, where an empty rail is better than a 500. It is wrong for the
 * sitemap and the product feed, because their fallback is an *empty catalogue*
 * — and an empty catalogue is not a degraded artefact, it is a false statement
 * about the shop that search engines act on.
 *
 * It has now happened twice.
 *
 * `src/lib/sanity/config.ts` records the first: a token pasted into
 * `NEXT_PUBLIC_SANITY_PROJECT_ID`, and "the only visible symptom was a site
 * with no content".
 *
 * The second was 26 October. A read token was added to the client for a dataset
 * flip that had not happened yet. The variable was unset locally, so it was a
 * no-op in every test and in a local production build — 1,031 URLs, 954 of them
 * products. In Vercel the variable was set to a stale value, every read came
 * back 401, and the build completed green with a 31-URL sitemap and a feed with
 * no items. Merchant Center then did exactly what the feed route's own comment
 * says it does: it fetched an empty feed and withdrew the items it held,
 * leaving "Provided by you: 0".
 *
 * Nothing failed. No test, no typecheck, no build, no alert.
 *
 * ## What this does instead
 *
 * Throws. A build that cannot see the catalogue fails rather than shipping a
 * lie about it, and a revalidation that cannot see it leaves the last good
 * version in place — Next keeps serving the previous render when regeneration
 * throws. Both outcomes are strictly better than publishing emptiness.
 *
 * This is deliberately not in `sanityFetch` itself. Most callers genuinely
 * should degrade quietly; only the artefacts that speak for the whole catalogue
 * should refuse.
 */
export function requireContent<T>(
  items: T[],
  what: string,
  { min = 1 }: { min?: number } = {},
): T[] {
  if (items.length >= min) return items;

  throw new Error(
    `${what}: expected at least ${min} item(s) from Sanity, got ${items.length}. ` +
      "Refusing to publish an empty catalogue. This is almost always credentials " +
      "or connection settings rather than the data — check SANITY_API_READ_TOKEN " +
      "and the NEXT_PUBLIC_SANITY_* variables in the deployment, and compare " +
      "against a direct query to the dataset. See src/lib/sanity/require-content.ts.",
  );
}
