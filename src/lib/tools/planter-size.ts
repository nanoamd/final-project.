/**
 * Planter sizing: how big a pot a plant needs, and how much compost fills it.
 *
 * The two things people get wrong are both practical rather than aesthetic:
 *
 *   - Pot size. A plant wants a pot two to four centimetres wider than its
 *     current root ball for a small houseplant, and five to ten for anything
 *     larger. Over-potting is a real failure mode: too much wet compost around
 *     a small root system stays wet, and the roots rot.
 *   - Compost volume. People buy one bag and find it fills a third of the pot.
 *     A cylinder's volume in litres is pi x r squared x height, divided by a
 *     thousand, and pots are sold by diameter, so the arithmetic catches
 *     almost everyone out.
 *
 * Volume is calculated for a cylinder and then reduced, because a planter
 * tapers towards the base and because compost should stop short of the rim.
 */

/** Compost sits below the rim so watering does not wash over the top. */
export const HEADSPACE_CM = 3;
/** A tapered pot holds less than a true cylinder of the same mouth diameter. */
export const TAPER_FACTOR = 0.8;

export interface PlanterInput {
  /** Internal diameter at the mouth, in cm. */
  diameter?: number;
  /** Internal depth, in cm. */
  depth?: number;
  /** Diameter of the plant's current root ball or nursery pot, in cm. */
  rootBall?: number;
  /** Whether it will stand outside, which changes the drainage advice. */
  outdoors?: boolean;
}

export interface PlanterResult {
  /** Compost needed, in litres. */
  litres?: number;
  /** The pot diameter this plant wants, in cm. */
  recommendedDiameter?: { min: number; max: number };
  notes: string[];
}

export function planterSize(input: PlanterInput): PlanterResult | null {
  const { diameter, depth, rootBall, outdoors } = input;
  if (!diameter && !rootBall) return null;

  const notes: string[] = [];
  let litres: number | undefined;
  let recommendedDiameter: PlanterResult["recommendedDiameter"];

  if (rootBall && rootBall > 0) {
    // Small root balls want a small step up; larger ones can take more.
    const step = rootBall < 15 ? { min: 2, max: 4 } : { min: 5, max: 10 };
    recommendedDiameter = {
      min: rootBall + step.min,
      max: rootBall + step.max,
    };
    notes.push(
      `Step up by ${step.min}-${step.max}cm rather than moving straight to a large pot. Too much wet compost around a small root system stays wet, and that is what kills a plant that has just been repotted.`,
    );
  }

  if (diameter && diameter > 0 && depth && depth > 0) {
    const usableDepth = Math.max(depth - HEADSPACE_CM, 0);
    const radius = diameter / 2;
    const cylinder = Math.PI * radius * radius * usableDepth;
    litres = Math.round((cylinder * TAPER_FACTOR) / 1000);
    notes.push(
      `That allows ${HEADSPACE_CM}cm of clear rim so watering does not wash compost over the edge, and assumes the pot tapers towards its base as most do.`,
    );
    if (litres >= 40)
      notes.push(
        "At this size, fill the bottom third with something lighter than compost — broken polystyrene or upturned pots — unless you are planting something deep-rooted. It saves compost and makes the planter movable.",
      );
  }

  if (recommendedDiameter && diameter && diameter > recommendedDiameter.max + 5)
    notes.push(
      `This pot is considerably wider than the plant needs. It will work if you are planting a group, but for a single plant of that size it risks staying wet.`,
    );

  notes.push(
    outdoors
      ? "Outdoors, drainage holes are not optional — a pot without them fills with rain and drowns the roots over winter. Stand it on feet or a couple of tiles so the holes cannot seal against the paving."
      : "Indoors, either use a pot with drainage and a saucer, or treat a sealed planter as a cover pot and keep the plant in its nursery pot inside it so it can be lifted out to water.",
  );

  return { litres, recommendedDiameter, notes };
}
