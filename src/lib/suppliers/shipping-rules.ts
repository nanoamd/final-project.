/**
 * How much carriage a supplier actually charges Kaiku, expressed as a rule per
 * supplier rather than a number typed onto each product.
 *
 * **The customer never pays any of this.** Damien: "i want zero shipping costs
 * in the prices for any products". Checkout offers exactly one shipping option
 * at £0 (see `createCheckoutSession`), `shippingCost` appears in no storefront
 * query, and nothing here is ever added to a displayed price. Carriage comes out
 * of Kaiku's margin, which is precisely why it has to be recorded accurately:
 * an unknown supplier carriage cost is an unknown profit.
 *
 * A rule beats a per-product number for the obvious reason — a supplier's terms
 * are one fact about that supplier, and entering it 136 times by hand is 136
 * chances to get it wrong. It also means when a supplier changes their carriage,
 * one edit re-derives every product's cost.
 *
 * The five shapes below cover the terms actually seen across Kaiku's suppliers
 * so far. `resolveShippingCost` returns `null` — never a guess — when a rule
 * needs a figure the product does not carry (a weight-banded rule against a
 * product with no recorded weight), because a made-up carriage cost produces a
 * made-up margin, and scripts/margin-report.ts already knows how to report an
 * unknown honestly.
 */

export type ShippingRule =
  /**
   * Carriage is already inside the trade price, so there is nothing to add.
   * SaunaPlunge bundle pallet delivery into the cost of the sauna.
   */
  | { kind: "included" }
  /** One charge per order, however many items are on it. */
  | { kind: "flatPerOrder"; amount: number }
  /** A charge per item. D.I. Designs bill £80 an item. */
  | { kind: "flatPerItem"; amount: number }
  /**
   * Banded by the item's weight. AW Dropship's courier rates work this way.
   * Bands are matched in order, first `maxKg` at or above the weight winning,
   * so they must be listed lightest first.
   */
  | { kind: "weightBands"; bands: { maxKg: number; amount: number }[] }
  /**
   * Free once the order is large enough, a flat charge below that. Common on
   * trade accounts with a carriage-paid threshold.
   */
  | {
      kind: "freeOverOrderValue";
      threshold: number;
      amountBelowThreshold: number;
    };

export interface ShippingInput {
  /** The item's own weight in kilograms, where the product records one. */
  weightKg?: number | null;
  /** The trade value of the line, for a threshold rule. */
  orderValue?: number | null;
}

/**
 * What this supplier charges to carry one unit of this product, or `null` when
 * the rule cannot be resolved from what the product records.
 *
 * `null` is a deliberate, load-bearing return value and not an error: it means
 * "this is genuinely not known yet", which is different from £0 ("they deliver
 * free"). Collapsing the two is how a product ends up looking more profitable
 * than it is — see the note on `carriageIncludedInCost` in
 * src/sanity/schemaTypes/documents/supplier.ts, which exists for the same
 * reason.
 */
export function resolveShippingCost(
  rule: ShippingRule | null | undefined,
  input: ShippingInput = {},
): number | null {
  if (!rule) return null;

  switch (rule.kind) {
    case "included":
      return 0;

    // Per-order and per-item are the same figure for a single unit, which is
    // what a product-level shippingCost represents. They are kept as separate
    // kinds because they diverge the moment a basket holds two items, and a
    // future basket-level calculation will need to tell them apart.
    case "flatPerOrder":
    case "flatPerItem":
      return rule.amount;

    case "weightBands": {
      if (typeof input.weightKg !== "number" || input.weightKg <= 0)
        return null;
      const band = rule.bands.find((b) => input.weightKg! <= b.maxKg);
      // Above the heaviest band there is no rate to apply — usually because the
      // supplier quotes those individually. Unknown, not free.
      return band ? band.amount : null;
    }

    case "freeOverOrderValue": {
      if (typeof input.orderValue !== "number") return null;
      return input.orderValue >= rule.threshold ? 0 : rule.amountBelowThreshold;
    }
  }
}

/**
 * Whether a rule can ever be resolved for a product carrying no weight — used
 * to report *why* a supplier's products have unknown carriage, so the answer is
 * "nobody has weighed them" rather than a shrug.
 */
export function ruleNeedsWeight(
  rule: ShippingRule | null | undefined,
): boolean {
  return rule?.kind === "weightBands";
}

/** A one-line description of a rule, for a report or a Studio preview. */
export function describeRule(rule: ShippingRule | null | undefined): string {
  if (!rule) return "no rule recorded";
  switch (rule.kind) {
    case "included":
      return "carriage included in the trade price";
    case "flatPerOrder":
      return `£${rule.amount.toFixed(2)} per order`;
    case "flatPerItem":
      return `£${rule.amount.toFixed(2)} per item`;
    case "weightBands":
      return `by weight: ${rule.bands
        .map((b) => `≤${b.maxKg}kg £${b.amount.toFixed(2)}`)
        .join(", ")}`;
    case "freeOverOrderValue":
      return `free over £${rule.threshold}, otherwise £${rule.amountBelowThreshold.toFixed(2)}`;
  }
}
