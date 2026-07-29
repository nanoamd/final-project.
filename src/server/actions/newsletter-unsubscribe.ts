"use server";

import "server-only";

import { getSanityWriteClient } from "@/server/sanity/write-client";

export interface UnsubscribeResult {
  ok: boolean;
}

/**
 * Removes a newsletter subscriber by their Sanity document ID (the same
 * lightweight unguessable-token pattern used for /track/[id] — the ID
 * itself is the link's only secret). Deletes rather than flagging, so an
 * unsubscribe request is honoured completely rather than leaving the
 * email address stored with a soft "unsubscribed" marker.
 */
export async function unsubscribeFromNewsletter(
  subscriberId: string,
): Promise<UnsubscribeResult> {
  const client = getSanityWriteClient();
  if (!client) return { ok: false };

  try {
    await client.delete(subscriberId);
    return { ok: true };
  } catch (err) {
    console.error("unsubscribeFromNewsletter: failed", err);
    return { ok: false };
  }
}
