/**
 * AW Dropship's published courier shipping-cost table (their trade portal,
 * "Important Notice — Shipments to the US" page) — what they charge Kaiku
 * per parcel to fulfil an order, banded by destination zone and parcel
 * weight. This is Kaiku's real landed cost for every AW-sourced product,
 * separate from the trade unit price (costPrice).
 *
 * Kaiku only ships to Great Britain today (see checkout.ts's
 * shipping_address_collection), so only Zone 1 is used at import/checkout
 * time. Zones 2–5 are captured now so EU/international expansion doesn't
 * need this table rebuilt from the screenshots again.
 */

export type AwShippingZone = "zone1" | "zone2" | "zone3" | "zone4" | "zone5";

interface WeightBand {
  /** Upper bound in grams; Infinity for the top, open-ended band. */
  maxGrams: number;
  cost: number;
}

const AW_SHIPPING_TABLE: Record<AwShippingZone, WeightBand[]> = {
  // UK Mainland
  zone1: [
    { maxGrams: 99, cost: 2.79 },
    { maxGrams: 2000, cost: 2.99 },
    { maxGrams: Infinity, cost: 5.99 },
  ],
  // Northern Ireland
  zone2: [
    { maxGrams: 99, cost: 2.79 },
    { maxGrams: 2000, cost: 2.99 },
    { maxGrams: Infinity, cost: 14.5 },
  ],
  // Scottish Highlands & Isles, Channel Islands, Scilly Isles
  zone3: [
    { maxGrams: 99, cost: 2.79 },
    { maxGrams: 2000, cost: 2.99 },
    { maxGrams: Infinity, cost: 14.5 },
  ],
  // Europe
  zone4: [
    { maxGrams: 499, cost: 10.0 },
    { maxGrams: 25000, cost: 15.0 },
  ],
  // Switzerland & Norway
  zone5: [
    { maxGrams: 499, cost: 10.0 },
    { maxGrams: 999, cost: 13.0 },
    { maxGrams: 25000, cost: 35.0 },
  ],
};

/**
 * Looks up AW Dropship's shipping cost for a parcel of the given weight in
 * the given zone. Returns null only for zone4 25kg+ (quote-only, no fixed
 * rate published).
 */
export function getAwDropshipShippingCost(
  weightKg: number,
  zone: AwShippingZone = "zone1",
): number | null {
  const grams = weightKg * 1000;
  const band = AW_SHIPPING_TABLE[zone].find((b) => grams <= b.maxGrams);
  return band?.cost ?? null;
}
