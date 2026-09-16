/**
 * Kaiku's categories mapped onto Google's product taxonomy.
 *
 * `google_product_category` tells Merchant Center which auction a product
 * belongs in. Left unset, Google classifies the item itself from its title and
 * description — usually adequately, sometimes not, and never visibly. Setting
 * it is the difference between competing against other fire pits and competing
 * against whatever Google decided a "fire pit" most resembles.
 *
 * Every path below is copied verbatim from Google's published taxonomy
 * (`taxonomy-with-ids.en-GB.txt`, version 2021-09-21) rather than written from
 * memory, because a path that does not exactly match a real node is simply
 * ignored, and a path that matches the *wrong* node is worse than sending
 * nothing at all.
 *
 * **Deliberately incomplete, and that is the point.** Four categories are left
 * unmapped because they hold genuinely mixed products, and Google's own
 * auto-classification — which reads each product's title individually — beats
 * one blanket category that is right for most of a range and wrong for the
 * rest. A wrong category enters a product in the wrong auction; an absent one
 * just leaves Google to do what it was already doing.
 *
 *   kitchen-furniture            dining tables, dining chairs and sets, mixed
 *   rustic-reclaimed-furniture   sideboards, dining, coffee, TV, bedside, chests
 *   pergolas                     mappable to 703, but the standing constraint
 *                                says never edit this category — flagged for
 *                                Damien rather than decided here
 *   outdoor-kitchens             only three products; check them before mapping
 */

/**
 * Category slug → Google taxonomy path. Absent means "let Google classify it",
 * which is a decision, not an oversight — see the note above.
 */
const GOOGLE_PRODUCT_CATEGORY_BY_SLUG: Record<string, string> = {
  // Bathroom
  "bathroom-accessories": "Home & Garden > Bathroom Accessories",
  "bathroom-storage": "Furniture > Cabinets & Storage",
  "bathroom-mirrors": "Home & Garden > Decor > Mirrors",
  "bathroom-lighting": "Home & Garden > Lighting",
  "towel-rails": "Home & Garden > Bathroom Accessories > Towel Racks & Holders",

  // Bedroom. No "Nightstands" node exists in this taxonomy version, so bedside
  // tables take the accent-table node they genuinely belong to.
  "bedside-tables": "Furniture > Tables > Accent Tables > End Tables",
  beds: "Furniture > Beds & Accessories > Beds & Bed Frames",
  "bedroom-lighting": "Home & Garden > Lighting > Lamps",
  "bedroom-storage": "Furniture > Cabinets & Storage",
  "bedroom-mirrors": "Home & Garden > Decor > Mirrors",

  // Wellness. Google has no cold-plunge node, so the Pool & Spa parent is the
  // most specific honest answer.
  "cold-plunges": "Home & Garden > Pool & Spa",
  "outdoor-saunas": "Home & Garden > Pool & Spa > Saunas",
  "indoor-saunas": "Home & Garden > Pool & Spa > Saunas",
  "wellness-accessories": "Home & Garden > Pool & Spa > Sauna Accessories",

  // Decor
  mirrors: "Home & Garden > Decor > Mirrors",
  "wall-clocks": "Home & Garden > Decor > Clocks > Wall Clocks",
  vases: "Home & Garden > Decor > Vases",
  "candles-and-lanterns": "Home & Garden > Decor > Candles & Home Fragrances",
  "wall-art":
    "Home & Garden > Decor > Artwork > Posters, Prints & Visual Artwork",
  "christmas-trees": "Home & Garden > Decor > Seasonal & Holiday Decorations",
  "christmas-decorations":
    "Home & Garden > Decor > Seasonal & Holiday Decorations",

  // Kitchen
  "kitchen-storage": "Furniture > Cabinets & Storage",
  "kitchen-lighting": "Home & Garden > Lighting > Lamps",
  "kitchen-shelving": "Furniture > Shelving",

  // Lighting. The parent, not "> Lamps": this category holds chandeliers and
  // pendants as well as floor and table lamps, and the parent is correct for
  // all of them where the Lamps node would be wrong for half.
  lighting: "Home & Garden > Lighting",

  // Living room
  "living-room-storage": "Furniture > Cabinets & Storage",
  sofas: "Furniture > Sofas",
  "console-tables": "Furniture > Tables > Accent Tables > Sofa Tables",
  "side-tables": "Furniture > Tables > Accent Tables > End Tables",
  "coffee-tables": "Furniture > Tables > Accent Tables > Coffee Tables",
  "living-room-lighting": "Home & Garden > Lighting > Lamps",
  shelving: "Furniture > Shelving",
  "tv-units": "Furniture > Cabinets & Storage > Media Storage Cabinets & Racks",
  rugs: "Home & Garden > Decor > Rugs",

  // Office
  desks: "Furniture > Office Furniture > Desks",
  "office-storage": "Furniture > Cabinets & Storage",
  "office-shelving": "Furniture > Shelving",
  "office-lighting": "Home & Garden > Lighting > Lamps",

  // Outdoor living
  planters: "Home & Garden > Lawn & Garden > Gardening > Pots & Planters",
  "garden-furniture": "Furniture > Outdoor Furniture",
  "water-features":
    "Home & Garden > Decor > Fountains & Ponds > Fountains & Waterfalls",
  // No fire-pit node exists in this taxonomy version. Patio Heaters is where
  // fire pits, chimineas and patio heaters are all classified, and this
  // category is named "Fire Pits & Heating" for exactly that range.
  "fire-pits":
    "Home & Garden > Household Appliances > Climate Control Appliances > Patio Heaters",
  "garden-lighting": "Home & Garden > Lighting > Landscape Pathway Lighting",
  // Checked against the products rather than the category name: every one is a
  // decorative metal garden screen or climbing trellis, not an indoor divider.
  "privacy-screens":
    "Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Garden Arches, Trellises, Arbours & Pergolas",
  "outdoor-storage": "Furniture > Outdoor Furniture > Outdoor Storage Boxes",
  // Named "Outdoor Kitchens" but both products are gas barbecues, so this is
  // the appliance path rather than an outdoor-structure one. Checked against
  // the products, not the category name.
  "outdoor-kitchens":
    "Home & Garden > Kitchen & Dining > Kitchen Appliances > Outdoor Grills",
  // Seven products, and most are gazebos or canopy pergolas rather than the
  // open timber kind, so "Canopies & Gazebos" fits the range better than the
  // arches-and-trellises path used for privacy screens.
  pergolas:
    "Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopies & Gazebos",
};

/**
 * Categories holding more than one kind of thing, resolved per product.
 *
 * "Kitchen > Furniture" is 65 products and is mostly dining tables, but it also
 * holds dining chairs and a stool. One category-level path would label every
 * chair a table, and a wrong classification is worse than none: Google matches
 * the item to queries for the thing it was told the item is.
 *
 * Tested against the product title in order, first match wins. Anything that
 * matches nothing falls through to null, which lets Google classify it — a
 * better outcome than a confident mistake.
 */
const BY_TITLE_WITHIN_CATEGORY: Record<
  string,
  { match: RegExp; path: string }[]
> = {
  "kitchen-furniture": [
    {
      // `armchair` is spelled out because `\bchair\b` cannot match inside it —
      // there is no word boundary between "arm" and "chair". That one missing
      // word left "Java Natural Rattan With Black Metal Armchair" with no
      // Google category at all.
      match:
        /\bdining chair|\barmchair\b|\bchair\b|\bstool\b|\bbench\b|\bseat\b/i,
      path: "Furniture > Chairs > Kitchen & Dining Room Chairs",
    },
    {
      match: /\bdining table|\btable\b/i,
      path: "Furniture > Tables > Kitchen & Dining Room Tables",
    },
  ],
  /**
   * The Reclaimed Collection is a department, not a product type.
   *
   * Twenty products sat in it with no Google category, because the slug is in
   * neither map and the collection genuinely spans sideboards, dining tables,
   * coffee tables, TV stands, bedside tables, chests, shelving and a beer
   * barrel. There is no single path that is true of all of them.
   *
   * Ordered most specific first. Five products are deliberately left to fall
   * through — the beer barrel table, the storage stool, the plant stands and
   * the storage tub and crates. Nothing in Google's taxonomy fits them
   * cleanly, and this file's own rule is that a null beats a confident
   * mistake: Google classifies it itself rather than being told something
   * wrong.
   */
  "rustic-reclaimed-furniture": [
    {
      match: /\bcoffee table\b/i,
      path: "Furniture > Tables > Accent Tables > Coffee Tables",
    },
    {
      match: /\btv stand\b|\bmedia unit\b|\btv unit\b/i,
      path: "Furniture > Cabinets & Storage > Media Storage Cabinets & Racks",
    },
    {
      match: /\bbedside table\b|\bside table\b/i,
      path: "Furniture > Tables > Accent Tables > End Tables",
    },
    {
      match: /\bconsole table\b|\bsideboard\b/i,
      path: "Furniture > Tables > Accent Tables > Sofa Tables",
    },
    {
      match: /\bdining table\b/i,
      path: "Furniture > Tables > Kitchen & Dining Room Tables",
    },
    {
      match: /\bshelf\b|\bshelving\b|\bdisplay unit\b|\bdisplay stand\b/i,
      path: "Furniture > Shelving",
    },
    {
      match: /\bchest of\b.*\bdrawers\b/i,
      path: "Furniture > Cabinets & Storage",
    },
  ],
};

/**
 * The Google taxonomy path for a category slug, or null to let Google
 * classify the product itself.
 */
export function googleProductCategory(
  categorySlug: string | null | undefined,
  title?: string | null,
): string | null {
  if (!categorySlug) return null;
  // A mixed category is resolved from the product's own name before falling
  // back to the category-wide path.
  const rules = BY_TITLE_WITHIN_CATEGORY[categorySlug];
  if (rules && title) {
    for (const rule of rules) if (rule.match.test(title)) return rule.path;
  }
  return GOOGLE_PRODUCT_CATEGORY_BY_SLUG[categorySlug] ?? null;
}

/** Exposed for the coverage test, which asserts the map stays honest. */
export const MAPPED_CATEGORY_SLUGS = Object.keys(
  GOOGLE_PRODUCT_CATEGORY_BY_SLUG,
);
