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

/** "Delivered in 3–4 weeks", or null when the product does not say. */
export function leadTimeLine(product: SanityProduct): string | null {
  const lead = product.deliveryLeadTime?.trim();
  if (!lead) return null;
  // Reads as a sentence whether the value is "3–4 weeks" or "2–5 days".
  return `Delivered in ${lead}`;
}
