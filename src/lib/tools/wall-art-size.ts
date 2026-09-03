/**
 * Wall art sizing, height, and gallery-wall spacing.
 *
 * The proportion is the same one this site already uses for mirrors and
 * wall clocks, because it is the same eye trick: a piece reads as belonging
 * to the furniture below it at roughly two-thirds of that furniture's
 * width. What's different about wall art is the gallery wall — several
 * pieces arranged as a group — and the rule there is not "size each piece,"
 * it's "size the whole arrangement as if it were one shape":
 *
 *   - The two-thirds proportion applies to a gallery wall's outer edges
 *     exactly as it applies to a single canvas. A cluster of five small
 *     prints that together span 65% of the sideboard below is correctly
 *     sized; judging each print on its own would say they're all too small.
 *   - Individual frames in a group usually sit 5-8cm apart — tight enough to
 *     read as one arrangement, loose enough that each piece still stands on
 *     its own.
 *   - Height follows the same convention as this site's mirror calculator:
 *     145cm to the centre on bare wall, or 20cm above the furniture below
 *     it, because the eye treats a picture and a mirror identically once
 *     it's on the wall.
 *
 * Pure arithmetic over the shopper's own measurements.
 */

export type WallArtPlacement = "furniture" | "wall";

/** Same gallery convention this site's mirror calculator uses. */
export const GALLERY_CENTRE_CM = 145;
/** Same furniture gap this site's mirror calculator uses. */
export const GAP_ABOVE_FURNITURE_CM = 20;
/** Usual spacing between frames in a grouped arrangement, in cm. */
export const GALLERY_FRAME_GAP_CM = { min: 5, max: 8 };

export interface WallArtSizeInput {
  placement: WallArtPlacement;
  /** Width of the console, sideboard or sofa it hangs over, in cm. */
  furnitureWidth?: number;
  /** Height of that furniture from the floor, in cm. */
  furnitureHeight?: number;
  /** Usable run of bare wall, in cm — for the "wall" placement. */
  wallWidth?: number;
  /** Whether this is several pieces arranged as one group, not a single piece. */
  isGallery?: boolean;
}

export interface WallArtSizeResult {
  /** The combined width the art (or the whole gallery grouping) should span. */
  widthRange: { min: number; max: number };
  idealWidth: number;
  bottomEdge?: number;
  notes: string[];
}

const round = (n: number) => Math.round(n);

export function wallArtSize(input: WallArtSizeInput): WallArtSizeResult | null {
  const {
    placement,
    furnitureWidth,
    furnitureHeight,
    wallWidth,
    isGallery = false,
  } = input;

  let widthRange: { min: number; max: number };
  const notes: string[] = [];

  if (placement === "furniture") {
    if (!furnitureWidth || furnitureWidth <= 0) return null;
    widthRange = {
      min: round(furnitureWidth * 0.6),
      max: round(furnitureWidth * 0.75),
    };
    notes.push(
      `Two-thirds of the furniture below is the target — on ${furnitureWidth}cm that's about ${round(furnitureWidth * 0.67)}cm${isGallery ? " for the whole arrangement, outer edge to outer edge" : ""}.`,
    );
  } else {
    if (!wallWidth || wallWidth <= 0) return null;
    widthRange = { min: round(wallWidth * 0.5), max: round(wallWidth * 0.75) };
    notes.push(
      `On bare wall, aim for 50-75% of the usable run — measured architrave to corner, not wall to wall — so ${wallWidth}cm of run takes art up to about ${round(wallWidth * 0.65)}cm wide${isGallery ? ", again as the whole arrangement's outer footprint" : ""}.`,
    );
  }

  const idealWidth = round((widthRange.min + widthRange.max) / 2);

  if (isGallery) {
    notes.push(
      `Size the arrangement as one shape rather than each piece on its own — a cluster of small prints spanning the right proportion is correctly sized even though any single print in it looks too small alone.`,
    );
    notes.push(
      `Space individual frames ${GALLERY_FRAME_GAP_CM.min}-${GALLERY_FRAME_GAP_CM.max}cm apart — tight enough to read as one group, loose enough that each piece still stands on its own.`,
    );
  }

  let bottomEdge: number | undefined;
  if (placement === "furniture" && furnitureHeight && furnitureHeight > 0) {
    bottomEdge = furnitureHeight + GAP_ABOVE_FURNITURE_CM;
    notes.push(
      `Leave ${GAP_ABOVE_FURNITURE_CM}cm between the top of the furniture and the bottom of the frame${isGallery ? " (the lowest frame in the group)" : ""}, which puts that edge around ${bottomEdge}cm from the floor.`,
    );
  } else {
    notes.push(
      `With nothing beneath it, centre the arrangement at ${GALLERY_CENTRE_CM}cm from the floor — the gallery convention, and eye level for an adult standing in front of it.`,
    );
  }

  return { widthRange, idealWidth, bottomEdge, notes };
}
