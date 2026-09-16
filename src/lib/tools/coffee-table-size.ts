/**
 * Coffee table sizing, from the sofa and the floor it has to sit on.
 *
 * This is the one topic with more real UK search demand than everything else
 * on the site combined — 25 of the 47 genuine UK impressions a month, and the
 * site had no tool for it. The working is in `docs/uk-keyword-targets.md`.
 *
 * The four numbers people search for have settled answers:
 *
 *   - Length is about two-thirds of the sofa. Half to three-quarters all read
 *     as deliberate; below half the table looks lost, above three-quarters it
 *     starts to crowd the seat ends.
 *   - Height is level with the sofa seat, or up to 5cm below it. Above the
 *     seat is the one genuine mistake — you end up reaching up for a mug.
 *   - The gap between sofa and table is 35 to 45cm: close enough to put a
 *     drink down without standing, far enough to get past and to sit forward.
 *   - Behind the table there has to be somewhere to walk. 75cm is comfortable
 *     for a main route through a room; 45cm is the least that works at all.
 *
 * The last of those is why this is a calculator and not another blog post. The
 * pages currently ranking for "coffee table size guide" all quote two-thirds
 * of the sofa and stop there, which gives you a table that is the right shape
 * and does not fit the room. Given the depth of floor the shopper actually has,
 * this caps the table depth at what will physically go in.
 *
 * Pure arithmetic over the shopper's own measurements — unit-testable, and it
 * cannot drift from whatever the catalogue happens to hold.
 */

/** Sofa front to table edge. The middle of the 35-45cm range people can live with. */
export const SOFA_GAP_CM = 40;
/** Squeeze-past width behind the table. Below this the route stops working. */
export const WALKWAY_MIN_CM = 45;
/** Walk-past width for a main route through the room. */
export const WALKWAY_COMFORTABLE_CM = 75;
/** Standard coffee table height where the sofa's seat height is unknown. */
export const DEFAULT_HEIGHT_CM = 42;

export interface CoffeeTableSizeInput {
  /** Length of the sofa it sits in front of, arm to arm, in cm. */
  sofaLength?: number;
  /** Floor to the top of the sofa's seat cushion, in cm. */
  sofaSeatHeight?: number;
  /**
   * Clear floor from the front of the sofa to whatever is opposite — a TV
   * unit, a wall, the edge of the rug's walking route — in cm.
   */
  floorDepth?: number;
}

export interface CoffeeTableSizeResult {
  lengthRange: { min: number; max: number };
  idealLength: number;
  depthRange: { min: number; max: number };
  idealDepth: number;
  heightRange: { min: number; max: number };
  idealHeight: number;
  /** Set when a floor depth was given: the deepest table that still leaves a route. */
  maxDepthForRoom?: number;
  /** True when the floor cannot take a standard table with a walkway behind it. */
  tooTight?: boolean;
  notes: string[];
}

const round = (n: number) => Math.round(n);
const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

export function coffeeTableSize(
  input: CoffeeTableSizeInput,
): CoffeeTableSizeResult | null {
  const { sofaLength, sofaSeatHeight, floorDepth } = input;
  if (!sofaLength || sofaLength <= 0) return null;

  const lengthRange = {
    min: round(sofaLength * 0.5),
    max: round(sofaLength * 0.75),
  };
  const idealLength = round((sofaLength * 2) / 3);

  // Depth follows length rather than being a fixed number: a 70cm table wants
  // a different depth from a 140cm one, and a table much squarer or much
  // narrower than half its length looks wrong at either extreme.
  const idealDepth = clamp(round(idealLength * 0.5), 42, 70);
  const depthRange = {
    min: clamp(round(idealLength * 0.42), 40, 65),
    max: clamp(round(idealLength * 0.6), 45, 80),
  };

  // Level with the seat, or a little under. Never above it.
  const idealHeight =
    sofaSeatHeight && sofaSeatHeight > 0
      ? round(sofaSeatHeight)
      : DEFAULT_HEIGHT_CM;
  const heightRange =
    sofaSeatHeight && sofaSeatHeight > 0
      ? { min: round(sofaSeatHeight - 5), max: round(sofaSeatHeight) }
      : { min: 40, max: 45 };

  const notes: string[] = [];

  if (sofaSeatHeight && sofaSeatHeight > 0) {
    notes.push(
      `Match the sofa's seat height at ${idealHeight}cm, or go up to 5cm under it. A table taller than the seat is the one sizing mistake you feel every day — you end up reaching up for a mug rather than down.`,
    );
  }

  let maxDepthForRoom: number | undefined;
  let tooTight: boolean | undefined;

  if (floorDepth && floorDepth > 0) {
    maxDepthForRoom = round(floorDepth - SOFA_GAP_CM - WALKWAY_MIN_CM);
    const comfortableDepth = round(
      floorDepth - SOFA_GAP_CM - WALKWAY_COMFORTABLE_CM,
    );

    if (maxDepthForRoom < depthRange.min) {
      tooTight = true;
      notes.push(
        `Your ${floorDepth}cm of floor will not take a table this size. After the ${SOFA_GAP_CM}cm in front of the sofa and ${WALKWAY_MIN_CM}cm to get past behind it, there is only ${Math.max(maxDepthForRoom, 0)}cm of table depth left. A round table, a nest of two, or a pair of side tables instead of one coffee table are the three ways round this.`,
      );
    } else if (maxDepthForRoom < depthRange.max) {
      notes.push(
        `Cap the depth at ${maxDepthForRoom}cm. That is what your ${floorDepth}cm of floor leaves once the ${SOFA_GAP_CM}cm gap in front of the sofa and a ${WALKWAY_MIN_CM}cm route behind the table are taken out — the length can still be the full ${idealLength}cm.`,
      );
    } else if (comfortableDepth >= depthRange.max) {
      notes.push(
        `The floor takes this comfortably: at ${floorDepth}cm you keep the ${SOFA_GAP_CM}cm gap in front of the sofa and still have ${WALKWAY_COMFORTABLE_CM}cm or more to walk past behind the table.`,
      );
    } else {
      notes.push(
        `This fits, but the route behind the table will be a squeeze rather than a walkway — ${round(floorDepth - SOFA_GAP_CM - idealDepth)}cm. If that side of the room is how people cross it, take the depth down to ${Math.max(comfortableDepth, depthRange.min)}cm.`,
      );
    }
  }

  if (sofaLength < 140) {
    notes.push(
      "On a two-seater this size, a round table often works better than a rectangular one: it gives you the same surface without a corner to catch a shin on in a room this tight.",
    );
  }
  if (sofaLength >= 240) {
    notes.push(
      "In front of a sofa this long, two smaller tables side by side usually read better than one very long piece — and they can be pulled apart when you need the floor.",
    );
  }

  notes.push(
    `Leave ${SOFA_GAP_CM}cm between the front of the sofa and the edge of the table. Anything under 35cm and you cannot get past; over 45cm and you have to stand up to reach your drink.`,
  );

  return {
    lengthRange,
    idealLength,
    depthRange,
    idealDepth,
    heightRange,
    idealHeight,
    maxDepthForRoom,
    tooTight,
    notes,
  };
}
