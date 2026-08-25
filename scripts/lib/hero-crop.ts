/**
 * Works out how tightly a product photograph can be cropped so the product fills
 * its frame, and expresses that as a Sanity crop.
 *
 * Why, in one measurement: across the 120 published hero images the product occupies
 * **82% of the frame on average and as little as 49%** — Elmley Grey End Table is a
 * 139×195 object inside a 400×400 photograph. Every one of those frames is already
 * square, so Kaiku is not being letterboxed in a Shopping tile the way a competitor
 * with a landscape photograph is. It is losing to something quieter: half the tile
 * is empty white. Trimming the wasted margin makes the product 1.3–1.9× larger in
 * exactly the same tile, for the same ad spend and the same photograph.
 *
 * A margin is kept rather than cropping flush to the product, for two reasons. Google
 * Merchant Center requires the whole product to be visible and warns on images that
 * look cropped; and a product jammed against the frame edge reads as a mistake next
 * to competitors' images that all have air around them. 6% of the frame is enough to
 * read as deliberate and small enough to be worth doing.
 *
 * Kept pure and separate from the script so the arithmetic is testable: an inverted
 * or over-large crop would silently mangle every product image on the site, and the
 * failure would show up as "the photos look wrong" weeks later.
 */

/** A bounding box in pixels, as `sharp().trim()` reports it. */
export interface TrimBox {
  /** Distance from the left edge of the frame to the product. */
  left: number;
  /** Distance from the top edge of the frame to the product. */
  top: number;
  width: number;
  height: number;
}

export interface Frame {
  width: number;
  height: number;
}

/**
 * Sanity's crop: the fraction of the original to remove from each side. Note it is
 * *not* x/y/width/height — getting that wrong crops to the complement of the
 * intended region, which is the kind of error that looks like a broken image.
 */
export interface SanityCrop {
  _type: "sanity.imageCrop";
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** Sanity's hotspot: centre and extent, all fractions of the original. */
export interface SanityHotspot {
  _type: "sanity.imageHotspot";
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Share of the final frame left as air around the product, per side. */
export const MARGIN = 0.06;

/**
 * The square region containing the product plus a margin, in pixels.
 *
 * Square because a Shopping tile is square and every one of these photographs
 * already is: producing a square region means the CDN's later 1:1 request is a
 * no-op rather than a second, unintended crop on top of this one.
 *
 * Returns null when there is nothing worth doing — either the trim found no product,
 * or the product already fills the frame, in which case writing a crop would be
 * churn on the dataset for no visible change.
 */
export function squareCrop(
  box: TrimBox,
  frame: Frame,
  {
    margin = MARGIN,
    minGain = 1.05,
  }: { margin?: number; minGain?: number } = {},
): SanityCrop | null {
  if (box.width <= 0 || box.height <= 0) return null;
  if (frame.width <= 0 || frame.height <= 0) return null;

  const longest = Math.max(box.width, box.height);
  // The product should occupy (1 - 2*margin) of the square, so the square is the
  // product's longest side scaled up by the margin on both sides.
  const ideal = longest / (1 - margin * 2);
  // Never larger than the frame: a crop cannot invent pixels that were not
  // photographed, and asking for them would letterbox rather than fill.
  const side = Math.min(ideal, frame.width, frame.height);

  const gain = Math.min(frame.width, frame.height) / side;
  if (gain < minGain) return null;

  // Centre the square on the product, then slide it back inside the frame rather
  // than clipping it — clipping would move the product off-centre.
  const centreX = box.left + box.width / 2;
  const centreY = box.top + box.height / 2;
  const left = Math.max(0, Math.min(centreX - side / 2, frame.width - side));
  const top = Math.max(0, Math.min(centreY - side / 2, frame.height - side));

  return {
    _type: "sanity.imageCrop",
    left: round(left / frame.width),
    top: round(top / frame.height),
    right: round((frame.width - left - side) / frame.width),
    bottom: round((frame.height - top - side) / frame.height),
  };
}

/**
 * A hotspot covering the same region.
 *
 * Sanity applies the crop first and the hotspot within it, and `urlForImage`
 * ignores a crop unless a hotspot is present — `resolveCardImageUrl` in
 * src/lib/sanity/queries/product.ts checks `img.hotspot` before it will use either.
 * So the two have to be written together or neither takes effect.
 */
export function fullHotspot(): SanityHotspot {
  return {
    _type: "sanity.imageHotspot",
    x: 0.5,
    y: 0.5,
    width: 1,
    height: 1,
  };
}

/** How much bigger the product gets, as a multiple, for the dry run to print. */
export function magnification(crop: SanityCrop, frame: Frame): number {
  const width = frame.width * (1 - crop.left - crop.right);
  const height = frame.height * (1 - crop.top - crop.bottom);
  const side = Math.max(width, height);
  if (side <= 0) return 1;
  return Math.round((Math.max(frame.width, frame.height) / side) * 100) / 100;
}

/** Four decimals — Sanity stores these as floats and the extra digits are noise. */
function round(value: number): number {
  return Math.round(Math.max(0, value) * 10000) / 10000;
}
