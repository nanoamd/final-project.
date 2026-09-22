import type Stripe from "stripe";

/**
 * What we keep about an abandoned basket, and how to read it off Stripe.
 *
 * Deliberately not in `src/server/`: the Stripe webhook records these live,
 * `scripts/backfill-abandoned-checkouts.ts` recovers the ones Stripe still
 * holds from before it did, and the recovery email reads them back. All three
 * want one shape, and the script cannot import a `server-only` module.
 *
 * The webhook currently writes the narrower `{slug, name, quantity,
 * unit_amount}` inline — it predates this module by a commit, and moving it
 * across belongs with the change that wires up the recovery email, which is
 * Damien's to approve. Anything reading these rows must therefore treat
 * `category` and `image` as absent-but-normal rather than as missing data.
 *
 * The field names are snake_case because they are stored verbatim as the
 * `line_items` jsonb in `abandoned_checkouts`, alongside columns of the same
 * style, and a jsonb blob that disagrees with its own table is a trap for
 * whoever writes the query next.
 */
export interface AbandonedLineItem {
  /** Product slug from the Stripe product metadata, where one survived. */
  slug: string | null;
  /** Category slug — needed with the slug to build a product URL. */
  category: string | null;
  /** Title as the customer saw it at checkout, options suffix included. */
  name: string | null;
  quantity: number | null;
  /** Unit price in pence, as Stripe recorded it. */
  unit_amount: number | null;
  /** Absolute image URL, already public on Sanity's CDN. */
  image: string | null;
}

/**
 * Maps Stripe's expanded line items onto the stored shape.
 *
 * `slug`, `category` and the image all come from the ephemeral Stripe Product
 * that `createCheckoutSession` builds for each line — see the metadata block
 * in `src/server/actions/checkout.ts`. Reading them back off the session means
 * the recovery email shows what the customer actually saw and priced, rather
 * than what the catalogue happens to say a week later.
 *
 * Requires the session to have been retrieved with
 * `expand: ["line_items.data.price.product"]`. Without the expansion `product`
 * is a bare id string, and every field here except name and quantity comes
 * back null — which is degraded, not broken, and is why nothing throws.
 */
export function mapAbandonedLineItems(
  lineItems: Stripe.LineItem[],
): AbandonedLineItem[] {
  return lineItems.map((line) => {
    const product = line.price?.product;
    const expanded =
      product && typeof product !== "string" && !product.deleted
        ? product
        : null;
    return {
      slug: expanded?.metadata?.slug ?? null,
      category: expanded?.metadata?.category ?? null,
      name: line.description ?? null,
      quantity: line.quantity ?? null,
      unit_amount: line.price?.unit_amount ?? null,
      image: expanded?.images?.[0] ?? null,
    };
  });
}
