/**
 * Wall clock sizing and hanging height.
 *
 * A clock is the one decorative object on a wall with a job to do, and the two
 * questions people search are "what size wall clock" and "how high to hang a
 * wall clock". Both have settled answers:
 *
 *   - Over furniture, a clock reads as belonging to it at roughly two-thirds
 *     of the furniture's width. This is the same proportion that governs
 *     mirrors and pictures, and it fails the same way: too small looks
 *     stranded, too wide looks like an overhang.
 *   - It needs clear wall of about half its own diameter on each side, so an
 *     80cm clock wants 160cm of wall to itself. On a bare wall that constraint
 *     replaces the furniture entirely — take about half the usable run.
 *   - A clock you read hangs higher than a picture: centre at 150-170cm. A
 *     clock that is mainly decorative follows the gallery convention at 145cm.
 *
 * Kitchens are the exception worth encoding, because the answer there is not
 * a proportion of anything in the room — it is the gap between the top of the
 * wall cabinets and the ceiling, and that gap wins.
 *
 * Pure arithmetic over the shopper's own measurements.
 */

/** Gallery convention: centre of the piece 145cm from the floor. */
export const DECORATIVE_CENTRE_CM = 145;
/** A clock you actually read wants to be above furniture and sightlines. */
export const FUNCTIONAL_CENTRE_CM = { min: 150, max: 170 };
/** Clear wall wanted either side, as a fraction of the clock's own diameter. */
export const BREATHING_SPACE = 0.5;

export type ClockPlacement = "furniture" | "wall" | "kitchen";

export interface WallClockSizeInput {
  placement: ClockPlacement;
  /** Width of the console, sideboard or mantel it hangs over, in cm. */
  furnitureWidth?: number;
  /** Usable run of bare wall — architrave to shelf, not corner to corner. */
  wallWidth?: number;
  /** Gap between the top of the wall cabinets and the ceiling, in cm. */
  cabinetGap?: number;
  /** Whether the clock is there to be read, which raises it. */
  read?: boolean;
}

export interface WallClockSizeResult {
  /** The range that works, in cm of diameter. */
  diameterRange: { min: number; max: number };
  /** The single number to shop with. */
  idealDiameter: number;
  /** Clear wall the ideal diameter needs, in cm. */
  wallNeeded: number;
  /** Height of the centre of the face from the floor, in cm. */
  centreHeight: number;
  notes: string[];
}

const round5 = (n: number) => Math.round(n / 5) * 5;

export function wallClockSize(
  input: WallClockSizeInput,
): WallClockSizeResult | null {
  const {
    placement,
    furnitureWidth,
    wallWidth,
    cabinetGap,
    read = true,
  } = input;

  let min: number;
  let max: number;
  const notes: string[] = [];

  if (placement === "furniture") {
    if (!furnitureWidth || furnitureWidth <= 0) return null;
    min = round5(furnitureWidth * 0.55);
    max = round5(furnitureWidth * 0.7);
    notes.push(
      `Two-thirds of the furniture below is the proportion to aim at, which on ${furnitureWidth}cm is about ${round5(furnitureWidth * 0.65)}cm.`,
    );
    if (furnitureWidth < 70)
      notes.push(
        "On furniture this narrow, hang the clock centred on the furniture rather than on the wall — the eye reads the pair as one object, and an off-centre clock above a small console looks like a mistake.",
      );
    if (furnitureWidth >= 180)
      notes.push(
        "At this width a single clock can look lonely. A clock flanked by a pair of smaller pieces, or hung off-centre over one end with something else balancing the other, usually reads better.",
      );
  } else if (placement === "kitchen") {
    if (!cabinetGap || cabinetGap <= 0) return null;
    // The gap is the constraint. Leave roughly 10cm above and below the face
    // so it sits in the gap rather than filling it.
    min = round5(Math.max(15, cabinetGap - 25));
    max = round5(Math.max(20, cabinetGap - 12));
    notes.push(
      `Work from the cabinets rather than the floor. In a ${cabinetGap}cm gap the clock wants to sit centred, with roughly 10cm of clear space above and below the face.`,
    );
    if (cabinetGap < 35)
      notes.push(
        "This is a small gap. A clock much over 25cm will look wedged in, and a slim wall clock with a shallow case matters more here than the diameter does.",
      );
  } else {
    if (!wallWidth || wallWidth <= 0) return null;
    // A clock plus half a diameter each side must fit the run, so the largest
    // clock a run of W takes is W / 2.
    min = round5(wallWidth * 0.35);
    max = round5(wallWidth * 0.5);
    notes.push(
      `On a bare wall the run is the constraint. A clock needs about half its own diameter of clear wall on each side, so ${wallWidth}cm of usable wall takes a clock up to about ${round5(wallWidth * 0.5)}cm.`,
    );
    notes.push(
      "Measure the usable run — from a door architrave to the end of a shelf — rather than corner to corner. A large room with a short run is a small-clock room.",
    );
  }

  const idealDiameter = round5((min + max) / 2);
  const wallNeeded = round5(idealDiameter * (1 + BREATHING_SPACE * 2));

  let centreHeight: number;
  if (placement === "kitchen") {
    // Centred in the gap, and the gap sits above the cabinets, which top out
    // at around 210cm in a standard kitchen.
    centreHeight = round5(210 + (cabinetGap ?? 0) / 2);
    notes.push(
      `Assuming wall cabinets topping out at 210cm, that puts the centre of the face at about ${centreHeight}cm from the floor.`,
    );
  } else if (read) {
    centreHeight = FUNCTIONAL_CENTRE_CM.min;
    notes.push(
      `A clock you intend to read hangs higher than a picture — centre it between ${FUNCTIONAL_CENTRE_CM.min}cm and ${FUNCTIONAL_CENTRE_CM.max}cm from the floor, above furniture and sightlines.`,
    );
  } else {
    centreHeight = DECORATIVE_CENTRE_CM;
    notes.push(
      `A clock that is mainly decorative follows the gallery convention: centre at ${DECORATIVE_CENTRE_CM}cm, which is eye level for an adult standing in front of it and puts it in the same line as pictures on the same wall.`,
    );
  }

  return {
    diameterRange: { min, max },
    idealDiameter,
    wallNeeded,
    centreHeight,
    notes,
  };
}
