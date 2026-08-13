/**
 * The canonical filter vocabulary — the tag strings the catalogue is allowed to
 * carry, shared by the Studio schema, the storefront filters and the derivation
 * script.
 *
 * One list, three consumers. Without it the values drift: the script writes
 * "Grey", an editor types "Gray" in Studio, the filter UI looks for "grey", and
 * a shopper filtering for grey furniture is told there is none. Studio validates
 * against these lists, the filter bar is built from them, and a test in
 * scripts/lib/product-tags.test.ts asserts the derivation can only emit tags
 * that appear here.
 *
 * Order is deliberate — it is the order facets render in. Colours run dark to
 * light then warm to cool, because a swatch row is scanned visually rather than
 * read alphabetically.
 */

/**
 * Colours, each with the hex the swatch circle is painted in.
 *
 * The hexes are approximations of the finishes, not brand-accurate colour
 * matching: they exist so a shopper can find the row they want at a glance. Oak
 * and Walnut are in here because the catalogue genuinely sells them as colour
 * choices — `options` on the furniture literally reads `Colour: Brown | Oak`.
 */
export const COLOUR_FACETS = [
  { tag: "Black", hex: "#1a1a1a" },
  { tag: "Grey", hex: "#8a8a8a" },
  { tag: "White", hex: "#f6f5f2" },
  // A wash is a finish, not a colour: the timber grain shows through a limed
  // white where a painted white hides it. They are different products on the
  // shelf, so they are different tags here — folding them together would answer
  // a White filter with a whitewashed photograph.
  { tag: "Whitewash", hex: "#e5ded1" },
  { tag: "Ivory", hex: "#efe8d8" },
  { tag: "Cream", hex: "#e8dfc9" },
  { tag: "Taupe", hex: "#b3a394" },
  { tag: "Brown", hex: "#6b4a34" },
  { tag: "Natural", hex: "#d8c8ac" },
  { tag: "Neutral", hex: "#cfc6b8" },
  { tag: "Oak", hex: "#c19a63" },
  { tag: "Walnut", hex: "#5b3a26" },
  { tag: "Green", hex: "#4f6152" },
  { tag: "Greenwash", hex: "#a6b3a0" },
  { tag: "Blue", hex: "#3c4f68" },
  { tag: "Bluewash", hex: "#9fb0bd" },
  { tag: "Aqua", hex: "#6fa8a3" },
  { tag: "Gold", hex: "#c9a24a" },
  { tag: "Brass", hex: "#b08d4f" },
  { tag: "Bronze", hex: "#7d5c39" },
] as const;

export const COLOUR_TAGS: readonly string[] = COLOUR_FACETS.map((c) => c.tag);

/** Hex for a colour tag, or null when the tag is not one we hold a swatch for. */
export function colourSwatch(tag: string): string | null {
  return COLOUR_FACETS.find((c) => c.tag === tag)?.hex ?? null;
}

/**
 * Materials, grouped so the filter can show "Wood" as a heading rather than
 * eleven timber species in one flat list. A product tagged with a species is
 * not automatically tagged "Wood" — the group is a UI concern, and rolling it
 * up in the data would make "Wood" match everything and mean nothing.
 */
export const MATERIAL_GROUPS = [
  {
    group: "Wood",
    tags: [
      "Oak",
      "Walnut",
      "Teak",
      "Birch",
      "Spruce",
      "Hemlock",
      "Cedar",
      "Bamboo",
      "Albasia wood",
      "Gamal wood",
      "Tamarind wood",
      "Reclaimed wood",
      "Painted wood",
      "Wood",
      "MDF",
    ],
  },
  {
    group: "Stone & glass",
    tags: ["Marble", "Glass", "Mirrored glass", "Concrete", "Faux concrete"],
  },
  { group: "Metal", tags: ["Steel", "Metal", "Brass"] },
  {
    group: "Fabric",
    tags: ["Chenille", "Bouclé", "Linen", "Velvet", "Fabric"],
  },
  {
    group: "Other",
    tags: [
      "Rattan",
      "Gesso",
      "Faux shagreen",
      "Resin",
      "High gloss",
      "Himalayan salt",
    ],
  },
] as const;

export const MATERIAL_TAGS: readonly string[] = MATERIAL_GROUPS.flatMap(
  (g) => g.tags,
);

export const STYLE_TAGS = [
  "Modern",
  "Minimal",
  "Industrial",
  "Rustic",
  "Scandinavian",
  "Art Deco",
  "Coastal",
  "Traditional",
] as const;

/**
 * Rooms. These are the shopper's word for a space, not the site's departments —
 * Outdoor Living and Outdoor Kitchen are both "Garden" here, and Lighting and
 * Cold Plunge are departments that name no room at all.
 */
export const ROOM_TAGS = [
  "Living room",
  "Bedroom",
  "Kitchen",
  "Office",
  "Bathroom",
  "Garden",
  "Sauna",
] as const;

/** What the thing is for — the brief's "product type". */
export const USE_TAGS = [
  "Seating",
  "Coffee table",
  "Side table",
  "Console",
  "Bedside table",
  "Dining",
  "Desk",
  "Storage",
  "Shelving",
  "TV unit",
  "Mirror",
  "Lighting",
  "Planter",
  "Sauna",
  "Cold plunge",
  "Outdoor cooking",
  "Water feature",
  "Wellness",
] as const;

/** Every facet the storefront can filter on, in the order they render. */
export const FACET_DEFINITIONS = [
  { key: "colour", label: "Colour", tags: COLOUR_TAGS },
  { key: "material", label: "Material", tags: MATERIAL_TAGS },
  { key: "style", label: "Style", tags: STYLE_TAGS as readonly string[] },
  { key: "room", label: "Room", tags: ROOM_TAGS as readonly string[] },
  { key: "type", label: "Product type", tags: USE_TAGS as readonly string[] },
] as const;

export type FacetKey = (typeof FACET_DEFINITIONS)[number]["key"];

/**
 * Maps a gallery image's `optionValue` onto a colour tag.
 *
 * The two are not the same vocabulary and cannot be compared directly. The
 * catalogue's option values are the supplier's words — `Whitewash`,
 * `Greenwash`, `Bluewash`, `Natural Wood`, `Sky Blue`, `Whitewashed`, `Classic`
 * — and several carry a trailing space (`"Ivory "`, `"White "`), the same stray
 * whitespace that has already been found on the SKUs and the delivery lead
 * times.
 *
 * So exact matching would have failed silently: the variant-image swap would
 * simply never fire, and it would look like a feature nobody had noticed was
 * broken. Trim first, then alias.
 *
 * Returns null for a value that names no colour — `Classic` is a finish name,
 * not a colour, and guessing at it would put the wrong photograph on a card.
 */
/**
 * The rule, because the catalogue's 24 distinct colour values do not divide the
 * way a naive alias table assumes.
 *
 * **A finish technique keeps its own tag.** Whitewash, Greenwash and Bluewash
 * are washes over timber — the grain shows through — and they are not the solid
 * White, Green and Blue. An earlier version of this file folded them together,
 * which would have answered a White filter with a whitewashed photograph. They
 * are different products on the shelf.
 *
 * **A named shade folds into its family.** Pigeon Grey is a grey and Sky Blue is
 * a blue; somebody filtering Grey wants the pigeon-grey chest included, and
 * giving every paint name its own swatch would produce a filter row nobody can
 * scan.
 *
 * **A compound value contributes only its colour.** "Ivory Shagreen" is ivory;
 * the shagreen is a material and materials are their own facet.
 *
 * **A value naming no colour maps to nothing.** "Classic" is a finish name. A
 * guess here puts the wrong photograph on a card, which is worse than the
 * default.
 */
const OPTION_VALUE_ALIASES: Record<string, string> = {
  // Spelling variants of the same finish.
  whitewashed: "Whitewash",
  greenwashed: "Greenwash",
  bluewashed: "Bluewash",

  // Named shades, folded into the family a shopper would filter by.
  "pigeon grey": "Grey",
  "slate grey": "Grey",
  gray: "Grey",
  "sky blue": "Blue",
  navy: "Blue",
  turquoise: "Aqua",
  sage: "Green",
  "off white": "White",
  "natural wood": "Natural",
  chocolate: "Brown",
  "chocolate brown": "Brown",
  golden: "Gold",

  // Colour plus material. The material is a separate facet.
  "ivory shagreen": "Ivory",
  "grey shagreen": "Grey",
  "brown shagreen": "Brown",
};

export function colourTagForOptionValue(value: string): string | null {
  const cleaned = value.trim().toLowerCase();
  if (!cleaned) return null;

  const aliased = OPTION_VALUE_ALIASES[cleaned];
  if (aliased) return aliased;

  return COLOUR_TAGS.find((tag) => tag.toLowerCase() === cleaned) ?? null;
}
