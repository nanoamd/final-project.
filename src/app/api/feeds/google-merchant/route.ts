/**
 * The original feed address, kept working.
 *
 * `/google-merchant.xml` is the one to point Merchant Center at — this path is
 * under `/api/`, which robots.txt disallowed for years and which Merchant
 * Center's fetcher therefore refused. An `Allow: /api/feeds/` override now sits
 * above that disallow, but Google caches robots.txt for up to a day and a
 * future edit to the disallow list could undo it.
 *
 * Anything already pointed here keeps working; the builder is shared.
 */
import { buildMerchantFeedResponse } from "@/lib/feeds/google-merchant";

export const revalidate = 3600;

export async function GET(): Promise<Response> {
  return buildMerchantFeedResponse();
}
