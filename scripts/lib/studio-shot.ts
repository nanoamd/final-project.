/**
 * Decides which gallery images are clean catalogue shots, which are detail
 * crops, and which are lifestyle photography — from the low-quality image
 * placeholder Sanity already stores on every asset.
 *
 * The brief needs image one to be the clean white-background product shot and
 * the hover to be the lifestyle photo, across a catalogue heading for thousands
 * of products. So it has to be decided by a rule, not by an editor ticking 439
 * boxes.
 *
 * **Why the LQIP and not the image.** Every Sanity asset carries
 * `metadata.lqip`, a base64 JPEG thumbnail about 20px on its longest edge,
 * inside the document we are already fetching. Reading it costs no network
 * request and no CDN transform, and 20px is ample: the question is "is the edge
 * of this frame a seamless white sweep", which survives being shrunk to a
 * postage stamp. Downloading 439 originals to answer it would be 120MB.
 *
 * **What the measure is, and what it is not.** The first version of this used
 * mean border lightness and how much the border varied. Checking it against the
 * actual photographs killed it: a large product on white, cropped tight, has a
 * busy border and scored as "lifestyle", and so did every Ancient Wisdom bottle
 * shot. Variation is not the signal.
 *
 * What works is the *share of the border that is actually white* — near-white
 * and near-neutral, both at once. A product on a seamless sweep has most of its
 * frame edge in white. A detail crop of the same product on the same sweep has
 * some. A photograph taken in a room has almost none, because a floor, a wall or
 * a sky is either darker or carries colour. Requiring neutrality as well as
 * lightness is what stops a pale timber decking or a sunlit cream wall reading
 * as a backdrop.
 *
 * Two classes, and an explicit "don't know":
 *
 *   catalogue  Product on a plain sweep. Belongs ahead of the room photography.
 *   lifestyle  Photographed in a setting. The hover image.
 *
 * An earlier draft had a third class for detail crops, separated from full
 * product shots by how much white margin was left. The photographs killed that
 * too: a barrel filling its frame on pure white scored the same as a close-up of
 * a drawer handle, because "how tightly is this cropped" and "how much of the
 * frame is backdrop" are not the same question. Distinguishing them would need
 * to know where the product's edges are, which a 20px thumbnail cannot say — so
 * the class is gone rather than guessed.
 *
 * Which catalogue shot leads is therefore the editor's existing order, not a
 * score. A supplier's first image is nearly always the intended hero, and
 * overriding that on a soft signal risks promoting a rear view.
 *
 * Anything between the two thresholds is reported as unknown and left alone: a
 * wrong flag reorders a product's photography for every future visitor, and an
 * absent flag simply leaves today's behaviour in place.
 */

interface Pixel {
  r: number;
  g: number;
  b: number;
}

export interface RawImage {
  width: number;
  height: number;
  /** RGB, three bytes per pixel, row-major. */
  data: Uint8Array | Buffer;
}

export type ShotKind = "catalogue" | "lifestyle" | "unknown";

export interface ShotVerdict {
  kind: ShotKind;
  /** Share of border pixels that are near-white and near-neutral, 0–1. */
  whiteFraction: number;
  /** Mean lightness of the border, 0–255. Reported for the audit, not decisive. */
  borderLightness: number;
  /** Plain-English reason, for the dry run to print. */
  reason: string;
}

/**
 * A pixel counts as backdrop when it is both bright and close to neutral.
 *
 * 232 rather than 250 because a 20px JPEG smears the product's edge into the
 * sweep; 20 on the channel spread because studio sweeps photograph very
 * slightly warm or cool, while anything a room contributes is more saturated
 * than that.
 */
const WHITE_LIGHTNESS = 232;
const WHITE_NEUTRALITY = 20;

/**
 * Calibrated against the real photographs, not chosen in the abstract.
 *
 * The white-fraction histogram across all 862 assets is strongly bimodal with an
 * empty middle: 207 assets under 10%, 203 above 70%, and a valley of 14 in the
 * 10–19% band. These two thresholds sit either side of that valley, which is why
 * only 16 images land as unknown.
 */
const CATALOGUE_MIN_WHITE = 0.2;
const LIFESTYLE_MAX_WHITE = 0.08;

function pixelAt(image: RawImage, x: number, y: number): Pixel {
  const offset = (y * image.width + x) * 3;
  return {
    r: image.data[offset] ?? 0,
    g: image.data[offset + 1] ?? 0,
    b: image.data[offset + 2] ?? 0,
  };
}

/** Perceptual lightness. Rec. 709 luma — green dominates what the eye reads. */
export function lightness({ r, g, b }: Pixel): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** How far from grey a pixel is — the channel spread. */
function chroma({ r, g, b }: Pixel): number {
  return Math.max(r, g, b) - Math.min(r, g, b);
}

function isBackdrop(pixel: Pixel): boolean {
  return (
    lightness(pixel) >= WHITE_LIGHTNESS && chroma(pixel) <= WHITE_NEUTRALITY
  );
}

/**
 * The one-pixel frame around the image.
 *
 * A frame, not the four corners: a lifestyle shot can have four pale corners and
 * a sofa filling the middle of every edge, and the frame catches that where
 * corner sampling does not.
 */
function borderPixels(image: RawImage): Pixel[] {
  const pixels: Pixel[] = [];
  const { width, height } = image;
  if (width < 3 || height < 3) return pixels;
  for (let x = 0; x < width; x += 1) {
    pixels.push(pixelAt(image, x, 0));
    pixels.push(pixelAt(image, x, height - 1));
  }
  for (let y = 1; y < height - 1; y += 1) {
    pixels.push(pixelAt(image, 0, y));
    pixels.push(pixelAt(image, width - 1, y));
  }
  return pixels;
}

function mean(values: number[]): number {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

export function classifyShot(image: RawImage): ShotVerdict {
  const border = borderPixels(image);
  if (border.length < 12)
    return {
      kind: "unknown",
      whiteFraction: 0,
      borderLightness: 0,
      reason: "thumbnail too small to sample",
    };

  const whiteFraction = border.filter(isBackdrop).length / border.length;
  const borderLightness = mean(border.map(lightness));
  const percent = `${Math.round(whiteFraction * 100)}% white border`;

  if (whiteFraction >= CATALOGUE_MIN_WHITE)
    return {
      kind: "catalogue",
      whiteFraction,
      borderLightness,
      reason: `product on a plain sweep — ${percent}`,
    };

  if (whiteFraction <= LIFESTYLE_MAX_WHITE)
    return {
      kind: "lifestyle",
      whiteFraction,
      borderLightness,
      reason: `photographed in a setting — ${percent}`,
    };

  return {
    kind: "unknown",
    whiteFraction,
    borderLightness,
    reason: `between a sweep and a setting — ${percent}`,
  };
}

/**
 * The order a product's gallery should be in: catalogue shots first, then the
 * lifestyle photography so the first of those becomes the hover, then anything
 * undecided. Each group keeps the editor's own sequence.
 *
 * Returns indices into the original array — a stable sort of the existing order
 * rather than a rebuild, so a gallery an editor has arranged deliberately is
 * only changed where the rule actually disagrees with it.
 */
const RANK: Record<ShotKind, number> = {
  catalogue: 0,
  lifestyle: 1,
  unknown: 2,
};

/**
 * A leading catalogue shot this tight is a close crop, not a product shot.
 *
 * Found by looking at the rendered Coffee Tables grid on a phone: every tile
 * showed a whole table except Pershore, which led with a close-up of the table
 * edge. Its first image measures 45% white border against 100% for the other
 * three in the same gallery — so the signal that distinguishes them is there
 * after all, just not reliably enough to carry a whole class of its own.
 *
 * Hence a narrow rule rather than a re-sort: swap only when the leader is
 * clearly a tight crop *and* a clearly fuller shot exists. On the 45-versus-100
 * case that fires; on a gallery where every shot measures 100 it does nothing.
 */
const TIGHT_CROP_MAX = 0.6;
const FULL_SHOT_MIN = 0.85;

export interface Shot {
  kind: ShotKind;
  /** From `classifyShot`. Zero for an image that could not be measured. */
  whiteFraction: number;
}

export function preferredOrder(shots: Shot[]): number[] {
  const order = shots
    .map((shot, index) => ({ ...shot, index }))
    .sort((a, b) => RANK[a.kind] - RANK[b.kind] || a.index - b.index);

  const leader = order[0];
  if (leader?.kind === "catalogue" && leader.whiteFraction < TIGHT_CROP_MAX) {
    const fuller = order.findIndex(
      (shot) =>
        shot.kind === "catalogue" && shot.whiteFraction >= FULL_SHOT_MIN,
    );
    // One move, not a sort: lift the fuller shot to the front and let everything
    // else keep its place.
    if (fuller > 0) order.unshift(...order.splice(fuller, 1));
  }

  return order.map((entry) => entry.index);
}

/**
 * Whether this gallery may be reordered at all.
 *
 * Without a confidently-identified catalogue shot there is nothing to promote,
 * and shuffling the rest would be churn on an editor's arrangement for no gain.
 */
export function canReorder(shots: Shot[]): boolean {
  return shots.some((shot) => shot.kind === "catalogue");
}

/** True when the order actually differs, so an unchanged product is not written. */
export function orderChanges(order: number[]): boolean {
  return order.some((index, position) => index !== position);
}

/** What `isStudioShot` records: photographed on a plain sweep. */
export function isPlainBackground(kind: ShotKind): boolean {
  return kind === "catalogue";
}
