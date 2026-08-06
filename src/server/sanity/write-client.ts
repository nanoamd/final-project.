import "server-only";

import { createClient } from "@sanity/client";

import {
  sanityApiVersion,
  sanityDataset,
  sanityProjectId,
} from "@/lib/sanity/config";

/**
 * Privileged Sanity client using SANITY_API_WRITE_TOKEN, read straight from
 * process.env rather than the validated env.ts schema — same precedent as
 * scripts/seed-sanity.ts. Genuinely optional: callers must handle `null` (no
 * token configured) rather than assuming a client is always available.
 */
export function getSanityWriteClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) return null;
  return createClient({
    projectId: sanityProjectId,
    dataset: sanityDataset,
    apiVersion: sanityApiVersion,
    token,
    useCdn: false,
  });
}
