/**
 * Reading Viva Rugs' public Shopify catalogue for facts — never their titles or
 * marketing copy verbatim.
 *
 * Viva Rugs publish `/products.json`, a standard, documented Shopify storefront
 * endpoint, and their own `robots.txt` states plainly: "Public product... collection...
 * HTML is crawlable" and names an agent-discovery sitemap and an MCP catalogue
 * endpoint for exactly this kind of reading. Nothing here reads anything the site
 * owner has not already published for machine consumption.
 *
 * Two things still need cleaning up before anything reaches Sanity, though, which is
 * why this file exists rather than writing the JSON straight through:
 *
 * **The titles are SEO keyword-stuffing** — "Deep Purple Rug Geometric Large XL Small
 * Soft Modern Room Carpet Abstract Rug" repeats near-synonyms for every search term a
 * shopper might type. Kaiku's own title convention is a plain, specific noun phrase
 * (see every other product on the site), so `deriveTitle` builds one from the
 * product's own colour and pattern rather than keeping Viva's.
 *
 * **The specification list is boilerplate plus two real facts.** Every product on the
 * site repeats the same five "✔️" bullets about overlocking and underfloor heating;
 * the only lines that differ between products are `Colour:` and `Material:`. Those two
 * are extracted as facts, mapped through scripts/lib/supplier-facets.ts like every
 * other supplier, and the boilerplate sentences are read nowhere and stored nowhere —
 * the same rule scripts/lib/hill-supplier.ts follows for Hill Interiors.
 */
import { mapColour, mapMaterials } from "./supplier-facets";

export interface VivaVariant {
  title: string;
  sku: string;
  price: string;
  available: boolean;
}

export interface VivaProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  images: { src: string }[];
  variants: VivaVariant[];
  tags: string[];
}

/** One page of the storefront's own product feed. Empty once past the last page. */
export async function fetchProductsPage(page: number): Promise<VivaProduct[]> {
  const res = await fetch(
    `https://vivarugs.co.uk/products.json?limit=250&page=${page}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; KaikuCatalogueSync/1.0)",
      },
    },
  );
  if (!res.ok)
    throw new Error(`products.json page ${page} returned ${res.status}`);
  const data = (await res.json()) as { products: VivaProduct[] };
  return data.products;
}

/** The line's value, e.g. "Colour: Dark Purple and Black" → "Dark Purple and Black". */
function specLine(text: string, label: string): string | null {
  const match = new RegExp(`${label}:\\s*([^\\n]+)`, "i").exec(text);
  return match ? match[1]!.trim() : null;
}

/** Strips HTML tags down to the plain lines `specLine` reads. */
function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, "\n");
}

/**
 * Every colour word the vocabulary recognises, from two sources combined.
 *
 * Shopify's own `Color_X` product tags (`Color_Cream`, `Color_Grey`) are structured
 * data the storefront itself uses for filtering, and cover 93% of the catalogue —
 * far more reliably than the prose spec line, which a good number of products fill
 * with "See photos" instead of naming a colour at all. The `Colour:` line in
 * `body_html` is read as well and the two are combined, because neither is complete
 * on its own: a handful of products carry a colour in the text but no tag, or a tag
 * more specific than the text ("Cream" the tag against "Dark Purple and Black" the
 * text, on the same product, do happen).
 *
 * The text line is read with a word-scan rather than a split on commas, because the
 * supplier writes colour lists in at least three shapes across the catalogue: "Dark
 * Purple and Black", "Cream, Beige, Brown, Black", and "Grey Beige White Mustard
 * Yellow Purple Green Blue" with no punctuation at all. A shared scan handles all
 * three at the cost of also matching non-colours like "Dark" or "Mustard" — which is
 * fine, since those simply fail to map and are dropped like any other word.
 */
export function colourTagsFrom(product: VivaProduct): string[] {
  const fromTags = product.tags
    .filter((tag) => tag.startsWith("Color_"))
    .map((tag) => mapColour(tag.slice("Color_".length)));

  const raw = specLine(plainText(product.body_html), "Colour");
  const fromText = (raw?.toLowerCase().match(/[a-z]+/g) ?? []).map((w) =>
    mapColour(w),
  );

  return [
    ...new Set([...fromTags, ...fromText].filter((c): c is string => !!c)),
  ];
}

/**
 * The canonical material tag for this rug, via scripts/lib/supplier-facets.ts — or
 * none, for the ~40 products whose Material line is just "100%" with nothing after
 * it, and the handful of "Nylone"/"Microfiber"/"Lurex" blends too rare across the
 * catalogue to be worth a canonical tag for.
 *
 * "Frisee"/"Friese"/"Frese" are the supplier's own three spellings of the same soft
 * polypropylene shag texture — a typo repeated across enough product pages that it
 * reads as their in-house term rather than three different fibres, so all three are
 * recognised as one word before reaching the shared map.
 */
export function materialTagFrom(bodyHtml: string): string | null {
  const raw = (specLine(plainText(bodyHtml), "Material") ?? "").toLowerCase();
  if (/fri?e?se|frisee/.test(raw))
    return mapMaterials("polypropylene")[0] ?? null;
  const [tag] = mapMaterials(
    raw
      .replace(/\bpp\b/g, "polypropylene")
      .match(/polypropylene|cotton|\bwool\b|polyester/)?.[0] ?? "",
  );
  return tag ?? null;
}

/**
 * The pattern the supplier names for this rug, tidied for use in a title.
 *
 * "Design:" lines are shared across colourways of the same weave ("Oriental Greek
 * Key Border Marble Effect" appears on several differently-coloured rugs), which is
 * correct — it is naming the pattern, not the specific product, the same way "Chevron"
 * or "Herringbone" would.
 */
export function designFrom(bodyHtml: string): string | null {
  const raw = specLine(plainText(bodyHtml), "Design");
  if (!raw) return null;
  return (
    raw
      .replace(/\s*\([^)]*\)\s*$/, "")
      // A handful of design lines already end "... Rug" (e.g. "Monochrome Plain
      // Rug"), and deriveTitle appends its own "Rug" — stripped here so the two
      // callers of this function never have to know about the other's suffix.
      .replace(/\s*\brug\b\s*$/i, "")
      .trim() || null
  );
}

/**
 * A plain, specific title from the product's own facts — never the supplier's
 * keyword-stuffed one.
 *
 * Falls back to the design alone when no colour maps, and to a de-duplicated,
 * trimmed slice of the supplier's own title as a last resort for the handful of
 * products with neither — de-duplicated because the supplier's titles repeat size
 * words ("Large Small XL") that would otherwise appear twice in six words.
 */
export function deriveTitle(product: VivaProduct): string {
  const design = designFrom(product.body_html);
  const colours = colourTagsFrom(product);
  const lead = colours[0];

  if (design && lead) return `${lead} ${design} Rug`;
  if (design) return `${design} Rug`;

  const seen = new Set<string>();
  const words = product.title
    .replace(/\bRug\b/gi, "")
    .split(/\s+/)
    .filter((word) => {
      const key = word.toLowerCase();
      if (!word || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
  return `${words.join(" ")} Rug`.replace(/\s+/g, " ").trim();
}

/**
 * Generic words the supplier's own titles repeat for search coverage rather than to
 * describe this particular rug — sizes, room names and the vaguest style words.
 * Excluded when looking for a real distinguishing word, below.
 */
const FILLER_WORDS = new Set([
  "large",
  "small",
  "xl",
  "soft",
  "modern",
  "room",
  "carpet",
  "rug",
  "living",
  "bedroom",
  "style",
  "patchwork",
  "with",
]);

/**
 * A word from the supplier's own title not already present in `title`, for breaking
 * a collision where two different rugs derive the same plain title — most often two
 * colourways of a weave so generic ("Modern Plain Rug") that dozens of genuinely
 * different products share the same Colour-less, Design-only phrase.
 *
 * Still built from the supplier's own words rather than invented, and still not
 * their prose — a single noun ("Alpaca", "Trellis", "Ombre") pulled from a title
 * that is itself a bag of search keywords, not a sentence anyone wrote to be read.
 * Returns `null` when nothing in the source title says anything `title` doesn't
 * already, which is the caller's signal to skip the product rather than publish an
 * indistinguishable duplicate.
 */
export function distinguishingWord(
  product: VivaProduct,
  title: string,
): string | null {
  const already = new Set(title.toLowerCase().match(/[a-z]+/g) ?? []);
  const candidates = product.title.match(/[A-Za-z]+/g) ?? [];
  const word = candidates.find((candidate) => {
    const key = candidate.toLowerCase();
    return key.length > 2 && !already.has(key) && !FILLER_WORDS.has(key);
  });
  return word ?? null;
}

/** Metric dimensions parsed off a variant title such as `120x170cm (4'x5'6'')`. */
export function dimensionsFrom(
  variantTitle: string,
): { length: number; width: number } | null {
  const match = /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*cm/i.exec(
    variantTitle,
  );
  if (!match) return null;
  return { length: Number(match[1]), width: Number(match[2]) };
}

/** The variant to represent this product with: the first one in stock, or else the first. */
export function representativeVariant(product: VivaProduct): VivaVariant {
  return product.variants.find((v) => v.available) ?? product.variants[0]!;
}
