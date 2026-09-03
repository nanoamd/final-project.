/**
 * Sofa size and room fit.
 *
 * There is no official sofa-size standard the way there is for a UK bed —
 * every maker cuts its own frame — so the figures here are ranges taken from
 * the sofas actually sold, not a fixed spec: a 2-seater runs 140-180cm wide, a
 * 3-seater 198-229cm, both around 85-100cm deep. This calculator works from
 * the middle of each range, which is why it names a range back at the end
 * rather than a single model number.
 *
 *   - Width is the wall the sofa backs onto. Depth is the floor space it
 *     needs from that wall to whatever is in front of it — a coffee table,
 *     a walkway, the opposite wall.
 *   - In front of a sofa, 45cm is the minimum to a coffee table — enough to
 *     reach a drink without standing. Where that same space is also how
 *     people get past to the rest of the room, it wants 90cm, the same
 *     figure this site uses everywhere else for "a person can pass."
 *   - Corner and chaise sofas are excluded on purpose. They are not a
 *     rectangle — the two legs of the L are usually different lengths — so a
 *     single width-and-depth check would either overstate or understate the
 *     fit. The guide this powers covers measuring a corner sofa's two legs
 *     separately instead.
 *
 * Pure arithmetic over the shopper's own measurements.
 */

export type SofaSizeName = "twoSeater" | "threeSeater" | "fourSeater";

/** Nominal width, in cm, taken from the middle of each size's real-world range. */
export const SOFA_WIDTHS_CM: Record<SofaSizeName, number> = {
  twoSeater: 160,
  threeSeater: 213,
  fourSeater: 250,
};

/** Real-world range each nominal width is drawn from, in cm — for the copy, not the maths. */
export const SOFA_WIDTH_RANGE_CM: Record<
  SofaSizeName,
  { min: number; max: number }
> = {
  twoSeater: { min: 140, max: 180 },
  threeSeater: { min: 198, max: 229 },
  fourSeater: { min: 230, max: 270 },
};

/** Typical seat-plus-back depth for a straight sofa, in cm. */
export const SOFA_DEPTH_CM = 95;

/** Minimum clearance to a coffee table in front — enough to reach it without standing. */
export const FRONT_CLEARANCE_CM = 45;
/** A front clearance that also doubles as the room's main walkway. */
export const WALKWAY_CLEARANCE_CM = 90;

const SOFA_ORDER: SofaSizeName[] = ["twoSeater", "threeSeater", "fourSeater"];

export interface SofaSizeInput {
  /** The wall the sofa's back will sit against, in cm. */
  wallWidth?: number;
  /** Floor space from that wall to the nearest obstruction in front, in cm. */
  roomDepth?: number;
  /** Whether the space in front is also the room's main walkway. */
  frontIsWalkway?: boolean;
}

export interface SofaFitResult {
  size: SofaSizeName;
  fits: boolean;
  /** How much floor is left in front once this size is in, in cm. */
  frontClearance: number;
}

export interface SofaSizeResult {
  sizes: SofaFitResult[];
  largestThatFits: SofaSizeName | null;
  notes: string[];
}

function label(size: SofaSizeName): string {
  if (size === "twoSeater") return "2-seater";
  if (size === "threeSeater") return "3-seater";
  return "4-seater";
}

export function sofaSize(input: SofaSizeInput): SofaSizeResult | null {
  const { wallWidth, roomDepth, frontIsWalkway = false } = input;
  if (!wallWidth || wallWidth <= 0 || !roomDepth || roomDepth <= 0) return null;

  const neededClearance = frontIsWalkway
    ? WALKWAY_CLEARANCE_CM
    : FRONT_CLEARANCE_CM;

  const sizes: SofaFitResult[] = SOFA_ORDER.map((size) => {
    const width = SOFA_WIDTHS_CM[size];
    const frontClearance = roomDepth - SOFA_DEPTH_CM;
    const fits = wallWidth >= width && frontClearance >= neededClearance;
    return { size, fits, frontClearance: Math.max(0, frontClearance) };
  });

  const largestThatFits =
    [...sizes].reverse().find((s) => s.fits)?.size ?? null;

  const notes: string[] = [];
  if (largestThatFits) {
    const range = SOFA_WIDTH_RANGE_CM[largestThatFits];
    notes.push(
      `A ${label(largestThatFits)} — typically ${range.min}-${range.max}cm wide — fits this wall, with ${sizes.find((s) => s.size === largestThatFits)!.frontClearance}cm left in front of it.`,
    );
    const next = SOFA_ORDER[SOFA_ORDER.indexOf(largestThatFits) + 1];
    if (next) {
      const nextRange = SOFA_WIDTH_RANGE_CM[next];
      notes.push(
        `A ${label(next)} runs ${nextRange.min}-${nextRange.max}cm wide — check the exact model's width against this wall before assuming it won't fit.`,
      );
    }
  } else {
    notes.push(
      "Even a 2-seater is tight here — recheck the wall width, or budget for an armchair instead of a sofa.",
    );
  }
  if (frontIsWalkway) {
    notes.push(
      "The space in front is doing double duty as a walkway, which is why it needs 90cm rather than 45cm — enough for someone to pass without climbing over a coffee table.",
    );
  } else {
    notes.push(
      "45cm in front is the minimum to reach a coffee table without standing up — comfortable is closer to 60cm.",
    );
  }
  notes.push(
    "This covers straight sofas only. A corner or chaise sofa is not a rectangle, so measure its two legs separately against the two walls it will actually sit along.",
  );

  return { sizes, largestThatFits, notes };
}
