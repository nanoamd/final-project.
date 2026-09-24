/**
 * Which products are the same thing in a different colour or size.
 *
 * ## What this is for
 *
 * The feed sent no `item_group_id` at all — zero of 908. Google therefore
 * treated the three Canyon soap dishes (black, grey, white) as three unrelated
 * products, and the four Freska jars (250ml, 550ml, 800ml, 1100ml) as four.
 * Two costs follow from that:
 *
 * 1. **They compete with each other.** Google picks one result per merchant
 *    for a query, so three near-identical listings split whatever authority
 *    the family has instead of pooling it.
 * 2. **No variant picker.** Grouped items show as one product with colour or
 *    size options, which is both a better listing and a bigger one.
 *
 * ## The rule, and why it is deliberately narrow
 *
 * Two products are variants when they are **in the same category, from the
 * same supplier, and have identical titles once the variant words are taken
 * out**. Colour, finish, material and size are the attributes Google itself
 * allows a group to vary on, so those are the words stripped.
 *
 * Over-grouping is worse than under-grouping. Telling Google a console table
 * and a dining table are the same product in two sizes invites a disapproval
 * and confuses a real shopper, while missing a family costs only the grouping
 * we never had. So the comparison is exact-match on the remainder, not fuzzy,
 * and the supplier has to match too — two suppliers selling a "Grey Velvet
 * Sofa" are selling two different sofas.
 *
 * A family of one is not a family: `item_group_id` is only emitted where at
 * least two products share a stem.
 */

/**
 * Words a variant may differ by, which are therefore removed before comparing.
 *
 * Colours and finishes first, then the materials that function as finishes in
 * this catalogue — an oak and a walnut version of one table are variants, and
 * Google lists material among the permitted variant attributes.
 *
 * Multi-word entries come before their own single words so "french grey"
 * cannot be half-stripped into "french".
 */
const VARIANT_WORDS = [
  "french grey",
  "putty grey",
  "grey wash",
  "white wash",
  "whitewash",
  "antique white",
  "warm white",
  "off white",
  "black",
  "white",
  "grey",
  "gray",
  "cream",
  "ivory",
  "natural",
  "oak",
  "walnut",
  "mango",
  "teak",
  "pine",
  "elm",
  "acacia",
  "rattan",
  "bamboo",
  "linen",
  "velvet",
  "chenille",
  "boucle",
  "bouclé",
  "brass",
  "gold",
  "silver",
  "chrome",
  "nickel",
  "bronze",
  "copper",
  "green",
  "blue",
  "pink",
  "mauve",
  "brown",
  "beige",
  "sand",
  "peach",
  "charcoal",
  "mink",
  "putty",
  "emerald",
  "navy",
  "terracotta",
  "stone",
  "slate",
  "sage",
];

/** Sizes and capacities a variant may differ by: 250ml, 180cm, 4ft6, 3 seater. */
const SIZE_PATTERNS: RegExp[] = [
  /\b\d+(?:\.\d+)?\s?(?:ml|l|cl|cm|mm|m|kg|g)\b/g,
  /\b\d+ft\d*\b/g,
  /\b\d+\s?(?:seat|seater|person|tier|drawer|door|bulb|light|piece|pcs)\b/g,
  /\b(?:single|double|king|super king|superking|queen|twin)\b/g,
  /\b(?:small|medium|large|tall|mini|extra large|xl)\b/g,
];

export interface VariantCandidate {
  /** Feed id — whatever will be emitted as `g:id`. */
  id: string;
  title: string;
  /** Category slug. Two products in different categories are never grouped. */
  category: string | null;
  /** Supplier name. Two suppliers' "grey velvet sofa" are different sofas. */
  supplier: string | null;
}

/**
 * The comparable remainder of a title: lowercased, variant words and sizes
 * removed, punctuation and the brand suffix dropped, whitespace collapsed.
 *
 * Exported for the tests, and because seeing the stem is the only way to
 * judge whether a grouping is right.
 */
export function variantStem(title: string): string {
  let stem = title
    .toLowerCase()
    .replace(/\s*\|\s*kaiku\s*$/, "")
    // An em-dash suffix is how colour is written on some titles:
    // "Glass Candle Holder — White".
    .replace(/\s*[—–-]\s*/g, " ");

  for (const word of VARIANT_WORDS) {
    stem = stem.replace(new RegExp(`\\b${word}\\b`, "g"), " ");
  }
  for (const pattern of SIZE_PATTERNS) {
    stem = stem.replace(pattern, " ");
  }

  return stem
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A short, stable id for a family key.
 *
 * **Not the truncated key**, which is how the first version of this shipped a
 * bug to the verification step: Google caps `item_group_id` at 50 characters,
 * and cutting the key there merged families whose first 50 characters matched.
 * `…::canyon tumbler` and `…::canyon toothbrush holder` both became
 * `bathroom-accessories::Premier Housewares::canyon t`, so a tumbler and a
 * toothbrush holder were declared the same product in two finishes. The same
 * collision put a table lamp with a floor lamp, and the Yorkshire Cabin sauna
 * with the Bronte.
 *
 * It is exactly the failure the `g:id` comment in the feed already warns
 * about — truncating an identifier to fit a limit collides the things it is
 * supposed to keep apart — which is a good argument for reading the warnings
 * already written down.
 *
 * FNV-1a over the whole key, base 36. Deterministic, so the id survives a
 * rebuild; Google remembers a grouping and a changing id would re-split the
 * family on every fetch.
 */
function familyId(key: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `kg-${hash.toString(36)}`;
}

/**
 * Maps each product id to its `item_group_id`, for products that have one.
 *
 * Products with no sibling are absent from the map entirely — there is no
 * such thing as a group of one, and emitting one would be noise.
 */
export function variantGroups(
  products: VariantCandidate[],
): Map<string, string> {
  const families = new Map<string, VariantCandidate[]>();

  for (const product of products) {
    const stem = variantStem(product.title);
    // A title that is *entirely* variant words leaves nothing to compare on.
    // "Black" and "White" are not two colours of the same product.
    if (stem.length < 4) continue;
    const key = `${product.category ?? "?"}::${product.supplier ?? "?"}::${stem}`;
    const family = families.get(key);
    if (family) family.push(product);
    else families.set(key, [product]);
  }

  const groups = new Map<string, string>();
  for (const [key, members] of families) {
    if (members.length < 2) continue;
    const groupId = familyId(key);
    for (const member of members) groups.set(member.id, groupId);
  }
  return groups;
}
