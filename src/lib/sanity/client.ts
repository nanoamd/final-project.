import { createClient } from "@sanity/client";

import { env } from "@/env";

/**
 * Sanity content client for public, read-only queries (GROQ). `useCdn` serves
 * cached, edge-delivered content; switch it off for draft/preview reads driven
 * from the server.
 */
export const sanityClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION,
  useCdn: true,
});
