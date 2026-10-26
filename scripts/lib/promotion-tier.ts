/**
 * Which products are worth spending money on, and which are worth having.
 *
 * ## Why this is a shared file now
 *
 * `set-promotion-tier.ts` owned this and `reprice-hill-from-dropship-feed.ts`
 * carried a second copy under a comment reading "the tiers
 * set-promotion-tier.ts uses. Kept identical on purpose." Two copies stay
 * identical right up until one is edited, and this one is about to be.
 *
 * ## The four advertising tiers, unchanged
 *
 *   strong  35%+ margin and £25+ cash kept
 *   viable  30%+ margin and £20+ cash kept
 *   cash    £250+ cash kept at 15%+ — a sauna at 18% is still £600 a sale
 *
 * Both a percentage and a cash test have to pass, because each catches a
 * different failure: percentage alone passes a £9 candle holder at 60% keeping
 * £5, cash alone passes an £800 table at 8% keeping £64 that one redelivery
 * erases.
 *
 * ## And one that is not about advertising at all
 *
 * The cash floors above exist to answer one question: can this product fund the
 * £50–£200 of clicks it takes to find the person who buys it? For most of the
 * catalogue the answer is no, and `below` is the honest verdict.
 *
 * But it is the wrong question for a cheap decorative piece, because that is
 * not how a cheap decorative piece sells. Its job is to be added to an order
 * that has already been won — where the acquisition cost is zero, because it
 * was paid by the sofa.
 *
 * Measured on the live catalogue, 26 October:
 *
 *   price band   products   worth advertising   median cash kept
 *   £0-25              39                   0              £8.01
 *   £25-50            110                  11             £12.67
 *   £50-100           153                  36             £18.60
 *   £100-200          167                  87             £44.48
 *
 * Nothing under £25 passes, and nothing will: keeping £20 on a £35 item needs a
 * 60% margin, and dropship wholesale runs 25–40%. **No new supplier fixes
 * that** — a cheaper decor supplier delivers more products keeping £8 to £13,
 * which fail the same test for the same reason. What was wrong was judging them
 * by it.
 *
 * So `basket` marks a product that does not pay for its own acquisition but
 * does pay as an add-on: **£15+ kept with carriage excluded, 25%+ on that, and
 * under £100.** Carriage is excluded because carriage is per consignment, not
 * per item — established in `hill-interiors-competitor-prices.md` — so a second
 * piece from the same supplier ships on the first one's carriage.
 *
 * The floors are lower than `viable` deliberately. £15 rather than £20 because
 * there is no acquisition to fund, only the risk of a return to cover; 25%
 * rather than 30% for the same reason. The £100 cap is where a thing stops
 * being an add-on and becomes a purchase in its own right, which should face
 * the full test.
 *
 * On today's numbers this is **91 products, £29 to £100, median £53** — drawn
 * out of the 630 the old rule called `below` and left as dead weight.
 *
 * ## What reads the tier
 *
 * The Merchant feed emits it as `custom_label_0`, so a Performance Max campaign
 * can target what pays rather than all 908 — and can now exclude `basket`
 * explicitly, which matters, because a basket builder bought on its own at £53
 * loses money on the clicks. The sizing calculators filter on
 * `["strong", "viable", "cash"]`, so `basket` is correctly outside that: it is
 * for the product page and the cart, not for a recommendation rail.
 */

/** Stripe, roughly: 1.5% plus 20p on a UK card. */
export const CARD_RATE = 0.015;
export const CARD_FIXED = 0.2;

export type PromotionTier = "strong" | "viable" | "cash" | "basket" | "below";

/** Each advertising tier's floors, and the add-on route's, in one place. */
export const TIER_RULES = {
  strong: { margin: 0.35, cash: 25 },
  viable: { margin: 0.3, cash: 20 },
  cash: { margin: 0.15, cash: 250 },
  basket: { margin: 0.25, cash: 15, maxPrice: 100 },
} as const;

/** What is left after the supplier, the carriage and the card fee. */
export function cashKept(
  price: number,
  costPrice: number,
  shippingCost: number | null,
): number {
  return (
    price - costPrice - (shippingCost ?? 0) - (price * CARD_RATE + CARD_FIXED)
  );
}

export function promotionTier(
  price: number,
  costPrice: number,
  shippingCost: number | null,
): PromotionTier {
  if (!(price > 0)) return "below";

  const keep = cashKept(price, costPrice, shippingCost);
  const margin = keep / price;

  if (margin >= TIER_RULES.strong.margin && keep >= TIER_RULES.strong.cash)
    return "strong";
  if (margin >= TIER_RULES.viable.margin && keep >= TIER_RULES.viable.cash)
    return "viable";
  if (keep >= TIER_RULES.cash.cash && margin >= TIER_RULES.cash.margin)
    return "cash";

  // Added to an order that already exists, so it rides the first item's
  // carriage. Checked last: anything that pays its own way is better than an
  // add-on and has already returned above.
  const asAddOn = cashKept(price, costPrice, 0);
  if (
    price <= TIER_RULES.basket.maxPrice &&
    asAddOn >= TIER_RULES.basket.cash &&
    asAddOn / price >= TIER_RULES.basket.margin
  )
    return "basket";

  return "below";
}
