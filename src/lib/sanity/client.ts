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
export const sanityClient = createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  apiVersion: sanityApiVersion,
  useCdn: true,
});
