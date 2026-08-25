import { dominantMaterial } from "./percentages";
/**
 * Alt text for a product photograph.
 *
 * 7,205 of 7,682 gallery images carry none, which fails a screen reader
 * outright and wastes the one piece of text Google reads about an image.
 *
 * **What this can and cannot do.** Alt text properly describes what is in the
 * picture, and the best of the existing entries were plainly written by
 * somebody looking at one: "cropped view styled with soap products and flowers
 * on top". Nothing here can match that, because it is generated from the
 * product record rather than from the image.
 *
 * What it can do is identify the product accurately — which is the part a
 * screen reader user needs most, and the part currently missing altogether —
 * and say which view it is, from the position in the gallery. Everything it
 * states is a curated field, so it is never wrong; it is just less observant
 * than a person would be.
 */

export interface AltInput {
  title: string;
  /** Position in the gallery, zero-based. */
  index: number;
  /** How many images the product has. */
  total: number;
  material?: string | null;
  primaryColour?: string | null;
  category?: string | null;
}

/**
 * How to refer to the nth photograph.
 *
 * Deliberately vague past the second: "third view" claims nothing about what
 * the third photograph shows, whereas "detail shot" or "in a room setting"
 * would be a guess about an image nobody has looked at.
 */
function viewLabel(index: number, total: number): string {
  if (total <= 1) return "";
  if (index === 0) return "main product image";
  return `view ${index + 1} of ${total}`;
}

export function buildAlt(input: AltInput): string {
  const name = input.title
    .replace(/\s*\|\s*Kaiku(?:\s+Tagline)?\s*$/i, "")
    .trim();

  const descriptors: string[] = [];
  const colour = input.primaryColour?.trim().toLowerCase();
  // Never the raw field: it is a composition line, often with feed junk on the
  // end. "in glass 0%,metal 100% cart weight" reached 467 products' alt text.
  const material = input.material
    ? (dominantMaterial(input.material.trim().toLowerCase()) ?? undefined)
    : undefined;

  // "in grey ceramic" reads better than "in ceramic, in grey", and repeating a
  // word already in the product's name adds nothing.
  const inName = (word?: string) =>
    Boolean(word) && new RegExp(`\\b${word}\\b`, "i").test(name);

  if (colour && material && !inName(colour) && !inName(material))
    descriptors.push(`${colour} ${material}`);
  else if (material && !inName(material)) descriptors.push(material);
  else if (colour && !inName(colour)) descriptors.push(colour);

  const view = viewLabel(input.index, input.total);
  const parts = [name];
  if (descriptors.length) parts.push(`in ${descriptors.join(" ")}`);

  // A product photograph is never decorative, so it must never end up with an
  // empty alt attribute. Where a product has no usable name, its category is
  // still more use to a screen reader than silence.
  if (!name) {
    const fallback = input.category?.trim()
      ? `${input.category.trim()} product image`
      : "Product image";
    return view ? `${fallback} — ${view}` : fallback;
  }

  const sentence = parts.join(", ");
  return view ? `${sentence} — ${view}` : sentence;
}
