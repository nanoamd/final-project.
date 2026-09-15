/**
 * Whether a product fits a room the shopper has told us about.
 *
 * Every retailer answers "will it fit?" with a table of numbers and leaves the
 * customer to do the arithmetic against a tape measure. 896 of 907 products
 * here carry real dimensions, so the answer can be given directly instead.
 *
 * This matters commercially rather than just being a nice touch. Wrong size is
 * the commonest reason furniture is sent back, and a return costs Kaiku about
 * £700 on a £1,000 item — Premier charge a 50% restocking fee and will not
 * collect from a consumer. A shopper who is told "15cm too deep for your
 * alcove" before buying is a return that never happens.
 *
 * The rules are deliberately conservative. A verdict of "fits" that turns out
 * to be wrong costs far more than one that sends somebody back to their tape
 * measure, so anything marginal is reported as tight rather than fine.
 *
 * NOT YET CATEGORY-AWARE, and it needs to be before this goes on a page.
 * Running it across the catalogue shows the gap plainly: a gazebo is measured
 * against an indoor ceiling, and a wall clock is told it will not fit an
 * alcove it was never going to sit in. The floor-space and alcove checks only
 * make sense for floor-standing furniture, and the ceiling check only for
 * indoor pieces. Deciding which categories are which is a merchandising
 * judgement rather than a coding one, so it is left for Damien rather than
 * guessed at here.
 */

/** Centimetres. Depth is stored as `length` in Sanity. */
export interface ProductDimensions {
  width?: number | null;
  length?: number | null;
  height?: number | null;
  unit?: string | null;
}

/** What the shopper measured. Metres for the room, centimetres for an alcove. */
export interface Room {
  /** A name the shopper recognises — "Living room", "Ella's bedroom". */
  name: string;
  /** Room width in metres. */
  widthM?: number | null;
  /** Room length in metres. */
  lengthM?: number | null;
  /** Ceiling height in metres, for tall pieces and pendants. */
  heightM?: number | null;
  /** An optional narrower opening the piece must pass or sit in, in cm. */
  alcoveWidthCm?: number | null;
  /** How deep that alcove is, in cm. */
  alcoveDepthCm?: number | null;
}

export type FitVerdict =
  | "fits"
  | "tight"
  | "too-big"
  | "unknown"
  /** Too small for fit to be a question — the component renders nothing. */
  | "not-applicable";

export interface FitResult {
  verdict: FitVerdict;
  /** One plain sentence for the shopper. Never a measurement dump. */
  message: string;
  /** The specific check that produced the verdict, for the detail line. */
  reason?: string;
}

/**
 * The gap a person needs to walk past furniture without turning sideways.
 * Below this a room works but feels cramped, which is a "tight", not a "fits".
 */
const COMFORTABLE_WALKWAY_CM = 75;
/** Below this it is not a walkway, it is an obstacle. */
const MINIMUM_WALKWAY_CM = 60;
/** Clearance wanted at the top of an alcove or under a ceiling. */
const HEIGHT_CLEARANCE_CM = 5;

function cm(metres: number | null | undefined): number | null {
  return typeof metres === "number" && metres > 0 ? metres * 100 : null;
}

function round(value: number): number {
  return Math.round(value);
}

/**
 * Normalises a stored dimension to centimetres.
 *
 * Almost everything is recorded in cm, but a few products carry mm or m and a
 * silent unit mismatch would produce a confident, wrong answer — the one
 * outcome this feature cannot afford.
 */
function toCm(
  value: number | null | undefined,
  unit: string | null | undefined,
): number | null {
  if (typeof value !== "number" || value <= 0) return null;
  switch ((unit ?? "cm").toLowerCase()) {
    case "mm":
      return value / 10;
    case "m":
      return value * 100;
    case "cm":
      return value;
    default:
      // An unrecognised unit is not assumed to be centimetres.
      return null;
  }
}

/**
 * The widest horizontal measurement, which is what has to get through a gap
 * and what eats the floor. Depth is `length` in the stored shape.
 */
function footprint(d: ProductDimensions): {
  width: number | null;
  depth: number | null;
  height: number | null;
} {
  return {
    width: toCm(d.width, d.unit),
    depth: toCm(d.length, d.unit),
    height: toCm(d.height, d.unit),
  };
}

/**
 * Below this, fit is not a real question and saying so is noise.
 *
 * Running the check across the whole catalogue returned "fits" on 877 of 907
 * products, which makes the answer worthless — and "fits your living room,
 * leaving 250cm to walk past" on a candle holder is faintly ridiculous. A
 * shopper only wants this on pieces big enough to worry about.
 */
const WORTH_CHECKING_CM = 80;

function bigEnoughToMatter(
  width: number | null,
  depth: number | null,
  height: number | null,
): boolean {
  return [width, depth, height].some(
    (v) => v !== null && v >= WORTH_CHECKING_CM,
  );
}

export function fitsRoom(
  dimensions: ProductDimensions | null | undefined,
  room: Room | null | undefined,
): FitResult {
  if (!dimensions || !room) {
    return {
      verdict: "unknown",
      message: "Tell us your room and we will check this for you.",
    };
  }

  const { width, depth, height } = footprint(dimensions);

  // Order matters here. "No usable measurements" must be reported as unknown
  // before the size threshold runs, or a product recorded in an unrecognised
  // unit would silently be treated as small enough not to matter — a missing
  // answer disguised as a confident one.
  if (width === null && depth === null && height === null) {
    return {
      verdict: "unknown",
      message: "We do not have full measurements for this piece yet.",
    };
  }

  // Small things always fit. Saying so on every vase buries the eleven answers
  // that actually matter.
  if (!bigEnoughToMatter(width, depth, height)) {
    return { verdict: "not-applicable", message: "" };
  }

  const roomWidth = cm(room.widthM);
  const roomLength = cm(room.lengthM);
  const ceiling = cm(room.heightM);
  const where = room.name.trim() || "your room";

  // An alcove is the tightest constraint, so it is checked first and wins.
  if (typeof room.alcoveWidthCm === "number" && width !== null) {
    const spare = room.alcoveWidthCm - width;
    if (spare < 0)
      return {
        verdict: "too-big",
        message: `${round(-spare)}cm too wide for your alcove.`,
        reason: `${round(width)}cm wide against an alcove of ${round(room.alcoveWidthCm)}cm.`,
      };
    if (spare < 2)
      return {
        verdict: "tight",
        message: `Fits your alcove with ${round(spare)}cm to spare — measure twice.`,
        reason: `${round(width)}cm wide against an alcove of ${round(room.alcoveWidthCm)}cm.`,
      };
  }

  if (
    typeof room.alcoveDepthCm === "number" &&
    depth !== null &&
    depth > room.alcoveDepthCm
  ) {
    return {
      verdict: "too-big",
      message: `${round(depth - room.alcoveDepthCm)}cm too deep for your alcove.`,
      reason: `${round(depth)}cm deep against an alcove ${round(room.alcoveDepthCm)}cm deep.`,
    };
  }

  if (ceiling !== null && height !== null) {
    const spare = ceiling - height;
    if (spare < 0)
      return {
        verdict: "too-big",
        message: `Taller than your ceiling by ${round(-spare)}cm.`,
        reason: `${round(height)}cm tall under a ${round(ceiling)}cm ceiling.`,
      };
    if (spare < HEIGHT_CLEARANCE_CM)
      return {
        verdict: "tight",
        message:
          round(spare) === 0
            ? `Exactly the height of your ceiling — no clearance at all.`
            : `Only ${round(spare)}cm under your ceiling.`,
        reason: `${round(height)}cm tall under a ${round(ceiling)}cm ceiling.`,
      };
  }

  // Floor space. The piece sits along the shorter wall, so the walkway left is
  // measured across the longer one — the arrangement a room is usually given.
  if (
    roomWidth !== null &&
    roomLength !== null &&
    width !== null &&
    depth !== null
  ) {
    const shortWall = Math.min(roomWidth, roomLength);
    const longWall = Math.max(roomWidth, roomLength);

    if (width > longWall)
      return {
        verdict: "too-big",
        message: `Wider than ${where} by ${round(width - longWall)}cm.`,
        reason: `${round(width)}cm wide in a room ${round(longWall)}cm across.`,
      };

    const walkway = shortWall - depth;
    if (walkway < MINIMUM_WALKWAY_CM)
      return {
        verdict: "too-big",
        message: `Would leave only ${round(walkway)}cm to walk past.`,
        reason: `${round(depth)}cm deep in a room ${round(shortWall)}cm across.`,
      };
    if (walkway < COMFORTABLE_WALKWAY_CM)
      return {
        verdict: "tight",
        message: `Fits, but leaves ${round(walkway)}cm to walk past — tight.`,
        reason: `${round(depth)}cm deep in a room ${round(shortWall)}cm across.`,
      };
    return {
      verdict: "fits",
      message: `Fits ${where}, leaving ${round(walkway)}cm to walk past.`,
      reason: `${round(width)} x ${round(depth)}cm in a room ${round(longWall)} x ${round(shortWall)}cm.`,
    };
  }

  // Enough was checked to be useful, but not enough for a floor-space verdict.
  if (ceiling !== null && height !== null)
    return { verdict: "fits", message: `Fits under your ceiling.` };

  return {
    verdict: "unknown",
    message: "Add your room's width and length for a proper answer.",
  };
}
