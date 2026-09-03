/**
 * TV size, viewing distance, and the media unit under it.
 *
 * Two different questions get asked as one: "what size TV fits my room" is
 * about the seat, "what size TV unit do I need" is about a screen you may
 * already own. Both have real numbers behind them, and they are not the
 * same numbers a lot of retail copy implies.
 *
 *   - THX's cinema-immersion guideline is distance(ft) = diagonal(in) / 10 —
 *     converted to cm, that is roughly diagonal(in) x 3.05. It is a genuine
 *     industry figure, but it is closer than most living rooms actually
 *     sit, because it is tuned for the sensation of a cinema screen filling
 *     your field of view, not for comfortable everyday TV.
 *   - The everyday range most retailers actually use is 1.5-2x the
 *     diagonal, measured in the same unit as the diagonal — so a 55in
 *     (140cm) TV wants 210-280cm of viewing distance, not the 170cm THX
 *     would recommend.
 *   - A TV's screen width is not its diagonal. A 65in TV is a 65in
 *     corner-to-corner measurement on a 16:9 panel that is only about
 *     144cm wide — the number that actually matters for the unit under it.
 *   - The unit should be at least as wide as the screen, and ideally
 *     5-20cm wider in total so the TV doesn't overhang the ends.
 *
 * Pure arithmetic, so it can be dropped into a guide as a widget rather than
 * asking the reader to do the conversion by hand.
 */

/** 16:9 panel: width is this fraction of the diagonal. */
const WIDTH_FRACTION_OF_DIAGONAL = 16 / Math.sqrt(16 * 16 + 9 * 9);

const IN_TO_CM = 2.54;

/** THX's cinema-immersion figure: distance(ft) = diagonal(in) / 10. */
const IMMERSIVE_CM_PER_INCH = 3.048;

/** The everyday range retailers use: distance = 1.5x-2x the diagonal, same unit. */
const EVERYDAY_MULTIPLIER = { min: 1.5, max: 2 };

/** How much wider than the screen a unit wants to be, in total, in cm. */
const UNIT_OVERHANG_CM = { min: 5, max: 20 };

export interface TvUnitSizeInput {
  /** Seating distance from where the screen will hang or sit, in cm. */
  viewingDistanceCm?: number;
  /** The TV's own diagonal, in inches — either owned already or being considered. */
  tvDiagonalIn?: number;
}

export interface TvUnitSizeResult {
  /** What the seating distance suggests, if given. */
  recommendedDiagonal: {
    immersiveIn: number;
    everydayMinIn: number;
    everydayMaxIn: number;
  } | null;
  /** What a given TV needs from the unit under it, if given. */
  unit: {
    screenWidthCm: number;
    unitWidthMinCm: number;
    unitWidthMaxCm: number;
  } | null;
  /** Whether a given TV and a given distance actually suit each other. */
  distanceCheck: {
    tooClose: boolean;
    tooFar: boolean;
    everydayMinCm: number;
    everydayMaxCm: number;
  } | null;
  notes: string[];
}

const round = (n: number) => Math.round(n);

export function tvUnitSize(input: TvUnitSizeInput): TvUnitSizeResult | null {
  const { viewingDistanceCm, tvDiagonalIn } = input;
  if (
    (!viewingDistanceCm || viewingDistanceCm <= 0) &&
    (!tvDiagonalIn || tvDiagonalIn <= 0)
  )
    return null;

  const notes: string[] = [];

  const recommendedDiagonal =
    viewingDistanceCm && viewingDistanceCm > 0
      ? {
          immersiveIn: round(viewingDistanceCm / IMMERSIVE_CM_PER_INCH),
          everydayMinIn: round(
            viewingDistanceCm / EVERYDAY_MULTIPLIER.max / IN_TO_CM,
          ),
          everydayMaxIn: round(
            viewingDistanceCm / EVERYDAY_MULTIPLIER.min / IN_TO_CM,
          ),
        }
      : null;

  if (recommendedDiagonal) {
    notes.push(
      `For everyday viewing at ${viewingDistanceCm}cm, that's a ${recommendedDiagonal.everydayMinIn}-${recommendedDiagonal.everydayMaxIn}in TV. THX's cinema-immersion figure would put you at ${recommendedDiagonal.immersiveIn}in, which is bigger than most living rooms actually want.`,
    );
  }

  const unit =
    tvDiagonalIn && tvDiagonalIn > 0
      ? (() => {
          const screenWidthCm =
            tvDiagonalIn * IN_TO_CM * WIDTH_FRACTION_OF_DIAGONAL;
          return {
            screenWidthCm: round(screenWidthCm),
            unitWidthMinCm: round(screenWidthCm + UNIT_OVERHANG_CM.min),
            unitWidthMaxCm: round(screenWidthCm + UNIT_OVERHANG_CM.max),
          };
        })()
      : null;

  if (unit) {
    notes.push(
      `A ${tvDiagonalIn}in TV is about ${unit.screenWidthCm}cm wide — not ${round(tvDiagonalIn! * IN_TO_CM)}cm, which is the diagonal. The unit under it wants to be ${unit.unitWidthMinCm}-${unit.unitWidthMaxCm}cm wide, so the screen doesn't overhang the ends.`,
    );
  }

  const distanceCheck =
    unit && viewingDistanceCm && viewingDistanceCm > 0
      ? (() => {
          const diagonalCm = tvDiagonalIn! * IN_TO_CM;
          const everydayMinCm = diagonalCm * EVERYDAY_MULTIPLIER.min;
          const everydayMaxCm = diagonalCm * EVERYDAY_MULTIPLIER.max;
          return {
            tooClose: viewingDistanceCm < everydayMinCm,
            tooFar: viewingDistanceCm > everydayMaxCm,
            everydayMinCm: round(everydayMinCm),
            everydayMaxCm: round(everydayMaxCm),
          };
        })()
      : null;

  if (distanceCheck) {
    if (distanceCheck.tooClose)
      notes.push(
        `At ${viewingDistanceCm}cm, this TV sits closer than the ${distanceCheck.everydayMinCm}-${distanceCheck.everydayMaxCm}cm everyday range for its size — comfortable for a film night, tiring for a full evening.`,
      );
    else if (distanceCheck.tooFar)
      notes.push(
        `At ${viewingDistanceCm}cm, this TV sits further than the ${distanceCheck.everydayMinCm}-${distanceCheck.everydayMaxCm}cm everyday range for its size — a bigger screen would use the room better.`,
      );
    else
      notes.push(
        `At ${viewingDistanceCm}cm, this TV sits right in the ${distanceCheck.everydayMinCm}-${distanceCheck.everydayMaxCm}cm everyday range for its size.`,
      );
  }

  notes.push(
    "Height follows the same rule whether the TV is wall-mounted or on a unit: centre the screen roughly 100-110cm from the floor, measured to the middle of the panel, for eye level on a typical sofa.",
  );

  return { recommendedDiagonal, unit, distanceCheck, notes };
}
