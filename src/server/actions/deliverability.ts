"use server";

import "server-only";

import {
  checkBasketDeliverability,
  type DeliverabilityVerdict,
} from "@/lib/catalog/deliverability";
import { slowestWindow } from "@/lib/catalog/delivery";
import { getBasketCarriage } from "@/lib/sanity/queries/product";

export interface BasketDeliveryAnswer {
  verdict: DeliverabilityVerdict;
  /** The slowest window in the basket — "3-4 weeks" — or null if unknown. */
  window: string | null;
}

/**
 * What the basket page cannot answer by itself: whether what is in it can
 * reach a postcode, and when the last of it arrives.
 *
 * A server action rather than a client-side check because the basket holds a
 * name and a price and nothing about carriage — and that is the right place
 * for the line to be. `deliverySize` and `weight` are routing inputs read
 * from the live Sanity record here, not something a localStorage basket from
 * three weeks ago gets to assert.
 *
 * ## Why this one is allowed to fail quietly
 *
 * `getBasketCarriage` goes through `sanityFetch`, which returns its fallback
 * on any error. An empty carriage list makes every verdict "deliverable", so
 * a Sanity outage turns this check off rather than stranding a customer who
 * could have ordered. That is only safe because it is not the guard:
 * `createCheckoutSession` runs the same function over `sanityClient.fetch`,
 * which throws, so the refusal that actually protects the order survives an
 * outage even when this advisory does not.
 *
 * Every export from a `"use server"` module must be an async function.
 */
export async function checkDeliverability(
  slugs: string[],
  postcode: string,
): Promise<BasketDeliveryAnswer> {
  // Bounded before it reaches the query — a public endpoint like any other
  // server action, and a basket is a handful of items.
  const safe = [...new Set(slugs)]
    .filter((slug) => typeof slug === "string" && slug.length < 200)
    .slice(0, 50);
  const items = await getBasketCarriage(safe);
  return {
    verdict: checkBasketDeliverability(items, postcode.slice(0, 12)),
    // Answered on the same round trip as the postcode check because the
    // basket needs both and neither is knowable in the browser. Returned
    // even when no postcode was given, which is the common case — the
    // window does not depend on the address.
    window: slowestWindow(items),
  };
}
