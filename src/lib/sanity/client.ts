import { createClient } from "@sanity/client";

import {
  sanityApiVersion,
  sanityDataset,
  sanityProjectId,
} from "@/lib/sanity/config";

/**
 * Sanity content client for public, read-only queries (GROQ). `useCdn` serves
 * cached, edge-delivered content; switch it off for draft/preview reads driven
 * from the server.
 *
 * Connection settings come from ./config.ts, not straight from `@/env` — see
 * the comment there for why they're shape-checked first.
 */
/**
 * No token, deliberately, until the dataset is made private.
 *
 * A read token was wired in here on 26 October so the dataset could be flipped
 * to private without the site losing content — see the audit script for why
 * that flip is needed. It was taken straight back out, because `sanityFetch`
 * is fail-soft: it catches everything and returns the caller's fallback, so a
 * token that is present but wrong does not raise anything. It renders an empty
 * site and a 200.
 *
 * That makes an untested token change uniquely dangerous here. Passing
 * `process.env.SANITY_API_READ_TOKEN` is a no-op when the variable is unset and
 * a silent sitewide blanking when it is set to anything stale — and nothing in
 * the deployment says which of those is true.
 *
 * When the dataset is made private, the order is: create the Viewer token, set
 * it in Vercel, confirm a preview deployment still renders products, and only
 * then add `token` back here and flip the dataset. Not before.
 */
export const sanityClient = createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  apiVersion: sanityApiVersion,
  useCdn: true,
});
