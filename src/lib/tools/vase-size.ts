/**
 * Vase sizing: what to buy for a vase you own, or what vase to buy for stems
 * you have.
 *
 * Two numbers do almost all the work, and only one of them gets quoted:
 *
 *   - Height. A vase should be about half to two-thirds the height of the
 *     finished arrangement. Shorter and it is top-heavy — a wide bunch in a
 *     short vase genuinely tips. Taller and the flowers disappear into it.
 *   - The neck. A narrow neck holds the stems upright for you and looks full
 *     with five. A wide mouth lets them fall outwards and needs fifteen to
 *     twenty before it stops reading as sparse. This is the difference
 *     between a bunch that works at home and one that collapses on the table,
 *     and nobody mentions it.
 *
 * Stems are bought longer than the arrangement stands, because a length of
 * every stem sits below the waterline. The multiplier here allows for that.
 *
 * Pure arithmetic over the shopper's own measurements.
 */

/** The florists' ratio: vase height as a fraction of the finished height. */
export const VASE_RATIO = { min: 0.5, max: 0.667 };

export type VaseNeck = "narrow" | "medium" | "wide";

export interface VaseSizeInput {
  /** Height of the vase, in cm. */
  vaseHeight?: number;
  /** Height of the stems as bought, in cm, where the shopper has flowers already. */
  stemLength?: number;
  neck: VaseNeck;
}

export interface VaseSizeResult {
  /** How tall the finished arrangement will stand above the surface, in cm. */
  arrangementHeight: { min: number; max: number };
  /** The length of stem to buy, in cm. */
  stemsToBuy: { min: number; max: number };
  /** How many stems it takes to look full. */
  stemCount: { min: number; max: number };
  /** Where a vase for the shopper's existing stems should land, in cm. */
  suggestedVaseHeight?: { min: number; max: number };
  notes: string[];
}

const round = (n: number) => Math.round(n);

const STEM_COUNTS: Record<VaseNeck, { min: number; max: number }> = {
  narrow: { min: 3, max: 7 },
  medium: { min: 7, max: 12 },
  wide: { min: 15, max: 20 },
};

const NECK_NOTES: Record<VaseNeck, string> = {
  narrow:
    "A narrow neck holds the stems upright for you, which makes it much the most forgiving shape. Three or five stems read as considered rather than sparse, so a supermarket bunch goes further in one of these than in anything else.",
  medium:
    "A medium neck needs enough stems that they lean on each other but not so many that they crowd. This is the shape a single florist's bunch is sold to fit.",
  wide: "A wide mouth lets the stems fall outwards, so they have to support each other. Filling one properly takes two or three supermarket bunches, and half-filled it reads as sparse rather than minimal.",
};

export function vaseSize(input: VaseSizeInput): VaseSizeResult | null {
  const { vaseHeight, stemLength, neck } = input;
  if (!vaseHeight || vaseHeight <= 0) {
    // With no vase, the shopper has stems and wants to know what to put them in.
    if (!stemLength || stemLength <= 0) return null;
    const arrangement = {
      min: round(stemLength * 0.75),
      max: round(stemLength * 0.9),
    };
    return {
      arrangementHeight: arrangement,
      stemsToBuy: { min: stemLength, max: stemLength },
      stemCount: STEM_COUNTS[neck],
      suggestedVaseHeight: {
        min: round(arrangement.min * VASE_RATIO.min),
        max: round(arrangement.max * VASE_RATIO.max),
      },
      notes: [
        `Stems of ${stemLength}cm stand roughly ${arrangement.min}–${arrangement.max}cm above the surface once they are cut and in water, so the vase wants to be about half to two-thirds of that.`,
        NECK_NOTES[neck],
      ],
    };
  }

  const arrangementHeight = {
    min: round(vaseHeight / VASE_RATIO.max),
    max: round(vaseHeight / VASE_RATIO.min),
  };
  // Allow for the length that sits below the waterline.
  const stemsToBuy = {
    min: round(vaseHeight * 1.7),
    max: round(vaseHeight * 2.2),
  };
  const notes: string[] = [
    `A ${vaseHeight}cm vase carries an arrangement standing ${arrangementHeight.min}–${arrangementHeight.max}cm above the surface, which means buying stems at ${stemsToBuy.min}–${stemsToBuy.max}cm once you allow for what sits below the waterline.`,
    NECK_NOTES[neck],
  ];

  if (vaseHeight >= 30)
    notes.push(
      "Anything from 30cm up is too tall for a dining table, because people have to see over it. Put it on a console, a hall table or a mantelpiece instead, and use low bowls down the length of a dining table.",
    );
  if (vaseHeight >= 45)
    notes.push(
      "At this height, branches last far better than cut flowers and cost less over a season — pussy willow, eucalyptus, blossom in spring.",
    );
  if (vaseHeight <= 20)
    notes.push(
      "This is a dining table and worktop height, and the position where a single short-cut supermarket bunch looks best. Check it is watertight before it goes on wood.",
    );

  if (stemLength && stemLength > 0) {
    if (stemLength < stemsToBuy.min)
      notes.push(
        `Stems of ${stemLength}cm are short for this vase — the flowers will sit low in it and read as sunken. Either cut them shorter still and use something around ${round(stemLength * 0.55)}cm tall, or add foliage to build the arrangement up.`,
      );
    else if (stemLength > stemsToBuy.max)
      notes.push(
        `Stems of ${stemLength}cm are long for this vase and will look top-heavy. Cut them to about ${stemsToBuy.max}cm, or move them to a vase of roughly ${round(stemLength * 0.55)}cm.`,
      );
    else
      notes.push(
        `Stems of ${stemLength}cm are a good match for this vase — that lands inside the ${stemsToBuy.min}–${stemsToBuy.max}cm range.`,
      );
  }

  return {
    arrangementHeight,
    stemsToBuy,
    stemCount: STEM_COUNTS[neck],
    notes,
  };
}
