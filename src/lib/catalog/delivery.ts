import type { SanityProduct } from "@/types/sanity-content";

/**
 * How a product is delivered, and what the page has to say about it.
 *
 * The brief asks the delivery section to state three things — expected lead
 * time, availability, and delivery method — and asks for a doorstep-delivery
 * note on large furniture, positioned as a transparent benefit rather than a
 * caveat.
 */

/**
 * Whether this is a two-person, doorstep-delivery piece.
 *
 * Judged on price and on what the thing is, because the documents carry no
 * weight or dimension reliably enough to use: `weight` is unset on most of the
 * catalogue, and where it is set it has already been found wrong once (Pershore,
 * 21kg stored against 28kg on the supplier page).
 *
 * £400 is the threshold because below it the range is lamps, mirrors, crates and
 * oils, none of which need a note; above it, it is sideboards, sofas and chests.
 * The name check catches the pieces that are bulky without being expensive — a
 * £350 shelf unit is still a two-person lift.
 */
const LARGE_FORMAT =
  /\bsofa|sideboard|chest of drawers|dining table|wardrobe|tv (unit|stand)|console|bookcase|display unit|armchair|club chair|shelf unit|corner shelf\b/i;

export function isLargeFurniture(product: SanityProduct): boolean {
  return (product.price ?? 0) >= 400 || LARGE_FORMAT.test(product.name ?? "");
}

/**
 * The doorstep-delivery wording.
 *
 * Written to the brief's instruction: professional, not negative, and framed as
 * the reason the pricing is what it is. That framing is not spin — a streamlined
 * delivery model genuinely is why a £1,095 media console is not £1,600, and
 * saying so plainly is more persuasive than burying it.
 *
 * It also does real work for the business: doorstep-versus-room-of-choice is one
 * of the most common causes of a furniture complaint, and a buyer who reads this
 * before ordering does not raise one afterwards.
 */
export const DOORSTEP_DELIVERY_NOTE =
  "Delivered to your doorstep at a time and date agreed with you in advance. " +
  "Room-of-choice placement and packaging removal are not included as standard, " +
  "and can be arranged as an additional service on request. This streamlined " +
  "model is how we offer pieces of this quality at considerably less than " +
  "traditional luxury furniture retailers.";

/** Plain-language availability, from `stockStatus`. */
export function availabilityLine(product: SanityProduct): string {
  switch (product.stockStatus) {
    case "In Stock":
      return "In stock and ready to dispatch";
    case "Made to Order":
      return "Made to order for you";
    case "Backorder":
      return "On backorder — reserved against the next delivery";
    case "Out of Stock":
      return "Currently out of stock";
    default:
      return "Availability confirmed when you order";
  }
}

/**
 * The one availability decision, which `googleAvailability` and
 * `schemaOrgAvailability` below then render into their own vocabularies.
 *
 * Deliberately next to `availabilityLine`: all of these answer the same
 * question to different audiences — a customer, a feed, a crawler — and a feed
 * or a page that contradicts the other is the misrepresentation Merchant
 * Center suspends accounts for. Keeping the decision in one place is what
 * stops them drifting; `delivery.test.ts` asserts the two machine-readable
 * ones agree on every input.
 *
 * The three cases that are not a straight lookup, and why:
 *
 * **No status at all → `backorder`.** 127 published products carry no
 * `stockStatus`, having come in through the importers rather than Studio,
 * whose schema `initialValue` would have set it. The storefront sells all of
 * them — full buy box, working add-to-cart — and tells the customer
 * "availability confirmed when you order". Sending `out of stock` for those
 * would be both untrue and expensive: Google accepts out-of-stock items and
 * then shows them to nobody, so it silently withholds 14% of the catalogue
 * from free listings. `backorder` is eligible to appear, and is the honest
 * description of a dropship order placed with the supplier on purchase — the
 * same value "Made to Order" already uses.
 *
 * **`Coming Soon` → `out of stock`.** These genuinely cannot be ordered: the
 * product page replaces the buy box with "Still in production". Google's
 * `preorder` would be the value if we took the order now and shipped later,
 * and we do not.
 *
 * **An unrecognised non-empty value → `out of stock`.** Absence of a status
 * means nobody set one; a value we do not know means somebody deliberately
 * set something this code has not been taught yet (a "Discontinued", say).
 * Advertising that as available is the one wrong answer, so the unknown case
 * stays conservative while the missing case does not.
 */
type CanonicalAvailability = "in-stock" | "backorder" | "out-of-stock";

function canonicalAvailability(
  stockStatus: string | null | undefined,
): CanonicalAvailability {
  if (!stockStatus?.trim()) return "backorder";

  switch (stockStatus) {
    case "In Stock":
      return "in-stock";
    case "Made to Order":
    case "Backorder":
      return "backorder";
    case "Out of Stock":
    case "Coming Soon":
      return "out-of-stock";
    default:
      return "out-of-stock";
  }
}

/** Availability in Google's Merchant Center vocabulary, for the product feed. */
export function googleAvailability(
  stockStatus: string | null | undefined,
): "in stock" | "out of stock" | "backorder" {
  return {
    "in-stock": "in stock",
    backorder: "backorder",
    "out-of-stock": "out of stock",
  }[canonicalAvailability(stockStatus)] as
    "in stock" | "out of stock" | "backorder";
}

/**
 * The same availability as a schema.org URL, for the Product JSON-LD on the
 * page itself.
 *
 * This is not a duplicate of the feed's mapping, it is the other half of it,
 * and it matters more than the feed does today: Google builds free Shopping
 * listings from a site's structured data as well as from a submitted feed, so
 * for a merchant whose feed is switched off this is the only availability
 * Google ever sees.
 *
 * It previously read from a `Record<StockStatus, string>` lookup. That is
 * exact for the five statuses Studio can set and silently wrong for a product
 * with none: the lookup returned `undefined`, `JSON.stringify` drops undefined
 * values, and the Offer went out with **no `availability` property at all** —
 * a required attribute, missing, on all 127 importer-created products. The
 * type did not catch it because `SanityProduct.stockStatus` was declared
 * non-nullable while the data has held nulls all along.
 *
 * `Made to Order` maps to BackOrder rather than PreOrder, matching the feed.
 * PreOrder in schema.org means an item not yet released, and Google expects an
 * `availabilityDate` alongside it; made-to-order stock is orderable today and
 * simply ships once built, which is what BackOrder describes.
 */
export function schemaOrgAvailability(
  stockStatus: string | null | undefined,
): string {
  return {
    "in-stock": "https://schema.org/InStock",
    backorder: "https://schema.org/BackOrder",
    "out-of-stock": "https://schema.org/OutOfStock",
  }[canonicalAvailability(stockStatus)];
}

/**
 * Kaiku's standard delivery windows, by price. Damien's rule, verbatim:
 * "under £50 should be 7-14 days delivery and over 50 should be 2-3 weeks and
 * above 120 should be 3-4 weeks shipping".
 *
 * Price is the band, not weight or supplier, deliberately: it is the one
 * figure every product in the catalogue actually has (unlike weight, unset on
 * most of it — see isLargeFurniture's note), so a band derived from it can be
 * stated on all 235 published products without a single gap or guess. Kaiku
 * sells nothing cheap that is also slow, so price tracks fulfilment
 * complexity closely enough to promise on.
 *
 * This is the **default**, not an override. A product carrying a genuine,
 * supplier-confirmed `deliveryLeadTime` keeps it — see `deliveryWindow`.
 */
export function standardWindowForPrice(price: number): string {
  // Boundaries read exactly as Damien wrote them: "under £50" excludes £50
  // itself, and "above 120" excludes £120 itself — so £50 is 2–3 weeks and
  // £120 is still 2–3 weeks, not 3–4.
  if (price < 50) return "7–14 days";
  if (price <= 120) return "2–3 weeks";
  return "3–4 weeks";
}

/**
 * Suppliers whose lead times are real, quoted commitments rather than Kaiku's
 * own standard bands — made-to-order goods built after the order is placed.
 *
 * The SaunaPlunge range is 4–6 weeks because that is how long Outdoor Living
 * 365 take to build one, stated in each product's own delivery copy. Every
 * sauna is over £120, so the band above would otherwise print "3–4 weeks" on
 * a £6,500 cabin that genuinely takes six — a promise the supplier cannot
 * keep. Damien's call when this conflict was put to him: the real lead time
 * wins, the band is for everything else.
 */
const CONFIRMED_LEAD_TIME_SUPPLIERS = [/^SaunaPlunge/i];

function hasConfirmedLeadTime(supplierName?: string | null): boolean {
  return Boolean(
    supplierName &&
    CONFIRMED_LEAD_TIME_SUPPLIERS.some((pattern) => pattern.test(supplierName)),
  );
}

/**
 * The delivery window to state for this product — one answer, meant for
 * every surface that mentions delivery, so the product page, the cart, the
 * Merchant feed, the comparison table and the confirmation email cannot
 * disagree with each other.
 *
 * A supplier-confirmed lead time wins where one exists; otherwise the price
 * band applies. Never returns null: a product with no recorded lead time
 * still has a price, so it still has an honest window to state — which is the
 * point, since "Delivery: not specified" on a £300 table is precisely the
 * kind of gap that costs a sale.
 *
 * Takes primitives rather than a `SanityProduct` so callers that only have a
 * few raw fields — the description generator, the wording auditor — can
 * reach the same one answer without constructing a fake product object.
 * `deliveryWindow` below is this with a `SanityProduct` unpacked into it.
 */
export function resolveDeliveryWindow(input: {
  price: number | null | undefined;
  supplierName?: string | null;
  deliveryLeadTime?: string | null;
}): string {
  const recorded = input.deliveryLeadTime?.trim();
  if (recorded && hasConfirmedLeadTime(input.supplierName)) return recorded;
  return standardWindowForPrice(input.price ?? 0);
}

export function deliveryWindow(product: SanityProduct): string {
  return resolveDeliveryWindow({
    price: product.price,
    supplierName: product.supplier?.name,
    deliveryLeadTime: product.deliveryLeadTime,
  });
}

/** "Delivered in 3–4 weeks" — always answers, per `deliveryWindow`. */
export function leadTimeLine(product: SanityProduct): string {
  return `Delivered in ${deliveryWindow(product)}`;
}
