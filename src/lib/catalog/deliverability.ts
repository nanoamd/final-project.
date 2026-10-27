import { siteConfig } from "@/config/site";
import {
  classifyPostcode,
  needsTwoManDelivery,
} from "@/lib/suppliers/delivery-zones";

/**
 * Whether a basket can actually be delivered to a given postcode.
 *
 * ## The hole this closes
 *
 * Checkout collects a GB address and charges £0 carriage to all of it —
 * `shipping_address_collection: { allowed_countries: ["GB"] }` with a single
 * fixed `amount: 0` rate called "Free UK Delivery". Stripe Checkout has no
 * postcode allow-list, so every GB postcode is accepted by construction.
 *
 * But a two-person delivery service does not reach BT, HS, IM, KW or ZE at
 * all, nor IV26-99, KA27-28, PA15-78 or PH19-50 — see delivery-zones.ts, which
 * takes those ranges from Hill's own rate card. So before this existed, a
 * customer in Belfast could buy the 63kg Light Up Bookcase, pay for it, and
 * the order then had to be unwound: the piece with the highest carriage in the
 * range, refunded, on the first contact a new customer ever has with the shop.
 *
 * The product page already prints TWO_MAN_EXCLUSION_NOTE and asks the buyer to
 * check with us first. That is a request, not a guard — it relies on someone
 * reading a paragraph and acting against their own momentum. This is the
 * guard: the basket asks for a postcode, and an impossible order is refused
 * before any money moves rather than apologised for afterwards.
 *
 * ## Deliberately advisory about an address we were not given
 *
 * A blank or unparseable postcode is deliverable. `classifyPostcode` is
 * documented to treat an unreadable postcode as unrestricted for the same
 * reason — "a wrong guess must never block a sale we could have fulfilled" —
 * and the postcode field on the basket is optional, because a required field
 * in front of a payment button is a cost paid by every customer to catch the
 * few in excluded areas.
 *
 * The buyer can also type one postcode here and another into Stripe. That is
 * not worth defending against: this catches the honest case, which is all of
 * them, and order handling still has `classifyPostcode` to check what actually
 * arrives.
 */

/** What a verdict needs to know about one basket line. */
export interface DeliverabilityItem {
  slug: string;
  title: string;
  weightKg?: number | null;
  deliverySize?: string | null;
}

export interface DeliverabilityVerdict {
  /** The postcode as judged, or null when there was nothing to judge. */
  postcode: string | null;
  /** False only when we are sure: a known postcode and a known two-man item. */
  deliverable: boolean;
  /** The lines that cannot be delivered there, for the UI to name. */
  blocked: { slug: string; title: string }[];
  /** Whether this address carries the remote surcharge Kaiku absorbs. */
  surcharged: boolean;
  /** Customer-facing explanation, or null when there is nothing to say. */
  message: string | null;
}

const DELIVERABLE: DeliverabilityVerdict = {
  postcode: null,
  deliverable: true,
  blocked: [],
  surcharged: false,
  message: null,
};

/**
 * The areas a two-person service does not reach, in words rather than
 * postcodes, because a customer knows where they live and not which postcode
 * ranges a carrier excludes.
 *
 * Kept beside the classifier it describes so the two cannot drift: a test
 * asserts this sentence still accounts for every area in
 * TWO_MAN_EXCLUDED_AREAS and TWO_MAN_EXCLUDED_DISTRICTS.
 */
export const TWO_MAN_EXCLUDED_PLACES =
  "Northern Ireland, the Isle of Man, the Outer Hebrides, Orkney, Shetland, " +
  "and the more remote parts of the Scottish Highlands and Argyll";

/**
 * Judges a basket against a postcode.
 *
 * Pure, so the basket page, the server action behind it and the checkout
 * refusal all reach the same verdict from the same inputs — three places
 * telling a customer three different things about one address is the failure
 * this shape exists to prevent.
 */
export function checkBasketDeliverability(
  items: DeliverabilityItem[],
  postcode: string | null | undefined,
): DeliverabilityVerdict {
  if (!postcode?.trim()) return DELIVERABLE;

  const zone = classifyPostcode(postcode);
  // Unparseable: nothing to judge, and the documented choice is to let it
  // through rather than block a sale on a typo.
  if (!zone.area) return DELIVERABLE;

  const tidy = postcode.trim().toUpperCase().replace(/\s+/g, " ");
  const blocked = zone.twoManAvailable
    ? []
    : items
        .filter((item) => needsTwoManDelivery(item.weightKg, item.deliverySize))
        .map((item) => ({ slug: item.slug, title: item.title }));

  if (!blocked.length) {
    return {
      postcode: tidy,
      deliverable: true,
      blocked: [],
      surcharged: zone.surcharged,
      message: null,
    };
  }

  const names = blocked.map((item) => item.title);
  const subject =
    names.length === 1
      ? `${names[0]} cannot be delivered`
      : `${names.length} items in your basket cannot be delivered`;

  return {
    postcode: tidy,
    deliverable: false,
    blocked,
    surcharged: zone.surcharged,
    message:
      `${subject} to a ${zone.area}${zone.district ?? ""} address. ` +
      `${names.length === 1 ? "It needs" : "They need"} a two-person delivery team, ` +
      `and that service does not reach ${TWO_MAN_EXCLUDED_PLACES}. ` +
      `Remove ${names.length === 1 ? "it" : "them"} to order the rest of your basket, ` +
      `or email ${siteConfig.email} and we will see what we can arrange.`,
  };
}
