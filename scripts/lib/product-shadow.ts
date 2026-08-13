/**
 * Makes a plain-backdrop product photograph look like the same photograph as the
 * one next to it: one white, and a shadow on the floor.
 *
 * **What the inconsistency actually is.** Looking at twelve first-gallery images
 * side by side, the catalogue has four different looks in it:
 *
 *   1. pure white, with a soft floor shadow — the reclaimed teak dining table,
 *      the beer barrel. This is the look worth having everywhere.
 *   2. pure white, no shadow at all — the storage crates, the Neatham end table,
 *      the Camden side table. The object floats with nothing under it.
 *   3. a warm or cool grey sweep instead of white — the Broadway bedside table
 *      sits on about #f0efec, the gesso lamp on a light warm grey. Against a
 *      white card next to a white one, that reads as a dirty image rather than a
 *      design decision.
 *   4. photographed in a room — the Zephra armchair, the Serene rattan table.
 *
 * Only 2 and 3 are fixable by processing. A room photograph is not a pack shot
 * and must never be treated as one; it is the hover image, and it earns its place
 * by showing scale and styling.
 *
 * **Two operations, in this order.**
 *
 * *White point.* The backdrop's own colour is measured, and the image is scaled
 * per channel so that backdrop becomes white. It is a global scale, which is what
 * a retoucher does — correcting only the backdrop would leave a seam wherever the
 * product is a similar tone. The gain is capped hard (see MAX_GAIN): the job is to
 * take a paper tint off a sweep, not to rescue an underexposed photograph, and a
 * large gain means the backdrop measurement is wrong rather than the exposure.
 *
 * *Contact shadow.* Synthesised from the object's own silhouette. Two things
 * decide how dark the shadow is under a given column of the image:
 *
 *   - **contact**: how close that column's lowest pixel is to the floor line. A
 *     table leg reaches the floor, so it grounds hard. The span of a tabletop
 *     between two legs has its lowest pixel a long way up, so it only hazes.
 *   - **occupancy**: how much of that column is object at all, so a solid chest
 *     of drawers grounds more heavily than a wire leg.
 *
 * That combination is what makes a squashed silhouette read as a shadow rather
 * than a grey smear: a four-legged table gets four dark feet and a light haze
 * between them, which is what the reference photograph the whole exercise is
 * modelled on actually looks like.
 *
 * **The product's own pixels are never touched by the shadow.** The shadow layer
 * is multiplied by the inverse of the subject mask before it is applied, so it
 * stops at the silhouette. That is both physically right — the object occludes
 * its own shadow — and the reason this is safe to run on a £1,190 chest of
 * drawers: a segmentation error can lighten or darken backdrop, and cannot smear
 * grey across the product.
 *
 * **What it refuses to touch.**
 *
 *   - anything without a plain backdrop (a room photograph)
 *   - anything that already has a shadow, since a second one would be a double
 *     light source and instantly wrong
 *   - anything that does not stand on a floor. A wall mirror with a shadow
 *     beneath it is a lie about the object, and lies about the object are exactly
 *     what a premium catalogue cannot afford.
 */

import {
  backdropMask,
  type Lab,
  type RawImage,
  toLabPixels,
} from "./image-colours";

/**
 * Share of the frame that must be backdrop before the image counts as a pack shot.
 *
 * A room photograph has almost none; a tightly cropped pack shot still has a
 * quarter of its frame in sweep. Set low enough to keep the tight crops, which are
 * the ones most likely to be a product's lead image.
 */
export const MIN_BACKDROP_SHARE = 0.18;

/** Per-channel gain ceiling when neutralising the backdrop. */
export const MAX_GAIN = 1.14;

/** How dark the deepest part of a synthesised shadow gets, 0–1. */
export const SHADOW_STRENGTH = 0.26;

/**
 * Height of the shadow band as a share of the subject's height.
 *
 * Read off the reference photograph rather than picked: the teak dining table's
 * shadow spreads about a fifteenth of the table's height below the feet.
 */
export const SHADOW_BAND = 0.07;

/** Neutral, and darker than paper but nowhere near black: a cast shadow. */
const SHADOW_MIN_LIGHTNESS = 0.5;
const SHADOW_MAX_LIGHTNESS = 0.8;
const SHADOW_MAX_CHROMA = 0.03;

/**
 * How much of the frame has to look like cast shadow before the image counts as
 * already having one.
 *
 * Deliberately small. A contact shadow under a bedside table is a thin sliver of
 * the frame, and the cost of missing one is drawing a second shadow next to it.
 */
export const EXISTING_SHADOW_SHARE = 0.004;

export interface Backdrop {
  /** Mean channel values of the sweep, 0–255. */
  rgb: [number, number, number];
  /** Share of the frame the sweep occupies, 0–1. */
  share: number;
}

/**
 * Where the subject sits in the frame, in the coordinates of the analysed image.
 *
 * `bottomByColumn` holds the lowest subject row for each column, or -1 for a
 * column with no subject in it, and is what the shadow's contact term is built on.
 */
export interface Subject {
  left: number;
  right: number;
  top: number;
  /** Lowest subject row anywhere — the floor line. */
  bottom: number;
  bottomByColumn: Int32Array;
  /** Subject pixel count per column. */
  occupancyByColumn: Int32Array;
  share: number;
}

export interface Analysis {
  width: number;
  height: number;
  backdrop: Backdrop;
  subject: Subject;
  /** True when the photograph already carries a cast shadow. */
  hasShadow: boolean;
  /** Non-zero where the pixel is backdrop, in analysis coordinates. */
  mask: Uint8Array;
}

function chroma({ a, b }: Lab): number {
  return Math.hypot(a, b);
}

/**
 * Measures the sweep, finds the subject, and decides whether a shadow is already
 * there — all from one downscaled copy of the image.
 *
 * Segmentation runs small on purpose. The mask only ever drives a heavily blurred
 * shadow and a channel gain, neither of which can resolve a single pixel, and
 * converting a 2000×2000 image to Lab means two million objects on the heap.
 */
export function analyse(image: RawImage): Analysis {
  const { width, height, data } = image;
  const pixels = width * height;
  const lab = toLabPixels(image);
  const mask = backdropMask(image, lab);

  let backdropCount = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  for (let i = 0; i < pixels; i += 1) {
    // Value 1 is the sweep reached by flooding in from the frame edge. Values 2
    // and 3 are sweep the product encloses and the antialiased halo around thin
    // bars; both are backdrop, but neither is a safe place to measure the white
    // point, being adjacent to the product by definition.
    if (mask[i] !== 1) continue;
    backdropCount += 1;
    sumR += data[i * 3] ?? 0;
    sumG += data[i * 3 + 1] ?? 0;
    sumB += data[i * 3 + 2] ?? 0;
  }

  const backdrop: Backdrop = {
    rgb: backdropCount
      ? [sumR / backdropCount, sumG / backdropCount, sumB / backdropCount]
      : [255, 255, 255],
    share: backdropCount / pixels,
  };

  const bottomByColumn = new Int32Array(width).fill(-1);
  const occupancyByColumn = new Int32Array(width);
  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;
  let subjectCount = 0;

  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      if (mask[i]) continue;
      subjectCount += 1;
      occupancyByColumn[x] = (occupancyByColumn[x] ?? 0) + 1;
      bottomByColumn[x] = y;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }

  let shadowish = 0;
  for (let i = 0; i < pixels; i += 1) {
    if (mask[i]) continue;
    const pixel = lab[i]!;
    if (
      pixel.L < SHADOW_MIN_LIGHTNESS ||
      pixel.L >= SHADOW_MAX_LIGHTNESS ||
      chroma(pixel) > SHADOW_MAX_CHROMA
    )
      continue;
    // A cast shadow lies on the sweep, so it has sweep beside it. A grey panel on
    // the product itself is surrounded by more product.
    //
    // Any non-zero mask value counts. The segmentation marks the sweep it floods
    // in from the frame edge as 1 but re-marks the ring immediately around the
    // object as 2 or 3 — enclosed sweep and antialiasing halo — and that ring is
    // precisely what a cast shadow touches, so testing for 1 alone finds nothing.
    const x = i % width;
    const y = (i - x) / width;
    const touchesSweep =
      (x > 0 && mask[i - 1] !== 0) ||
      (x < width - 1 && mask[i + 1] !== 0) ||
      (y > 0 && mask[i - width] !== 0) ||
      (y < height - 1 && mask[i + width] !== 0);
    if (touchesSweep) shadowish += 1;
  }

  return {
    width,
    height,
    backdrop,
    subject: {
      left,
      right,
      top,
      bottom,
      bottomByColumn,
      occupancyByColumn,
      share: subjectCount / pixels,
    },
    hasShadow: shadowish / pixels >= EXISTING_SHADOW_SHARE,
    mask,
  };
}

/** Whether the image is a pack shot at all, rather than a room photograph. */
export function isPackShot(analysis: Analysis): boolean {
  return (
    analysis.backdrop.share >= MIN_BACKDROP_SHARE && analysis.subject.right >= 0
  );
}

/**
 * Per-channel gain that turns the measured backdrop white.
 *
 * Returns null when there is nothing worth correcting — a backdrop already inside
 * a couple of levels of white — or when the correction needed is larger than a
 * paper tint, which means the measurement is of something that is not a sweep.
 */
export function whiteBalanceGain(
  backdrop: Backdrop,
): [number, number, number] | null {
  const gains = backdrop.rgb.map((channel) =>
    channel > 0 ? 255 / channel : 1,
  ) as [number, number, number];
  if (gains.some((gain) => gain > MAX_GAIN)) return null;
  // Under half a level of correction on every channel: leave the file alone
  // rather than re-encode it for nothing.
  if (gains.every((gain) => gain < 1.002)) return null;
  return gains;
}

/**
 * The shadow's opacity per column, before blurring.
 *
 * Contact dominates and occupancy modulates it, which is what separates a leg
 * from the span between two legs. Both terms are needed: contact alone gives a
 * wire leg the same weight as a solid plinth, and occupancy alone puts shadow
 * under a tabletop's overhang as though the overhang were resting on the floor.
 */
export function shadowByColumn(subject: Subject, height: number): Float32Array {
  const { bottomByColumn, occupancyByColumn, bottom } = subject;
  const width = bottomByColumn.length;
  const out = new Float32Array(width);
  let peakOccupancy = 0;
  for (let x = 0; x < width; x += 1)
    peakOccupancy = Math.max(peakOccupancy, occupancyByColumn[x] ?? 0);
  if (!peakOccupancy || bottom < 0) return out;

  // Distance from the floor line at which a column stops grounding at all,
  // expressed in image heights so it scales with the crop.
  const reach = Math.max(1, height * 0.12);

  for (let x = 0; x < width; x += 1) {
    const columnBottom = bottomByColumn[x] ?? -1;
    if (columnBottom < 0) continue;
    const contact = Math.exp(-(((bottom - columnBottom) / reach) ** 2));
    const occupancy = (occupancyByColumn[x] ?? 0) / peakOccupancy;
    out[x] = 0.7 * contact + 0.3 * occupancy * contact ** 0.25;
  }
  return out;
}

/**
 * A one-dimensional Gaussian blur, used on the column profile and then on the
 * finished shadow field.
 *
 * Written here rather than handed to sharp because the shadow is a Float32
 * opacity field, not an image, and round-tripping it through 8-bit greyscale to
 * borrow a blur would quantise exactly the soft gradient that makes it read as a
 * shadow.
 */
export function blur1d(values: Float32Array, sigma: number): Float32Array {
  if (sigma <= 0) return values;
  const radius = Math.max(1, Math.ceil(sigma * 3));
  const kernel = new Float32Array(radius * 2 + 1);
  let total = 0;
  for (let i = -radius; i <= radius; i += 1) {
    const weight = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel[i + radius] = weight;
    total += weight;
  }
  for (let i = 0; i < kernel.length; i += 1) kernel[i]! /= total;

  const out = new Float32Array(values.length);
  for (let i = 0; i < values.length; i += 1) {
    let sum = 0;
    for (let k = -radius; k <= radius; k += 1) {
      // Clamp at the edges: a shadow that runs off the side of the frame should
      // stay dark at the edge, not fade towards nothing.
      const j = Math.min(values.length - 1, Math.max(0, i + k));
      sum += values[j]! * kernel[k + radius]!;
    }
    out[i] = sum;
  }
  return out;
}

/**
 * The finished shadow opacity field, in the coordinates of the output image.
 *
 * `scale` maps analysis coordinates to output coordinates, so segmentation can run
 * on a small copy while the shadow is drawn at full size.
 */
export function shadowField({
  subject,
  analysisWidth,
  analysisHeight,
  width,
  height,
}: {
  subject: Subject;
  analysisWidth: number;
  analysisHeight: number;
  width: number;
  height: number;
}): Float32Array {
  const columns = blur1d(
    shadowByColumn(subject, analysisHeight),
    Math.max(1, analysisWidth * 0.012),
  );

  const subjectWidth = Math.max(1, subject.right - subject.left + 1);
  const subjectHeight = Math.max(1, subject.bottom - subject.top + 1);
  // Vertical spread of the band, in output pixels.
  const sigmaY = Math.max(
    2,
    ((subjectHeight * SHADOW_BAND) / analysisHeight) * height,
  );
  const floor = ((subject.bottom + 0.5) / analysisHeight) * height;

  const field = new Float32Array(width * height);
  const xScale = analysisWidth / width;
  for (let y = 0; y < height; y += 1) {
    // The band is asymmetric: a shadow spreads outwards along the floor away from
    // the object, and is occluded above the contact point. Below the floor line it
    // falls off over the full sigma, above it over a third of that.
    const dy = y + 0.5 - floor;
    const sigma = dy >= 0 ? sigmaY : sigmaY / 3;
    const falloff = Math.exp(-((dy / sigma) ** 2));
    if (falloff < 0.004) continue;
    for (let x = 0; x < width; x += 1) {
      const column =
        columns[Math.min(columns.length - 1, (x * xScale) | 0)] ?? 0;
      if (column <= 0) continue;
      field[y * width + x] = column * falloff * SHADOW_STRENGTH;
    }
  }

  // A touch of horizontal softening at output resolution, so the shadow's ends do
  // not inherit the stair-stepping of the small mask.
  const softened = new Float32Array(width * height);
  const sigmaX = Math.max(1, (subjectWidth / analysisWidth) * width * 0.02);
  const row = new Float32Array(width);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) row[x] = field[y * width + x]!;
    const blurred = blur1d(row, sigmaX);
    for (let x = 0; x < width; x += 1) softened[y * width + x] = blurred[x]!;
  }
  return softened;
}

/**
 * Bilinear upsample of the backdrop mask into a subject coverage field, 0–1,
 * where 1 is fully product.
 *
 * Used to hold the shadow off the product. Coverage is deliberately generous —
 * anything partly product counts as product — because the failure that matters is
 * grey bleeding onto the object, and a shadow that stops a pixel early is
 * invisible under a blur this wide.
 */
export function subjectCoverage({
  mask,
  analysisWidth,
  analysisHeight,
  width,
  height,
}: {
  mask: Uint8Array;
  analysisWidth: number;
  analysisHeight: number;
  width: number;
  height: number;
}): Float32Array {
  const out = new Float32Array(width * height);
  const xScale = analysisWidth / width;
  const yScale = analysisHeight / height;
  for (let y = 0; y < height; y += 1) {
    const sy = Math.min(analysisHeight - 1, (y * yScale) | 0);
    for (let x = 0; x < width; x += 1) {
      const sx = Math.min(analysisWidth - 1, (x * xScale) | 0);
      let covered = 0;
      // A 3×3 window in analysis space, so the boundary is dilated by roughly the
      // scale factor and the shadow cannot creep under the silhouette's edge.
      for (let dy = -1; dy <= 1; dy += 1)
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = Math.min(analysisWidth - 1, Math.max(0, sx + dx));
          const ny = Math.min(analysisHeight - 1, Math.max(0, sy + dy));
          if (!mask[ny * analysisWidth + nx]) covered = 1;
        }
      out[y * width + x] = covered;
    }
  }
  return out;
}

/** Titles whose object hangs on a wall, and so has no floor to cast onto. */
const WALL_MOUNTED =
  /\b(mirror|wall art|wall light|sconce|picture|print|canvas|shelf bracket|wall clock|pendant|chandelier)\b/i;

export function standsOnFloor(title: string): boolean {
  return !WALL_MOUNTED.test(title);
}
