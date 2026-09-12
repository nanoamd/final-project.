/**
 * The title a product sends to Google Shopping, which is not the title on its
 * page and should not be.
 *
 * Two different limits are at work and conflating them was costing real
 * matching. A `<title>` tag is truncated in search results past roughly 60
 * characters, and Kaiku's product names average 51 — close to optimal, with
 * almost nothing to gain. A Shopping feed title allows **150**, and the same
 * names use a third of it. Title text is the strongest signal Google has for
 * deciding which queries a product can appear against, so two thirds of that
 * surface was simply unused.
 *
 * "Garda Glazed Gisela Vase" can match roughly those words and little else.
 * "Garda Glazed Gisela Vase — Grey Ceramic | Kaiku" can also match "grey
 * ceramic vase", "grey glazed vase" and "ceramic flower vase".
 *
 * Three rules keep this honest rather than keyword stuffing:
 *
 *   **Only facts already recorded on the product.** Colour, material and the
 *   category it genuinely sits in — never invented adjectives.
 *
 *   **Never repeat what the name already says.** "Lagom Black Natural Rattan
 *   Chair" gains nothing from "— Black Rattan Chair" and it reads as spam to
 *   a shopper and to Google's reviewers alike.
 *
 *   **The product name is never altered, and the brand stays.** The suffix is
 *   lifted off, the attributes are inserted before it, and it goes back on, so
 *   the name survives intact and "| Kaiku" still ends the string. Keeping the
 *   page's exact name as the leading text is also what stops Merchant Center
 *   raising a title mismatch against the landing page.
 */

const BRAND_SUFFIX = /\s*\|\s*Kaiku\s*$/;

/**
 * Singular form of a category title, for the noun a shopper would type.
 *
 * The `-ses` ending needs the doubled s to disambiguate, which the first
 * version of this got wrong and turned "Vases" into "Vas": a word ending
 * `-sses` drops `es` (Glasses → Glass) while everything else ending in a
 * single `s` just drops it (Vases → Vase, Desks → Desk).
 *
 * Returns null for a compound category containing "&". Singularising only the
 * final word of "Candles & Lanterns" produced "Candles & Lantern", which is
 * broken English on the one line a shopper reads, and picking either half
 * misdescribes half the range. No noun is better than a mangled one.
 */
function singular(categoryName: string): string | null {
  const trimmed = categoryName.trim();
  if (trimmed.includes("&")) return null;
  if (/ies$/i.test(trimmed)) return trimmed.replace(/ies$/i, "y");
  if (/sses$/i.test(trimmed)) return trimmed.replace(/es$/i, "");
  if (/s$/i.test(trimmed) && !/ss$/i.test(trimmed))
    return trimmed.replace(/s$/i, "");
  return trimmed;
}

/**
 * Capitalises a tag for display without destroying deliberate casing.
 *
 * `materialTags` holds values like "Mirrored glass", which rendered mid-title
 * as a lowercase word and read like a data-entry slip. Only all-lowercase
 * words are touched, so "LED" and "MDF" survive intact.
 */
function presentable(value: string): string {
  return value
    .split(/\s+/)
    .map((word) =>
      word && word === word.toLowerCase()
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word,
    )
    .join(" ");
}

/** Whole-word, case-insensitive containment. */
function mentions(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(haystack);
}

export interface FeedTitleInput {
  /** The product's own title, exactly as Sanity holds it. */
  name: string;
  colours?: string[] | null;
  materials?: string[] | null;
  /** Category title, e.g. "Vases". Only its singular is used, and only when
   *  the name does not already contain it. */
  categoryName?: string | null;
}

/** Google's cap on `g:title`. */
export const FEED_TITLE_MAX = 150;

export function feedTitle({
  name,
  colours,
  materials,
  categoryName,
}: FeedTitleInput): string {
  const original = (name ?? "").trim();
  if (!original) return "";

  const suffix = BRAND_SUFFIX.test(original)
    ? original.match(BRAND_SUFFIX)![0].trimEnd()
    : "";
  const base = original.replace(BRAND_SUFFIX, "").trim();

  const parts: string[] = [];

  const add = (raw: string | null | undefined) => {
    const value = raw?.trim();
    if (!value) return;
    const shown = presentable(value);
    if (mentions(base, value) || parts.includes(shown)) return;
    parts.push(shown);
  };

  // Colour first: it is the attribute shoppers most often put in a query.
  for (const colour of colours ?? []) add(colour);
  for (const material of materials ?? []) add(material);

  // The category noun last, so the clause reads "Grey Ceramic Vase".
  const noun = categoryName?.trim() ? singular(categoryName) : null;
  if (noun) add(noun);

  if (!parts.length) return original;

  const candidate = `${base} — ${parts.join(" ")}${suffix ? ` ${suffix.trim()}` : ""}`;
  // Never return something longer than Google accepts; fall back to the
  // untouched name rather than emit a truncated one.
  return candidate.length <= FEED_TITLE_MAX ? candidate : original;
}
