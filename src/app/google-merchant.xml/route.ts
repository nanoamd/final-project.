/**
 * The Merchant Center feed, at a path robots.txt never blocked.
 *
 * Damien: _"its not doing anything. make a new feed"_.
 *
 * The feed always worked — 200, 1.7MB, 908 items. What blocked it was
 * `Disallow: /api/`, which Merchant Center's scheduled fetch obeys. That is
 * fixed and live, but **Google caches robots.txt for up to 24 hours**, so the
 * blocking copy is probably still the one it is working from. Waiting a day for
 * a cache to expire is not a plan when this is the fastest channel we have.
 *
 * Serving the same bytes from the site root buys three things: no robots cache
 * to wait on, no dependence on an `Allow:` override beating a `Disallow:` that
 * a later edit could undo, and a `.xml` extension, which some fetchers want and
 * none object to.
 *
 * **This is the URL to give Merchant Center:**
 * `https://www.kaikuhome.com/google-merchant.xml`
 */
import { buildMerchantFeedResponse } from "@/lib/feeds/google-merchant";

export const revalidate = 3600;

export async function GET(): Promise<Response> {
  return buildMerchantFeedResponse();
}
