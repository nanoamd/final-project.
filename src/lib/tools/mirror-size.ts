/**
 * Mirror sizing over a piece of furniture, and hanging height.
 *
 * The two questions people actually search are "what size mirror above a
 * console table" and "how high should a mirror be". Both have settled answers
 * that interior designers use, and neither is guesswork:
 *
 *   - A mirror over furniture reads as belonging to it at roughly two-thirds
 *     of the furniture's width. Narrower and it looks stranded; wider and it
 *     overhangs, which reads as a mistake rather than a choice.
 *   - A centre height of 145cm above the floor is the gallery convention,
 *     putting the middle of the mirror at the eye level of an average adult.
 *   - Over furniture, the gap between the furniture top and the mirror bottom
 *     wants to be 15-25cm. Less and they merge; more and the mirror floats
 *     away from the thing it is meant to sit with.
 *
 * Pure arithmetic over the shopper's own measurements, so it is unit-testable
 * and cannot drift from whatever the catalogue happens to hold.
 */

/** The gallery convention: centre of the piece 145cm from the floor. */
export const GALLERY_CENTRE_CM = 145;
/** The gap that reads as deliberate between furniture and the piece above it. */
export const GAP_ABOVE_FURNITURE_CM = 20;

export interface MirrorSizeInput {
  /** Width of the console, sideboard or fireplace it hangs over, in cm. */
  furnitureWidth?: number;
  /** Height of that furniture from the floor, in cm. */
  furnitureHeight?: number;
  /** Height of the mirror itself, in cm, where the shopper has one in mind. */
  mirrorHeight?: number;
}

export interface MirrorSizeResult {
  widthRange: { min: number; max: number };
  idealWidth: number;
  bottomEdge?: number;
  topEdge?: number;
  notes: string[];
}

const round = (n: number) => Math.round(n);

export function mirrorSize(input: MirrorSizeInput): MirrorSizeResult | null {
  const { furnitureWidth, furnitureHeight, mirrorHeight } = input;
  if (!furnitureWidth || furnitureWidth <= 0) return null;

  const widthRange = {
    min: round(furnitureWidth * 0.6),
    max: round(furnitureWidth * 0.75),
  };
  const idealWidth = round(furnitureWidth * 0.7);
  const notes: string[] = [];

  let bottomEdge: number | undefined;
  if (furnitureHeight && furnitureHeight > 0) {
    bottomEdge = furnitureHeight + GAP_ABOVE_FURNITURE_CM;
    notes.push(
      `Leave about ${GAP_ABOVE_FURNITURE_CM}cm between the top of the furniture and the bottom of the mirror, which puts the bottom edge around ${bottomEdge}cm from the floor.`,
    );
  }

  let topEdge: number | undefined;
  if (mirrorHeight && mirrorHeight > 0) {
    if (bottomEdge) {
      topEdge = round(bottomEdge + mirrorHeight);
      notes.push(
        `The top edge then lands at ${topEdge}cm. Measure from the mirror's hanging point to its top edge and subtract that to find where the fixing goes.`,
      );
    } else {
      topEdge = round(GALLERY_CENTRE_CM + mirrorHeight / 2);
      notes.push(
        `With nothing beneath it, hang the centre at ${GALLERY_CENTRE_CM}cm — the gallery convention — which puts the top edge at ${topEdge}cm.`,
      );
    }
  }

  if (furnitureWidth < 60)
    notes.push(
      "On furniture this narrow, a round mirror often works better than a rectangular one, because it does not draw attention to the width.",
    );
  if (furnitureWidth >= 180)
    notes.push(
      "At this width, two matching mirrors, or one mirror flanked by a pair of wall lights, can read better than a single very wide piece.",
    );

  return { widthRange, idealWidth, bottomEdge, topEdge, notes };
}
