/**
 * Shortening a product title that Google truncates, without renaming anything.
 *
 * 118 of 907 product titles run past the ~60 characters Google renders, and the
 * one with the most impressions on the whole site is among them: the
 * SaunaPlunge Yorkshire Cabin at 68 characters, where the word cut off is
 * "Sauna" — the single word the query turns on.
 *
 * This writes `seo.metaTitle` only. The product's own `title` is never touched,
 * and "| Kaiku" always survives, because both are standing constraints.
 *
 * Reductions are applied in order and stop the moment the title fits, so the
 * mildest change that works is the one that ships:
 *
 *   1. Whitespace and separator artifacts — "- -" appears in real titles.
 *   2. Trademark symbols, which cost characters and match no query.
 *   3. Dimension strings — "(30.5x22.5x2.3cm)" and "- 19x19x28cm -". A shopper
 *      does not search these and Google shows them nowhere useful, so they are
 *      the cheapest characters in the title to spend.
 *   4. "and" to "&", which reads identically in a result.
 *   5. The word "Finish", and "Collection" — "Black Finish" and "Black" are the
 *      same colour to a shopper. "Effect" is deliberately **not** in that list:
 *      "Leather Effect" means faux leather, and dropping it would turn the
 *      title into a claim about the material that is not true.
 *   6. A trailing "with …" clause, dropped whole. This is the big one, and it
 *      replaced truncation as the main tool: "Floor Lamp with Chrome Base and
 *      Black Shade" becomes "Floor Lamp", which still reads as English and
 *      still carries the head noun, where cutting to length gave "Floor Lamp
 *      with Chrome".
 *   7. Dropping up to two leading collection names. English product names put
 *      the head noun last, so trimming from the front keeps the words that earn
 *      the impression. Capped at two because collection names are one or two
 *      words; an uncapped version ate "Grand Water" and left "Feature -".
 *   8. Only if all of that fails, truncate on a word boundary — then strip any
 *      trailing preposition or conjunction, because "… Glass Jars with" is not
 *      a title.
 *
 * **And if even that loses the head noun, nothing is written at all.** A
 * product Google truncates is no worse off than one carrying a title that
 * reads as broken English, so those are reported for a human instead. Shipping
 * "One Drawer Bedside" in place of "One Drawer Bedside Table" would be the
 * exact fault this exists to fix.
 */

/** Google renders roughly this much of a title. */
export const META_TITLE_MAX = 60;

const BRAND_SUFFIX = " | Kaiku";

/** From the catalogue's own colourTags. Never dropped — colour earns queries. */
const COLOURS = new Set([
  "aqua",
  "black",
  "blue",
  "bluewash",
  "brass",
  "bronze",
  "brown",
  "cream",
  "gold",
  "green",
  "greenwash",
  "grey",
  "ivory",
  "natural",
  "neutral",
  "oak",
  "taupe",
  "walnut",
  "white",
  "whitewash",
  "silver",
  "charcoal",
  "sage",
]);

/** From the catalogue's own materialTags, single words only. */
const MATERIALS = new Set([
  "birch",
  "bouclé",
  "boucle",
  "brass",
  "ceramic",
  "chenille",
  "concrete",
  "fabric",
  "gesso",
  "glass",
  "hemlock",
  "linen",
  "mdf",
  "marble",
  "metal",
  "plastic",
  "polyester",
  "rattan",
  "resin",
  "spruce",
  "steel",
  "stoneware",
  "teak",
  "velvet",
  "walnut",
  "wood",
  "oak",
  "mango",
  "acacia",
  "leather",
  "aluminium",
  "stone",
  "bamboo",
]);

/** Words that are the product itself. Dropping one loses the query. */
const HEAD_NOUNS = new Set([
  "lamp",
  "light",
  "lights",
  "chandelier",
  "pendant",
  "mirror",
  "vase",
  "clock",
  "table",
  "desk",
  "chair",
  "sofa",
  "bed",
  "stool",
  "bench",
  "shelf",
  "shelves",
  "bookcase",
  "cabinet",
  "sideboard",
  "console",
  "dresser",
  "drawers",
  "chest",
  "wardrobe",
  "planter",
  "pot",
  "lantern",
  "candle",
  "holder",
  "screen",
  "trellis",
  "firepit",
  "pit",
  "heater",
  "fountain",
  "feature",
  "sauna",
  "plunge",
  "rug",
  "art",
  "print",
  "canvas",
  "unit",
  "stand",
  "storage",
  "basket",
  "tray",
  "bowl",
  "sculpture",
  "frame",
  "set",
  "trolley",
  "pergola",
  "gazebo",
  "parasol",
  "hammock",
  "jars",
  "jar",
  "wreath",
  "ornament",
]);

function isProtected(word: string): boolean {
  const clean = word.toLowerCase().replace(/[^a-z0-9à-ÿ-]/g, "");
  if (!clean) return true;
  // A number or a size token — "2-Person", "4ft6", "8-Seater", "400l".
  if (/\d/.test(clean)) return true;
  return COLOURS.has(clean) || MATERIALS.has(clean) || HEAD_NOUNS.has(clean);
}

/** Collapses runs of whitespace and repaired separators like "- -". */
function tidy(value: string): string {
  return value
    .replace(/\s*[-–—]\s*[-–—]\s*/g, " - ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.])/g, "$1")
    .trim();
}

function stripTrademarks(value: string): string {
  return value.replace(/[™®©]/g, "");
}

/**
 * Removes a measurement string wherever it appears — parenthesised, or fenced
 * by dashes mid-title. Matches on the presence of a unit so ordinary numbers
 * ("2-Person", "8-Seater", "400L") are left alone.
 */
function stripDimensions(value: string): string {
  return value
    .replace(/\s*\([^)]*\d+(?:\.\d+)?\s*(?:x|×)[^)]*\)\s*/gi, " ")
    .replace(
      /\s*[-–—]\s*\d+(?:\.\d+)?\s*(?:x|×)\s*[\d.\sx×]*(?:cm|mm|m)\b\s*[-–—]?\s*/gi,
      " - ",
    )
    .replace(
      /\s*\b\d+(?:\.\d+)?(?:x|×)\d+(?:\.\d+)?(?:(?:x|×)\d+(?:\.\d+)?)?\s*(?:cm|mm|m)\b\s*/gi,
      " ",
    );
}

/** Words a title must never end on after a cut. */
const DANGLING = new Set([
  "with",
  "and",
  "&",
  "in",
  "on",
  "for",
  "of",
  "the",
  "a",
  "an",
  "to",
  "from",
  "by",
  "at",
  "plus",
  "or",
]);

/** Trailing "with …" is the most droppable clause in a supplier title. */
function dropWithClause(value: string): string {
  const match = /\s+\bwith\b\s+.+$/i.exec(value);
  if (!match) return value;
  const head = value.slice(0, match.index).trim();
  // Only if what remains is still a product rather than a fragment.
  return head.split(" ").length >= 3 ? head : value;
}

function dropFiller(value: string): string {
  return value.replace(/\s*\b(finish|collection)\b/gi, "");
}

/** True when the text still names the thing being sold. */
function hasHeadNoun(value: string): boolean {
  return value
    .toLowerCase()
    .split(/[^a-z]+/)
    .some((word) => HEAD_NOUNS.has(word));
}

export interface MetaTitleResult {
  /** The shortened title, always ending in the brand suffix. */
  value: string;
  /** Which reductions were needed, in the order applied. */
  steps: string[];
  /** True when the last-resort truncation ran. */
  truncated: boolean;
  /**
   * True when no safe shortening exists — the caller should write nothing and
   * report it. `value` is the untouched original in that case.
   */
  unsafe?: boolean;
}

export interface ShortenOptions {
  /**
   * Skip the "with …" clause drop.
   *
   * That step is the best tool here in general, and occasionally the worst: on
   * a range whose variants differ *only* in that clause it collapses them into
   * one title. Three Freska jars — "with Acacia Wood Lid 1100ml", "800ml",
   * "550ml" — became three identical titles, and two pages sharing a title is
   * worse than one Google truncates, because it folds them together. The
   * caller retries with this set when it detects a collision.
   */
  keepWithClause?: boolean;
}

export function shortenMetaTitle(
  title: string,
  max: number = META_TITLE_MAX,
  options: ShortenOptions = {},
): MetaTitleResult {
  const original = (title ?? "").trim();
  const steps: string[] = [];
  if (!original) return { value: "", steps, truncated: false };

  const hadSuffix = original.endsWith(BRAND_SUFFIX);
  let base = hadSuffix
    ? original.slice(0, -BRAND_SUFFIX.length).trim()
    : original;
  const suffix = hadSuffix ? BRAND_SUFFIX : "";
  const budget = max - suffix.length;

  const fits = () => base.length <= budget;
  const attempt = (label: string, next: string) => {
    const cleaned = tidy(next);
    if (cleaned && cleaned !== base) {
      base = cleaned;
      steps.push(label);
    }
  };

  if (fits()) return { value: original, steps, truncated: false };

  attempt("tidy", tidy(base));
  if (fits()) return { value: base + suffix, steps, truncated: false };

  attempt("trademark", stripTrademarks(base));
  if (fits()) return { value: base + suffix, steps, truncated: false };

  attempt("dimensions", stripDimensions(base));
  if (fits()) return { value: base + suffix, steps, truncated: false };

  attempt("ampersand", base.replace(/\band\b/gi, "&"));
  if (fits()) return { value: base + suffix, steps, truncated: false };

  attempt("filler", dropFiller(base));
  if (fits()) return { value: base + suffix, steps, truncated: false };

  if (!options.keepWithClause) {
    attempt("with-clause", dropWithClause(base));
    if (fits()) return { value: base + suffix, steps, truncated: false };
  }

  // Drop leading collection names. Capped at two, because they are one or two
  // words. A word immediately before a head noun is part of that noun phrase —
  // "Water" in "Water Feature" — and stops the loop, which is what keeps
  // "Grand Water Feature" from becoming "Feature".
  let dropped = 0;
  while (!fits() && dropped < 2) {
    const words = base.split(" ");
    if (words.length <= 5) break;
    if (isProtected(words[0]!)) break;
    const next = words[1]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
    if (HEAD_NOUNS.has(next)) break;
    base = words.slice(1).join(" ");
    dropped += 1;
  }
  if (dropped) steps.push(`drop-leading:${dropped}`);
  if (fits()) return { value: base + suffix, steps, truncated: false };

  // Last resort, and the only step that can cost the head noun.
  const source = base.split(" ");
  const words = [...source];
  const normalise = (word: string | undefined) =>
    (word ?? "").toLowerCase().replace(/[^a-z&]/g, "");

  while (words.length > 1 && words.join(" ").length > budget) words.pop();

  let cleaning = true;
  while (cleaning && words.length > 1) {
    cleaning = false;
    const last = normalise(words[words.length - 1]);

    // A preposition or conjunction cannot end a title.
    if (DANGLING.has(last)) {
      words.pop();
      cleaning = true;
      continue;
    }

    // Never split a compound head noun. "Table Lamp" cut to "Table" does not
    // shorten the product, it renames it into a different one.
    const nextInSource = normalise(source[words.length]);
    if (HEAD_NOUNS.has(last) && HEAD_NOUNS.has(nextInSource)) {
      words.pop();
      cleaning = true;
      continue;
    }

    // "Crystal Ball & Water" — the conjunction's second half was cut off, so
    // drop the orphan and the conjunction with it.
    if (words.length > 2 && DANGLING.has(normalise(words[words.length - 2]))) {
      words.pop();
      words.pop();
      cleaning = true;
    }
  }

  const cut = tidy(words.join(" "))
    .replace(/[,;:\-–—]$/, "")
    .trim();

  // Better to leave Google truncating a correct title than to publish a
  // fragment that no longer names the product.
  if (!cut || !hasHeadNoun(cut) || cut.length > budget) {
    return { value: original, steps, truncated: false, unsafe: true };
  }

  steps.push("truncate");
  return { value: cut + suffix, steps, truncated: true };
}
