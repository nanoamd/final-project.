/**
 * UK postcode areas where delivery is restricted or costs more.
 *
 * This exists because Hill Interiors' rate card says two things the site did
 * not know:
 *
 *   "This pricing excludes surcharge areas such as the Isle of Man, Isle of
 *    Wight, Northern Ireland and the Scottish Highlands & Islands. The surcharge
 *    will be an additional £10.00 for these areas."
 *
 *   "2 Man delivery service is not available in these postcodes; BT (all), HS
 *    (all), IM (all), IV26-99, KA27, KA28, KW (all), PA15-78, PH19-50, ZE (all)."
 *
 * Checkout accepts any GB address (`allowed_countries: ["GB"]`) with no postcode
 * logic at all, so today a customer in Belfast can buy the 63kg Light Up
 * Bookcase and we would take the money with no way to fulfil it. That is worse
 * than a margin problem: it is a sale we have to unwind, on the piece with the
 * highest carriage in the range.
 *
 * The surcharge list is the softer half — £10 a parcel out of margin, on every
 * supplier, silently.
 *
 * Deliberately a pure function over a postcode string with no network call and
 * no dependency on the basket: it is used by the product page to tell the truth
 * before someone orders, and it can be used by order handling to catch one that
 * slipped through.
 */

/** Areas where a two-man service is not offered at all. */
const TWO_MAN_EXCLUDED_AREAS = new Set(["BT", "HS", "IM", "KW", "ZE"]);

/**
 * Areas excluded only across part of their district range.
 *
 * `IV26-99` means IV26 upward, not the whole of IV — Inverness itself (IV1-25)
 * is served. Getting this wrong in either direction is a real cost: too strict
 * blocks orders we could fulfil, too loose takes orders we cannot.
 */
const TWO_MAN_EXCLUDED_DISTRICTS: { area: string; from: number; to: number }[] =
  [
    { area: "IV", from: 26, to: 99 },
    { area: "KA", from: 27, to: 28 },
    { area: "PA", from: 15, to: 78 },
    { area: "PH", from: 19, to: 50 },
  ];

/**
 * Areas that carry a remote-delivery surcharge — the Isle of Man, the Isle of
 * Wight, Northern Ireland and the Scottish Highlands & Islands.
 *
 * Hill name the regions rather than the postcodes, so these are the standard
 * carrier definitions of them. PO30-41 is the Isle of Wight; the rest of PO is
 * Portsmouth and is not surcharged.
 */
const SURCHARGE_AREAS = new Set(["BT", "HS", "IM", "IV", "KW", "ZE"]);
const SURCHARGE_DISTRICTS: { area: string; from: number; to: number }[] = [
  { area: "PO", from: 30, to: 41 }, // Isle of Wight
  { area: "AB", from: 36, to: 38 },
  { area: "AB", from: 55, to: 56 },
  { area: "FK", from: 17, to: 21 },
  { area: "KA", from: 27, to: 28 },
  { area: "PA", from: 20, to: 78 },
  { area: "PH", from: 15, to: 50 },
];

/** Hill's stated surcharge for a remote area. */
export const REMOTE_SURCHARGE = 10;

export interface PostcodeZone {
  /** The letters at the start, e.g. "IV". Null when the input is unusable. */
  area: string | null;
  /** The digits of the outward code, e.g. 26 in "IV26 2XX". Null if absent. */
  district: number | null;
  /** Whether a two-man delivery service reaches here at all. */
  twoManAvailable: boolean;
  /** Whether carriage carries the remote surcharge. */
  surcharged: boolean;
  /** What to add to carriage for this address. */
  surcharge: number;
}

/**
 * Splits a UK postcode into its area letters and district number.
 *
 * Handles the formats people actually type — "iv26 2xx", "IV262XX", "BT1",
 * "PO30 1AA" — and returns nulls rather than throwing on anything else, because
 * a checkout must not 500 on a malformed postcode.
 */
function parse(postcode: string): {
  area: string | null;
  district: number | null;
} {
  const cleaned = postcode.toUpperCase().replace(/\s+/g, "");
  const match = /^([A-Z]{1,2})(\d{1,2})/.exec(cleaned);
  if (!match) return { area: null, district: null };
  return { area: match[1]!, district: Number(match[2]) };
}

function inRanges(
  area: string,
  district: number | null,
  ranges: { area: string; from: number; to: number }[],
): boolean {
  if (district === null) return false;
  return ranges.some(
    (r) => r.area === area && district >= r.from && district <= r.to,
  );
}

/**
 * Classifies a postcode. An unparseable postcode is treated as unrestricted and
 * unsurcharged: a wrong guess must never block a sale we could have fulfilled,
 * and the order-handling check catches what slips through.
 */
export function classifyPostcode(
  postcode: string | null | undefined,
): PostcodeZone {
  if (!postcode?.trim())
    return {
      area: null,
      district: null,
      twoManAvailable: true,
      surcharged: false,
      surcharge: 0,
    };

  const { area, district } = parse(postcode);
  if (!area)
    return {
      area: null,
      district,
      twoManAvailable: true,
      surcharged: false,
      surcharge: 0,
    };

  const twoManAvailable = !(
    TWO_MAN_EXCLUDED_AREAS.has(area) ||
    inRanges(area, district, TWO_MAN_EXCLUDED_DISTRICTS)
  );
  const surcharged =
    SURCHARGE_AREAS.has(area) || inRanges(area, district, SURCHARGE_DISTRICTS);

  return {
    area,
    district,
    twoManAvailable,
    surcharged,
    surcharge: surcharged ? REMOTE_SURCHARGE : 0,
  };
}

/**
 * The weight at and above which a piece needs a two-man service rather than a
 * single courier, and therefore inherits the postcode exclusions.
 *
 * Matches the split used for Hill's carriage bands in
 * scripts/fix-hill-interiors-carriage.ts. Kept here as well because the
 * storefront needs it and must not import from scripts/.
 */
export const TWO_MAN_FROM_KG = 40;

/** Whether this product will ship on a two-man service. */
export function needsTwoManDelivery(
  weightKg: number | null | undefined,
): boolean {
  return typeof weightKg === "number" && weightKg >= TWO_MAN_FROM_KG;
}

/** The customer-facing sentence for a two-man item. Plain, not apologetic. */
export const TWO_MAN_EXCLUSION_NOTE =
  "This piece is delivered by a two-person team, which is not available to " +
  "Northern Ireland, the Isle of Man, the Outer Hebrides, Orkney, Shetland, or " +
  "the more remote parts of the Scottish Highlands and Argyll. Please check with " +
  "us before ordering if you are in one of those areas.";
