/**
 * Reads the colours actually present in a product photograph.
 *
 * Damien's rule, and it is a better rule than the one the text-based derivation
 * was following: the colour tags should describe what is in the picture. A white
 * table with gold legs is **White and Gold**, because that is what arrives. The
 * text derivation could never see that — "Abberley White End Table" says white
 * and stops, and "Grafton Black Console Table | Industrial Oak Console Table"
 * tags Oak onto a console that is black steel in every photograph.
 *
 * Four decisions in here matter more than the arithmetic, and all four were
 * arrived at by looking at what the first attempts got wrong on real product
 * shots:
 *
 * **The backdrop is found by connectivity, not by brightness.** 353 of 439
 * images are catalogue shots on a white sweep, so the most common colour in the
 * data is the paper. Rejecting every pale near-neutral pixel would also erase
 * every white product — precisely the case the rule exists to describe. Instead
 * the pale pixels touching the frame edge are flooded inwards.
 *
 * **The flood needs an edge barrier or it eats pale products.** Without one, the
 * white Abberley chest on a white sweep was consumed whole: 25 subject pixels out
 * of 9216, because at thumbnail scale the boundary is a soft grey line the fill
 * walks straight across. Blocking the fill at a Sobel edge leaves the chest
 * standing at 2904 pixels.
 *
 * **Sweep enclosed by the product has to be caught separately.** The inside of
 * Grafton's open steel frame is sweep, but it is not reachable from the frame
 * edge, so connectivity alone left it as subject and reported a black console as
 * 76% White. Two extra passes fix it: pale pixels that match the measured sweep
 * colour almost exactly, and the pale halo ring where a thin bar was
 * antialiased against the paper. After both, Grafton reads as 808 pixels of
 * black frame and no white at all.
 *
 * **Distance is measured in OKLab.** The obvious hand-rolled metric — weight hue
 * over lightness so brass reads as metal rather than pale brown — put dull gold
 * nearer to dark green than to gold, and duly tagged a brass-legged table Green.
 * OKLab costs a cube root per pixel and is simply correct. (Sharp can emit
 * CIELAB directly but clips the negative a/b channels to zero in 8-bit, so every
 * blue and green arrives as a neutral; hence the conversion here.)
 *
 * The palette is supplied by the caller rather than taken from the whole
 * vocabulary. Matching 21 swatches against a photograph is an open-set problem
 * and the near-duplicates (White, Ivory, Cream, Neutral, Natural, Taupe) fight
 * over the same pixels. The question actually being asked is narrower and much
 * more answerable: *of the colours this product is offered in, which are in the
 * picture, and is there an accent besides?*
 */

export interface RawImage {
  width: number;
  height: number;
  /** RGB, three bytes per pixel, row-major. */
  data: Uint8Array | Buffer;
}

export interface Swatch {
  tag: string;
  /** Hex, as held in the filter vocabulary. */
  hex: string;
}

export interface Lab {
  L: number;
  a: number;
  b: number;
}

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** sRGB to OKLab (Ottosson). L runs 0–1, a and b are roughly ±0.4. */
export function toOklab(r: number, g: number, b: number): Lab {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
  );

  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

export function hexToOklab(hex: string): Lab {
  return toOklab(
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  );
}

function chroma({ a, b }: Lab): number {
  return Math.sqrt(a * a + b * b);
}

export function labDistance(x: Lab, y: Lab): number {
  const dL = x.L - y.L;
  const da = x.a - y.a;
  const db = x.b - y.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * Pale and near-neutral: a candidate for sweep, subject to the tests below.
 * Deliberately generous, because a photographic sweep is never one flat value —
 * it falls off towards the corners and carries the object's shadow.
 */
const PAPER_LIGHTNESS = 0.8;
const PAPER_CHROMA = 0.045;

/** Sobel magnitude above which the flood will not cross. Anywhere in 0.06–0.15
 *  gave the same answer on the sample, so this sits in the middle of the range
 *  rather than on the edge of it. */
const EDGE_BARRIER = 0.1;

/** How near the measured sweep colour a pale pixel must be to be called sweep
 *  the product happens to enclose. Paper is flat; a painted surface is not. */
const SWEEP_MATCH = 0.015;

/** Passes of halo stripping. Two clears the antialiased ring around a bar
 *  roughly 2px wide, which is what the thin-framed consoles have. */
const HALO_PASSES = 2;

/** Near-black is shadow under the object at least as often as it is the object. */
const SHADOW_LIGHTNESS = 0.16;

/** How far a pixel may sit from a swatch and still be counted as it. */
export const MATCH_TOLERANCE = 0.17;

/**
 * Two swatches closer together than this cannot be told apart in a photograph,
 * so only the caller's preferred one is offered to the matcher.
 *
 * Set from the vocabulary's own spacing rather than picked: the closest pairs are
 * Whitewash/Cream at 0.012, Natural/Neutral at 0.022, Ivory/Cream at 0.028,
 * **Oak/Gold at 0.040** and Oak/Brass at 0.048. That Oak sits nearer to Gold than
 * Gold does to Brass (0.073) is the honest limit of reading colour off a
 * photograph: pale timber and warm metal are the same colour to within the
 * accuracy of these swatches, and a rule that claimed to separate them would be
 * guessing. Anything looser starts collapsing pairs a shopper would never
 * confuse — Brown and Green are only 0.075 apart, both being dark and muted.
 */
export const SWATCH_MIN_SEPARATION = 0.05;

/**
 * A reading needs this much of the frame to be product before it says anything.
 *
 * Below it the segmentation either found a very tight crop or leaked, and a
 * handful of pixels would be deciding the product's colours on their own.
 */
export const MIN_SUBJECT_SHARE = 0.04;

/**
 * A colour has to hold this much of the subject to be one of the product's
 * colours. Low enough to keep the gold legs under a white table, high enough to
 * drop the stray pixel where a shadow met the sweep.
 */
export const MIN_COLOUR_SHARE = 0.08;

export interface ColourShare {
  tag: string;
  /** Share of the product's own pixels, 0–1. */
  share: number;
}

export interface ImageReading {
  colours: ColourShare[];
  /** Share of the frame that was subject rather than backdrop. */
  subjectShare: number;
  /** Share of the subject that matched nothing in the palette. High means the
   *  palette is missing the colour the product actually is. */
  unmatchedShare: number;
}

/** Sobel gradient magnitude of lightness, used only as a barrier to the flood. */
function edges(image: RawImage, lab: Lab[]): Float32Array {
  const { width, height } = image;
  const magnitude = new Float32Array(width * height);
  const L = (x: number, y: number) =>
    lab[
      Math.min(height - 1, Math.max(0, y)) * width +
        Math.min(width - 1, Math.max(0, x))
    ]!.L;

  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1) {
      const gx =
        -L(x - 1, y - 1) -
        2 * L(x - 1, y) -
        L(x - 1, y + 1) +
        L(x + 1, y - 1) +
        2 * L(x + 1, y) +
        L(x + 1, y + 1);
      const gy =
        -L(x - 1, y - 1) -
        2 * L(x, y - 1) -
        L(x + 1, y - 1) +
        L(x - 1, y + 1) +
        2 * L(x, y + 1) +
        L(x + 1, y + 1);
      magnitude[y * width + x] = Math.sqrt(gx * gx + gy * gy);
    }

  return magnitude;
}

/**
 * Marks every pixel that belongs to the backdrop rather than the product.
 *
 * Returns a mask where a non-zero value is backdrop. Exported so a caller can
 * show its work — the segmentation is the part of this file most worth being
 * able to look at directly.
 */
export function backdropMask(image: RawImage, lab: Lab[]): Uint8Array {
  const { width, height } = image;
  const pixels = width * height;
  const gradient = edges(image, lab);
  const mask = new Uint8Array(pixels);

  const isPaper = (index: number) => {
    const pixel = lab[index]!;
    return pixel.L >= PAPER_LIGHTNESS && chroma(pixel) <= PAPER_CHROMA;
  };

  // Pass one: flood in from the frame edge, stopping at edges in the image.
  const queue: number[] = [];
  const seed = (index: number) => {
    if (mask[index] || !isPaper(index) || gradient[index]! > EDGE_BARRIER)
      return;
    mask[index] = 1;
    queue.push(index);
  };

  for (let x = 0; x < width; x += 1) {
    seed(x);
    seed((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    seed(y * width);
    seed(y * width + width - 1);
  }
  while (queue.length) {
    const index = queue.pop()!;
    const x = index % width;
    const y = (index - x) / width;
    if (x > 0) seed(index - 1);
    if (x < width - 1) seed(index + 1);
    if (y > 0) seed(index - width);
    if (y < height - 1) seed(index + width);
  }

  // Nothing pale touched the edge, so there is no sweep to measure and the two
  // passes below have no reference to work from. A lifestyle shot, usually.
  let found = 0;
  let sumL = 0;
  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < pixels; i += 1)
    if (mask[i]) {
      found += 1;
      sumL += lab[i]!.L;
      sumA += lab[i]!.a;
      sumB += lab[i]!.b;
    }
  if (!found) return mask;
  const sweep = { L: sumL / found, a: sumA / found, b: sumB / found };

  // Pass two: sweep the product encloses. Same paper, unreachable from outside.
  for (let i = 0; i < pixels; i += 1) {
    if (mask[i] || !isPaper(i)) continue;
    if (labDistance(lab[i]!, sweep) <= SWEEP_MATCH) mask[i] = 2;
  }

  // Pass three: the pale halo where a thin bar was antialiased into the paper.
  for (let pass = 0; pass < HALO_PASSES; pass += 1) {
    const halo: number[] = [];
    for (let i = 0; i < pixels; i += 1) {
      if (mask[i] || !isPaper(i)) continue;
      const x = i % width;
      const y = (i - x) / width;
      if (
        (x > 0 && mask[i - 1]) ||
        (x < width - 1 && mask[i + 1]) ||
        (y > 0 && mask[i - width]) ||
        (y < height - 1 && mask[i + width])
      )
        halo.push(i);
    }
    for (const i of halo) mask[i] = 3;
  }

  return mask;
}

export function toLabPixels(image: RawImage): Lab[] {
  const pixels = image.width * image.height;
  const lab: Lab[] = new Array(pixels);
  for (let i = 0; i < pixels; i += 1)
    lab[i] = toOklab(
      image.data[i * 3] ?? 0,
      image.data[i * 3 + 1] ?? 0,
      image.data[i * 3 + 2] ?? 0,
    );
  return lab;
}

/**
 * Drops swatches too close to one another to be distinguished in a photograph.
 *
 * Oak and Gold are 0.040 apart in OKLab. Offered both, the matcher splits one
 * set of brass legs between them and each half can land under the threshold, so a
 * table with obviously metal legs comes back with neither colour. The caller's
 * order decides which survives — put the colours already on the product first, so
 * this leans towards leaving Damien's tags as they are.
 */
export function dedupeSwatches(palette: readonly Swatch[]): Swatch[] {
  const kept: { swatch: Swatch; lab: Lab }[] = [];
  for (const swatch of palette) {
    const lab = hexToOklab(swatch.hex);
    if (kept.some((k) => labDistance(k.lab, lab) < SWATCH_MIN_SEPARATION))
      continue;
    kept.push({ swatch, lab });
  }
  return kept.map((k) => k.swatch);
}

/**
 * Every palette colour present in the image, with its share of the subject.
 *
 * Sorted by share, so the caller can take the leader as primary and apply
 * `MIN_COLOUR_SHARE` to the rest.
 */
export function coloursInImage(
  image: RawImage,
  palette: readonly Swatch[],
): ImageReading {
  const pixels = image.width * image.height;
  const lab = toLabPixels(image);
  const backdrop = backdropMask(image, lab);
  const swatches = dedupeSwatches(palette).map((s) => ({
    tag: s.tag,
    lab: hexToOklab(s.hex),
  }));

  const counts = new Map<string, number>();
  let subject = 0;
  let unmatched = 0;

  for (let i = 0; i < pixels; i += 1) {
    if (backdrop[i]) continue;
    const pixel = lab[i]!;
    if (pixel.L < SHADOW_LIGHTNESS) continue;
    subject += 1;

    let best: { tag: string; d: number } | null = null;
    for (const swatch of swatches) {
      const d = labDistance(pixel, swatch.lab);
      if (!best || d < best.d) best = { tag: swatch.tag, d };
    }
    if (best && best.d <= MATCH_TOLERANCE)
      counts.set(best.tag, (counts.get(best.tag) ?? 0) + 1);
    else unmatched += 1;
  }

  const colours = [...counts.entries()]
    .map(([tag, n]) => ({ tag, share: subject ? n / subject : 0 }))
    .sort((a, b) => b.share - a.share);

  return {
    colours,
    subjectShare: pixels ? subject / pixels : 0,
    unmatchedShare: subject ? unmatched / subject : 0,
  };
}

/**
 * Merge several photographs of one product into a single set of colour shares.
 *
 * Weighted by how much product each frame contained, so a tight crop of one
 * corner does not outvote the full shot it was cropped from.
 */
export function mergeColourShares(perImage: ImageReading[]): ColourShare[] {
  const totals = new Map<string, number>();
  let weight = 0;
  for (const image of perImage) {
    const w = image.subjectShare;
    if (w <= 0) continue;
    weight += w;
    for (const colour of image.colours)
      totals.set(colour.tag, (totals.get(colour.tag) ?? 0) + colour.share * w);
  }
  if (!weight) return [];
  return [...totals.entries()]
    .map(([tag, sum]) => ({ tag, share: sum / weight }))
    .sort((a, b) => b.share - a.share);
}
