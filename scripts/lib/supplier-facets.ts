/**
 * The site's own colour and material vocabularies (src/lib/catalog/facets.ts) are
 * closed lists, shared by the Studio schema and the storefront filter bar. Every
 * supplier — Hill Interiors, Viva Rugs, whoever comes next — describes a product in
 * its own words, and this is the one place those words get translated into ours.
 *
 * The rule throughout is "an empty swatch is better than a wrong one" (see
 * src/lib/catalog/facets.ts): a word with no honest home is left unmapped rather than
 * forced onto the nearest tag, so a shopper filtering Grey is never shown a chrome
 * lamp and a shopper filtering Rattan is never shown a resin lounger wearing a
 * rattan-effect weave.
 */
/**
 * Supplier colour word → the canonical colour tag, or null.
 *
 * `primaryColour` and `colourTags` are **closed vocabularies** (see
 * src/lib/catalog/facets.ts): 20 values shared by the Studio schema, the storefront
 * filter bar and the derivation script. Writing "beige" or "silver" straight through
 * would fail Studio validation and, worse, put a value in the filter bar that no
 * shopper can match — the schema's own words are "an empty swatch is better than a
 * wrong one".
 *
 * So anything without an honest home is left out rather than forced. `silver` has no
 * entry because the vocabulary has Gold, Brass and Bronze but no silver or chrome;
 * calling a chrome lamp Grey would answer a Grey filter with a mirror finish. `clear`
 * is not a colour at all.
 */
export const COLOUR_MAP: Record<string, string | null> = {
  black: "Black",
  grey: "Grey",
  gray: "Grey",
  white: "White",
  ivory: "Ivory",
  cream: "Cream",
  taupe: "Taupe",
  brown: "Brown",
  natural: "Natural",
  neutral: "Neutral",
  // Beige is the supplier's most common value and sits between Cream and Taupe.
  // Neutral exists in the vocabulary for exactly this: a warm off-white that is not
  // committing to either.
  beige: "Neutral",
  // Coffee is a brown, and Brown is in the vocabulary.
  coffee: "Brown",
  oak: "Oak",
  walnut: "Walnut",
  green: "Green",
  blue: "Blue",
  gold: "Gold",
  brass: "Brass",
  bronze: "Bronze",
  "antique bronze": "Bronze",
  // Compound descriptors the supplier writes as one value rather than two words —
  // this map does an exact-string lookup, not a word scan, so "light grey" needs its
  // own entry or it falls through as unmapped even though "grey" alone would match.
  "light grey": "Grey",
  "light blue": "Blue",
  "antique white": "Ivory",
  // Sage green found its way into the vocabulary as plain Green rather than a new
  // sage-specific tag — see scripts/fix-french-grey-and-stool.ts, which retagged five
  // "French Grey" products the same way after finding they were photographed sage
  // green rather than grey.
  sage: "Green",
  silver: null,
  chrome: null,
  clear: null,
  red: null,
  pink: null,
  yellow: null,
  orange: null,
  purple: null,
  multi: null,
};

/**
 * Supplier material word → the canonical material tag, or null.
 *
 * Two deliberate omissions. `plastic` has no entry: the vocabulary does not carry it,
 * and a plastic garden table is not Wood or Metal. `synthetic fibres` has none either
 * — it is the supplier's term for the rattan-effect weave on the outdoor sets, and the
 * Materials field says in its own description that a material the piece only imitates
 * is excluded. Tagging those Rattan would be the exact mistake the field warns about.
 *
 * `ceramic` is missing from the vocabulary rather than from this map, which is worth
 * knowing: a good number of the lamps are ceramic and currently cannot be tagged at
 * all. That is a gap to add to facets.ts, not something to fudge here.
 */
export const MATERIAL_MAP: Record<string, string | null> = {
  wood: "Wood",
  oak: "Oak",
  walnut: "Walnut",
  teak: "Teak",
  birch: "Birch",
  bamboo: "Bamboo",
  metal: "Metal",
  steel: "Steel",
  brass: "Brass",
  glass: "Glass",
  marble: "Marble",
  concrete: "Concrete",
  linen: "Linen",
  velvet: "Velvet",
  fabric: "Fabric",
  chenille: "Chenille",
  resin: "Resin",
  rattan: "Rattan",
  mdf: "MDF",
  // Present in MATERIAL_GROUPS and missed on the first pass.
  "mirrored glass": "Mirrored glass",
  // Added to facets.ts after this script's dry run reported them as unmapped.
  plastic: "Plastic",
  ceramic: "Ceramic",
  stoneware: "Stoneware",
  // Added for the rugs range (scripts/lib/viva-rugs.ts) — cotton was null here until
  // then, because nothing in the furniture range needed it to be a first-class tag.
  // It applies equally to any Hill item that lists cotton, which is the correct
  // outcome rather than a side effect.
  cotton: "Cotton",
  wool: "Wool",
  polypropylene: "Polypropylene",
  polyester: "Polyester",
  // Still null, and deliberately. "Synthetic fibres" is the supplier's term for the
  // rattan-effect weave on the outdoor sets, and the Materials field excludes a
  // material the piece only imitates. Rope has no canonical home.
  "synthetic fibres": null,
  "synthetic fibre": null,
  rope: null,
  stone: null,
  paper: null,
  wax: null,
  jute: null,
};

export const mapColour = (value?: string): string | null =>
  value ? (COLOUR_MAP[value.trim().toLowerCase()] ?? null) : null;

export const mapMaterials = (value?: string): string[] =>
  value
    ? [
        ...new Set(
          value
            .split(/,\s*/)
            .map((part) => MATERIAL_MAP[part.trim().toLowerCase()] ?? null)
            .filter((tag): tag is string => Boolean(tag)),
        ),
      ]
    : [];
