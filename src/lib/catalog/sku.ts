/**
 * Kaiku's product code format — one shape for the whole catalogue, so a code
 * can be read at a glance and typed into a search without ambiguity.
 *
 * Damien: "everything needs an sku made in a certain format making products
 * easy to identify".
 *
 *     KK-CT-ABBERLEY-BRN-001
 *     │  │  │        │   └── sequence, breaks ties between otherwise-identical codes
 *     │  │  │        └────── colour, 3 letters, omitted when the product has none
 *     │  │  └─────────────── the product's own distinctive name word(s)
 *     │  └────────────────── category code, from CATEGORY_CODES below
 *     └───────────────────── Kaiku, fixed
 *
 * The shape is not invented here: `KK-CT-ABB-BRN-001` is the format Damien
 * already used on the D.I. Designs range and `KK-SA-SP-003` on the saunas, and
 * it is the most deliberate of the six formats currently in the catalogue (the
 * others include bare supplier codes like `24456`, `HIL-23674`, and
 * `AW-ACShop-01` alongside `AW-ACSHOP-08` — the same scheme with inconsistent
 * case). This extends the good one rather than replacing it, with the name
 * segment allowed to run longer than three letters, because `ABB` is not
 * actually identifiable at a glance and `ABBERLEY` is.
 *
 * **Nothing here reads the supplier.** A code identifies the product to Kaiku
 * and to a customer reading it on an order; the supplier's own code lives in
 * `supplierSku` and is what a re-import and a reorder match on (see the field's
 * note in src/sanity/schemaTypes/documents/product.ts). Putting the supplier in
 * the customer-facing code would also mean the code changes if the same piece
 * is ever bought from someone else, which is exactly what a stable identifier
 * must not do.
 */

/**
 * Category slug → code. Two to four letters, chosen to stay distinct when
 * read aloud or scanned in a list: `BEDT` for bedside-tables against `BEDS`
 * for bedroom-storage, `CT` for coffee-tables (already in use), `CONT` for
 * console-tables.
 *
 * A slug missing from this map gets a code derived from its own initials
 * instead (see `categoryCode`), so a category added in Studio tomorrow still
 * produces a valid SKU without a code change — it just gets a less
 * hand-tuned abbreviation.
 */
const CATEGORY_CODES: Record<string, string> = {
  "bathroom-accessories": "BATA",
  "bathroom-lighting": "BATL",
  "bathroom-mirrors": "BATM",
  "bathroom-storage": "BATS",
  "bedroom-lighting": "BEDL",
  "bedroom-mirrors": "BEDM",
  "bedroom-storage": "BEDS",
  "bedside-tables": "BEDT",
  "candles-and-lanterns": "CAND",
  "christmas-decorations": "XMSD",
  "christmas-trees": "XMST",
  "coffee-tables": "CT",
  "cold-plunges": "CP",
  "console-tables": "CONT",
  desks: "DESK",
  "fire-pits": "FIRE",
  "garden-furniture": "GARF",
  "garden-lighting": "GARL",
  "indoor-saunas": "SAIN",
  "kitchen-furniture": "KITF",
  "kitchen-lighting": "KITL",
  "kitchen-shelving": "KITH",
  "kitchen-storage": "KITS",
  lighting: "LT",
  "living-room-lighting": "LIVL",
  "living-room-storage": "LIVS",
  mirrors: "MIR",
  "office-lighting": "OFFL",
  "office-shelving": "OFFH",
  "office-storage": "OFFS",
  "outdoor-kitchens": "OUTK",
  "outdoor-saunas": "SA",
  "outdoor-storage": "OUTS",
  pergolas: "PERG",
  planters: "PLNT",
  "privacy-screens": "SCRN",
  rugs: "RUG",
  "rustic-reclaimed-furniture": "RECL",
  shelving: "SHLV",
  "side-tables": "ST",
  sofas: "SOFA",
  "towel-rails": "TWLR",
  "tv-units": "TV",
  vases: "VASE",
  "wall-art": "ART",
  "wall-clocks": "CLK",
  "water-features": "WATR",
  "wellness-accessories": "WELL",
};

/** Canonical colour → 3-letter code, covering src/lib/catalog/facets.ts. */
const COLOUR_CODES: Record<string, string> = {
  Black: "BLK",
  Grey: "GRY",
  White: "WHT",
  Ivory: "IVY",
  Cream: "CRM",
  Neutral: "NTL",
  Taupe: "TPE",
  Brown: "BRN",
  Natural: "NAT",
  Oak: "OAK",
  Walnut: "WAL",
  Green: "GRN",
  Blue: "BLU",
  Gold: "GLD",
  Brass: "BRS",
  Bronze: "BRZ",
};

/**
 * Words that appear in so many product titles that they identify nothing —
 * stripped before picking the name segment, so "Large Reclaimed Wood Coffee
 * Table" yields RECLAIMED rather than LARGE.
 *
 * Kept deliberately short: only words that are either a size, a material
 * already implied by the category, or the category's own noun. Anything more
 * aggressive risks stripping the one word that distinguishes two products.
 */
const NAME_NOISE = new Set([
  "the",
  "a",
  "an",
  "and",
  "with",
  "in",
  "of",
  "for",
  "small",
  "medium",
  "large",
  "mini",
  "giant",
  "xl",
  "set",
  "pair",
  "piece",
  "collection",
  "range",
  // Category nouns and their qualifiers: the code already carries a category
  // segment, so repeating it in the name segment spends characters saying
  // nothing ("KK-CT-COFFEE-..." tells you coffee table twice).
  "table",
  "tables",
  "coffee",
  "side",
  "end",
  "bedside",
  "occasional",
  "dining",
  "console",
  "nest",
  "nesting",
  "lamp",
  "mirror",
  "clock",
  "vase",
  "planter",
  "chair",
  "sofa",
  "seater",
  "stool",
  "footstool",
  "bench",
  "shelf",
  "shelving",
  "unit",
  "cabinet",
  "chest",
  "drawers",
  "drawer",
  "desk",
  "sideboard",
  "stand",
  "holder",
  "lantern",
  "candle",
  "light",
  "lighting",
  "art",
  "print",
  "canvas",
  "rug",
  "sauna",
  "plunge",
  "wall",
  "floor",
  "outdoor",
  "indoor",
  "garden",
  "kaiku",
  "luxury",
  "designer",
  "premium",
]);

/** A category's code: the tuned one, or initials derived from the slug. */
export function categoryCode(categorySlug?: string | null): string {
  if (!categorySlug) return "GEN";
  const mapped = CATEGORY_CODES[categorySlug];
  if (mapped) return mapped;
  // "bathroom-towel-rails" → "BTR"; a single-word slug takes its first four.
  const parts = categorySlug.split("-").filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 4).toUpperCase();
  return parts
    .map((part) => part[0]!)
    .join("")
    .slice(0, 4)
    .toUpperCase();
}

export function colourCode(primaryColour?: string | null): string | null {
  if (!primaryColour) return null;
  return COLOUR_CODES[primaryColour] ?? null;
}

/**
 * The name segment: the one word that actually identifies this product.
 *
 * A single word rather than several, because on this catalogue the first
 * non-noise word is nearly always the range name a person would use out loud
 * — Abberley, Witley, Hampton, Bentley, Leckford — and concatenating a second
 * only produced truncated noise (`ABBERLEYCOFF`, `HAMPTONSHAG`) that is
 * harder to read than the one clean word.
 *
 * Falls back to the un-stripped title's first word when every word is noise,
 * so a plainly-named product still yields a segment rather than a hole in the
 * code.
 */
export function nameSegment(title: string): string {
  const cleaned = title
    .replace(/\s*\|\s*Kaiku.*$/i, "")
    .replace(/[^A-Za-z\s]/g, " ");
  // Two letters minimum. Stripping the digits out of a title like "13.6m Warm
  // White LED String Lights" leaves a bare "m", which identifies nothing and —
  // worse — fails isCanonicalSku, so every re-run would rewrite the same three
  // products forever. Found by verifying the applied codes against the format
  // rather than trusting them.
  const words = cleaned.split(/\s+/).filter((word) => word.length >= 2);
  const distinctive = words.filter(
    (word) => !NAME_NOISE.has(word.toLowerCase()),
  );
  const chosen = (distinctive.length ? distinctive : words)[0] ?? "";
  return chosen.slice(0, 12).toUpperCase() || "ITEM";
}

/**
 * The full code, without its sequence number — everything that comes from the
 * product itself. Two genuinely different products can share this; the
 * sequence is what separates them, and only the caller can know which number
 * is free.
 */
export function skuStem(product: {
  title: string;
  categorySlug?: string | null;
  primaryColour?: string | null;
}): string {
  const parts = [
    "KK",
    categoryCode(product.categorySlug),
    nameSegment(product.title),
  ];
  const colour = colourCode(product.primaryColour);
  if (colour) parts.push(colour);
  return parts.join("-");
}

/** `KK-CT-ABBERLEY-BRN-001`. */
export function formatSku(stem: string, sequence: number): string {
  return `${stem}-${String(sequence).padStart(3, "0")}`;
}

/** Whether a code already matches the format, so it needs no rewrite. */
export function isCanonicalSku(sku: string | null | undefined): boolean {
  return Boolean(
    sku && /^KK-[A-Z]{2,4}-[A-Z]{2,12}(-[A-Z]{3})?-\d{3}$/.test(sku),
  );
}
