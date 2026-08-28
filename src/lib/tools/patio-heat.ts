/**
 * Outdoor heat output: how much you need, and what a rating actually buys.
 *
 * Patio heaters and gas fire pits are sold in two units that do not compare
 * cleanly — kW and BTU/hr — and the numbers are large enough to sound
 * interchangeable when they are not. 1kW is 3,412 BTU/hr, so a "50,000 BTU"
 * fire pit is a 14.6kW appliance and a "2.1kW" electric heater is 7,200 BTU.
 *
 * The honest guidance is narrow, and it is deliberately stated that way here:
 *
 *   - Outdoor heat does not warm air, it warms what it lands on. Coverage is
 *     therefore about line of sight and distance, not about volume.
 *   - Wind is the dominant variable and no rating survives it. A sheltered
 *     corner does more for comfort than doubling the output.
 *   - Gas gives more heat per pound spent; electric is cheaper to install,
 *     silent, and can go under cover where gas cannot.
 *
 * The area figures below are the manufacturers' own convention — roughly 1kW
 * per 2.5 square metres of patio in still, mild conditions — and are presented
 * as a starting point rather than a specification, because the honest answer
 * depends on wind more than on wattage.
 */

export const BTU_PER_KW = 3412;
/** Square metres one kW covers in still, mild conditions. */
export const SQM_PER_KW = 2.5;

export const kwToBtu = (kw: number) => Math.round(kw * BTU_PER_KW);
export const btuToKw = (btu: number) =>
  Math.round((btu / BTU_PER_KW) * 10) / 10;

export interface PatioHeatInput {
  /** Seating area to warm, in square metres. */
  areaSqm?: number;
  /** How exposed the spot is. Wind matters more than output. */
  shelter?: "sheltered" | "partly" | "exposed";
  /** A rating the shopper is looking at, to convert and sanity-check. */
  rating?: { value: number; unit: "kw" | "btu" };
}

export interface PatioHeatResult {
  /** Output needed, in kW and BTU. */
  needed?: { kw: number; btu: number };
  /** A rating the shopper gave, converted both ways. */
  converted?: { kw: number; btu: number };
  /** Whether their rating covers their area. */
  verdict?: "enough" | "marginal" | "short";
  notes: string[];
}

const SHELTER_FACTOR = { sheltered: 1, partly: 1.3, exposed: 1.8 } as const;

export function patioHeat(input: PatioHeatInput): PatioHeatResult | null {
  const { areaSqm, shelter = "partly", rating } = input;
  if ((!areaSqm || areaSqm <= 0) && !rating) return null;

  const notes: string[] = [];
  let needed: PatioHeatResult["needed"];

  if (areaSqm && areaSqm > 0) {
    const kw =
      Math.round((areaSqm / SQM_PER_KW) * SHELTER_FACTOR[shelter] * 10) / 10;
    needed = { kw, btu: kwToBtu(kw) };
    if (shelter === "exposed")
      notes.push(
        "An exposed spot is the hardest thing to heat, and no rating fully solves it. A screen or a hedge on the windward side will do more for comfort than a larger appliance.",
      );
    if (shelter === "sheltered")
      notes.push(
        "A sheltered corner is doing a lot of the work for you, which is why the figure is lower than you might expect.",
      );
  }

  let converted: PatioHeatResult["converted"];
  let verdict: PatioHeatResult["verdict"];
  if (rating && rating.value > 0) {
    converted =
      rating.unit === "kw"
        ? { kw: rating.value, btu: kwToBtu(rating.value) }
        : { kw: btuToKw(rating.value), btu: Math.round(rating.value) };
    notes.push(
      `${converted.kw}kW and ${converted.btu.toLocaleString()} BTU/hr are the same number in different units — worth knowing when comparing a gas fire pit against an electric heater.`,
    );
    if (needed) {
      const ratio = converted.kw / needed.kw;
      verdict = ratio >= 1 ? "enough" : ratio >= 0.75 ? "marginal" : "short";
    }
  }

  notes.push(
    "Outdoor heaters warm what they shine on rather than warming the air, so the useful question is whether everyone sitting down is in line of sight of it. Two smaller units placed either side of a seating area will almost always beat one large one in a corner.",
  );

  return { needed, converted, verdict, notes };
}
