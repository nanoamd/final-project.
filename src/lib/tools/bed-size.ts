/**
 * UK bed size and room fit.
 *
 * The question is not "will the bed fit" — a tape measure answers that. It is
 * "will the room still work with the bed in it": can you walk round it to
 * make it, open the wardrobe, get the door shut. That needs clearance, not
 * just floor space, and clearance is what most bed-size advice skips.
 *
 *   - UK sizes step in fixed increments: Single 90cm, Double 135cm, King
 *     150cm, Super King 180cm wide, all 190-200cm long. The jump from King to
 *     Super King is 30cm — roughly one more shoulder's width across the bed.
 *   - A side you walk down, or make the bed from, wants at least 60cm clear.
 *     A side that is also the room's main walkway — the path from door to
 *     wardrobe, say — wants 90cm, the same figure every other clearance
 *     calculator on this site uses for "a person can pass."
 *   - The headboard wall itself needs no clearance; a bed sits flush against
 *     it. The clearance budget goes on the other three sides, and in practice
 *     mostly on the two long sides and the foot of the bed.
 *
 * Pure arithmetic over the shopper's own measurements.
 */

export type BedSizeName = "single" | "double" | "king" | "superking";

/** Nominal UK mattress width, in cm — length is 190cm for all but King/Super King at 200cm. */
export const BED_WIDTHS_CM: Record<BedSizeName, number> = {
  single: 90,
  double: 135,
  king: 150,
  superking: 180,
};

export const BED_LENGTHS_CM: Record<BedSizeName, number> = {
  single: 190,
  double: 190,
  king: 200,
  superking: 200,
};

const BED_ORDER: BedSizeName[] = ["single", "double", "king", "superking"];

/** A side you make the bed from or walk down. */
export const SIDE_CLEARANCE_CM = 60;
/** A side that doubles as the room's main walkway — door to wardrobe, say. */
export const WALKWAY_CLEARANCE_CM = 90;

export interface BedSizeInput {
  /** The wall the headboard will sit against, in cm. */
  wallWidth?: number;
  /** Floor space from that wall to the far side of the room, in cm. */
  roomDepth?: number;
  /** Whether the foot of the bed is also the path to a door or wardrobe. */
  footIsWalkway?: boolean;
}

export interface BedFitResult {
  size: BedSizeName;
  fits: boolean;
  /** How much clearance is actually left on each long side, in cm. */
  sideClearance: number;
}

export interface BedSizeResult {
  /** Every UK size, in order, with whether this room takes it. */
  sizes: BedFitResult[];
  /** The largest size that fits — what to shop for. */
  largestThatFits: BedSizeName | null;
  notes: string[];
}

function label(size: BedSizeName): string {
  return size === "superking"
    ? "Super King"
    : size[0]!.toUpperCase() + size.slice(1);
}

export function bedSize(input: BedSizeInput): BedSizeResult | null {
  const { wallWidth, roomDepth, footIsWalkway = false } = input;
  if (!wallWidth || wallWidth <= 0 || !roomDepth || roomDepth <= 0) return null;

  const footClearance = footIsWalkway
    ? WALKWAY_CLEARANCE_CM
    : SIDE_CLEARANCE_CM;

  const sizes: BedFitResult[] = BED_ORDER.map((size) => {
    const bedWidth = BED_WIDTHS_CM[size];
    const bedLength = BED_LENGTHS_CM[size];
    // Clearance is split across both long sides — the bed does not have to
    // sit centred, but there needs to be at least SIDE_CLEARANCE_CM of it
    // going spare somewhere to actually walk down.
    const sideClearance = wallWidth - bedWidth;
    const depthFits = roomDepth - bedLength >= footClearance;
    const fits = sideClearance >= SIDE_CLEARANCE_CM && depthFits;
    return { size, fits, sideClearance: Math.max(0, sideClearance) };
  });

  const largestThatFits =
    [...sizes].reverse().find((s) => s.fits)?.size ?? null;

  const notes: string[] = [];
  if (largestThatFits) {
    const result = sizes.find((s) => s.size === largestThatFits)!;
    notes.push(
      `A ${label(largestThatFits)} (${BED_WIDTHS_CM[largestThatFits]}cm wide) leaves ${result.sideClearance}cm spare across the wall — enough for a ${result.sideClearance >= WALKWAY_CLEARANCE_CM ? "walkway" : "side to make the bed from"} once it's positioned.`,
    );
    const next = BED_ORDER[BED_ORDER.indexOf(largestThatFits) + 1];
    if (next) {
      const shortfall = BED_WIDTHS_CM[next] - wallWidth + SIDE_CLEARANCE_CM;
      notes.push(
        `The next size up, ${label(next)}, would need ${shortfall}cm more wall than this room has.`,
      );
    }
  } else {
    notes.push(
      "Even a Single needs more clearance than this room currently gives it — check the measurement, or plan on losing the walking space down one side.",
    );
  }
  if (footIsWalkway) {
    notes.push(
      "The foot of the bed is doing double duty as a walkway, which is why it needs 90cm rather than 60cm — enough for someone to pass without brushing the mattress.",
    );
  }

  return { sizes, largestThatFits, notes };
}
