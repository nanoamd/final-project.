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
 * The token is optional, and whether it is set decides whether this project's
 * trade data is public.
 *
 * `./config.ts` records that a tokenless GROQ query against this project
 * returns HTTP 200 with the real catalogue, and treats that as fine because the
 * catalogue is meant to be public. It is — but it is not the only thing in the
 * dataset. The same unauthenticated endpoint also returns `costPrice` and
 * `shippingCost` on all 908 products, every supplier's name against them, and
 * the `contactSubmission` and `newsletterSubscriber` documents the forms write,
 * which carry real names and email addresses.
 *
 * So the dataset needs to be private, and a private dataset needs this token.
 * Reading it here costs nothing while the dataset is still public, which means
 * the token can be deployed first and the dataset flipped second, with no
 * window where the site has no content.
 *
 * Every importer of this client is under src/server or src/lib and runs
 * server-side — checked, none is a "use client" module — so the token is not
 * inlined into the browser bundle. Read straight from `process.env` for the
 * same reason ./config.ts does: `@t3-oss/env-nextjs` skips its transforms
 * under SKIP_ENV_VALIDATION, and content should still load when an unrelated
 * variable is missing.
 */
const readToken = process.env.SANITY_API_READ_TOKEN?.trim() || undefined;

export const sanityClient = createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  apiVersion: sanityApiVersion,
  useCdn: true,
  token: readToken,
});
