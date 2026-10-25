/**
 * Hill Interiors carriage, the whole model in one place.
 *
 * ## Why this file exists
 *
 * Carriage has been got wrong twice, in opposite directions, by two scripts
 * that each had half the rule:
 *
 *   scripts/reprice-hill-from-dropship-feed.ts
 *     Bands by weight alone: courier to 40kg, two-man above. A 15kg sideboard
 *     is charged £9.99. Hill charged £49.99. That is the Contour error, and it
 *     understated landed cost on every heavy-but-compact piece.
 *
 *   scripts/fix-hill-interiors-carriage.ts
 *     Two-man at every weight, after the 40kg threshold above was found wrong.
 *     A 2.6kg picture frame is charged £49.99. Hill charges £6.99. That is why
 *     84 of 140 Hill products currently read as loss-making — most of them are
 *     candles, frames and clocks wearing a sofa's delivery cost.
 *
 * Neither is a rate-card problem. The rate card was always right and always in
 * the repo. The problem is that **carriage needs two inputs, and both scripts
 * only ever passed one.**
 *
 * ## The actual rule
 *
 * Hill's `Delivery Size` column chooses the service. Weight then chooses the
 * band within it. `scripts/reprice-hill-from-dropship-feed.ts:184` has been
 * reading that column into `deliverySize` all along and only consulted it when
 * weight was missing.
 *
 *   Delivery Size = Small  ->  standard courier bands
 *   Delivery Size = Large  ->  two-man bands
 *
 * Both of Damien's real invoices land exactly where this predicts, which is
 * what `hill-carriage.test.ts` pins:
 *
 *   Contour sideboard   15kg    Large   £49.99 ex   (two-man, up to 35kg)
 *   Sorelle sofa        39.9kg  Large   £59.99 ex   (two-man, 35-60kg)
 *
 * ## On guessing
 *
 * A missing input is reported, never quietly filled in the flattering
 * direction — that habit is what cost £49.20 a unit across the Hill range. When
 * the service cannot be determined, `estimated` is true and `reason` says what
 * is missing, and it is the caller's job to decide whether an estimated figure
 * may be written to Sanity. Nothing in here writes anything.
 *
 * Sanity stores carriage inclusive of VAT (Kaiku is not VAT registered, so
 * supplier VAT is an unrecoverable cost, not a reclaim). Multiply by VAT_RATE.
 */

/** Hill quote ex VAT. Kaiku cannot reclaim it, so the gross figure is the cost. */
export const VAT_RATE = 1.2;

export type Band = { maxKg: number; amount: number; label: string };

/**
 * Standard courier, ex VAT. One carrier, one parcel, left at the door.
 *
 * Confirmed in scripts/select-hill-products.ts:239,
 * scripts/backfill-hill-supplier.ts:13 and the carriage script's own header.
 */
export const COURIER_BANDS: readonly Band[] = [
  { maxKg: 10, amount: 6.99, label: "courier, up to 10kg" },
  { maxKg: 20, amount: 9.99, label: "courier, 10-20kg" },
  { maxKg: 40, amount: 14.99, label: "courier, 20-40kg" },
  { maxKg: Infinity, amount: 24.99, label: "courier, over 40kg" },
];

/**
 * Two-man, ex VAT. Two people, into the room, and it inherits the postcode
 * exclusions in src/lib/suppliers/delivery-zones.ts.
 */
export const TWO_MAN_BANDS: readonly Band[] = [
  { maxKg: 35, amount: 49.99, label: "two-man, up to 35kg" },
  { maxKg: 60, amount: 59.99, label: "two-man, 35-60kg" },
  { maxKg: 100, amount: 69.99, label: "two-man, 61-100kg" },
  { maxKg: 150, amount: 84.99, label: "two-man, 101-150kg" },
  { maxKg: Infinity, amount: 109.99, label: "two-man, over 150kg" },
];

export type Service = "courier" | "two-man";

export interface Carriage {
  /** Ex VAT, as Hill quote it. */
  exVat: number;
  /** Inclusive, as Sanity stores it. */
  incVat: number;
  service: Service;
  label: string;
  /** True when an input was missing and a figure was assumed. */
  estimated: boolean;
  /** What was missing, when `estimated`. Empty otherwise. */
  reason: string;
}

/** Hill's Small/Large flag, as the feed spells it, or nothing. */
export function serviceFor(
  deliverySize: string | null | undefined,
): Service | null {
  const v = (deliverySize ?? "").trim().toLowerCase();
  if (v === "large") return "two-man";
  if (v === "small") return "courier";
  return null;
}

function pick(bands: readonly Band[], kg: number): Band {
  return bands.find((b) => kg <= b.maxKg) ?? bands[bands.length - 1]!;
}

/**
 * What Hill will charge to send one of these.
 *
 * `deliverySize` is the `Delivery Size` column. `weightKg` is the feed's
 * weight, which is absent on roughly 210 rows.
 */
export function hillCarriage(input: {
  weightKg: number | null | undefined;
  deliverySize: string | null | undefined;
}): Carriage {
  const service = serviceFor(input.deliverySize);
  const kg =
    typeof input.weightKg === "number" && input.weightKg > 0
      ? input.weightKg
      : null;

  // Neither input. Nothing here can be better than a coin toss between £6.99
  // and £109.99, so it is reported rather than invented.
  if (!service && kg === null) {
    return {
      exVat: 0,
      incVat: 0,
      service: "two-man",
      label: "unknown",
      estimated: true,
      reason: "no Delivery Size and no weight — resolve by hand",
    };
  }

  // Weight but no service. The band is knowable, the service is not, and the
  // two differ by up to £43 at the same weight. Reported, not guessed.
  if (!service && kg !== null) {
    const band = pick(TWO_MAN_BANDS, kg);
    return {
      exVat: band.amount,
      incVat: Number((band.amount * VAT_RATE).toFixed(2)),
      service: "two-man",
      label: band.label,
      estimated: true,
      reason: `no Delivery Size — assumed two-man at ${kg}kg, the dearer of the two`,
    };
  }

  const bands = service === "two-man" ? TWO_MAN_BANDS : COURIER_BANDS;

  // Service but no weight. Hill's own flag is a real signal, so the service is
  // settled; only the band is open. Takes the band that both verified invoices
  // landed in rather than the cheapest.
  if (kg === null) {
    const band = service === "two-man" ? TWO_MAN_BANDS[1]! : COURIER_BANDS[2]!;
    return {
      exVat: band.amount,
      incVat: Number((band.amount * VAT_RATE).toFixed(2)),
      service: service!,
      label: band.label,
      estimated: true,
      reason: "no weight in the feed — mid band for the service",
    };
  }

  const band = pick(bands, kg);
  return {
    exVat: band.amount,
    incVat: Number((band.amount * VAT_RATE).toFixed(2)),
    service: service!,
    label: band.label,
    estimated: false,
    reason: "",
  };
}
