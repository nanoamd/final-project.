/**
 * AW Dropship's per-parcel courier cost to Kaiku, banded by weight — this is
 * Kaiku's real landed cost for every AW-sourced product, separate from the
 * trade unit price (costPrice), used for internal margin tracking only
 * (never charged to the customer — checkout always shows free UK delivery).
 *
 * Two tiers rather than modelling AW's full five geographic zones: Kaiku
 * only ships within Great Britain today (see checkout.ts's
 * shipping_address_collection), so a precise zone requires a real delivery
 * postcode — infrastructure this store doesn't have yet. "standard" covers
 * the vast majority of UK orders; "surcharge" is a single simplified
 * estimate for the rare remote-UK or international case, sized by weight
 * rather than exact destination. Edit shippingCost by hand in Studio for
 * any product where this default estimate is wrong.
 */

export type AwShippingTier = "standard" | "surcharge";

interface WeightBand {
  /** Upper bound in grams; Infinity for the top, open-ended band. */
  maxGrams: number;
  cost: number;
}

const STANDARD_BANDS: WeightBand[] = [
  { maxGrams: 99, cost: 2.79 },
  { maxGrams: 2000, cost: 2.99 },
  { maxGrams: Infinity, cost: 5.99 },
];

const SURCHARGE_BANDS: WeightBand[] = [
  { maxGrams: 999, cost: 13.0 },
  { maxGrams: 25000, cost: 35.0 },
];

/**
 * Looks up the estimated shipping cost for a parcel of the given weight.
 * Returns null only above 25kg (quote-only, no fixed rate estimated).
 */
export function getAwDropshipShippingCost(
  weightKg: number,
  tier: AwShippingTier = "standard",
): number | null {
  const grams = weightKg * 1000;
  const bands = tier === "standard" ? STANDARD_BANDS : SURCHARGE_BANDS;
  const band = bands.find((b) => grams <= b.maxGrams);
  return band?.cost ?? null;
}
