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
 * The delivery window to state for this product — one answer, used by every
 * surface that mentions delivery, so the product page, the cart, the
 * Merchant feed, the comparison table and the confirmation email cannot
 * disagree with each other.
 *
 * A supplier-confirmed lead time wins where one exists; otherwise the price
 * band applies. Never returns null: a product with no recorded lead time
 * still has a price, so it still has an honest window to state — which is the
 * point, since "Delivery: not specified" on a £300 table is precisely the
 * kind of gap that costs a sale.
 */
export function deliveryWindow(product: SanityProduct): string {
  const recorded = product.deliveryLeadTime?.trim();
  if (recorded && hasConfirmedLeadTime(product.supplier?.name)) return recorded;
  return standardWindowForPrice(product.price ?? 0);
}

/** "Delivered in 3–4 weeks" — always answers, per `deliveryWindow`. */
export function leadTimeLine(product: SanityProduct): string {
  return `Delivered in ${deliveryWindow(product)}`;
}
