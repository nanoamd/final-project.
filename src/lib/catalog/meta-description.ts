/**
 * The sentence a shopper reads in a search result, built from facts.
 *
 * Every published product currently opens "Shop the <name> at Kaiku" and ends
 * "Premium UK homewares for modern living." That is roughly 45 of the 160
 * available characters spent on words that persuade nobody, repeated across
 * 287 products, and what remains carries no fact at all:
 *
 *   Shop the Glass Candle Holder at Kaiku. Add elegance and warmth to your
 *   home with our stylish and versatile candle holder. Premium UK homewares
 *   for modern living.
 *
 * A search result is a choice between ten of those. What wins a click is the
 * concrete thing: how big it is, what it is made of, what it takes. So the
 * name leads, a real measurement follows, and the space that boilerplate was
 * occupying goes to whatever else is actually known.
 *
 * Nothing is invented. A product with no facts gets a shorter description
 * rather than a padded one.
 */

export interface MetaInput {
  title: string;
  category?: string | null;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  } | null;
  weight?: { value?: number; unit?: string } | null;
  material?: string | null;
  /** Supplier specification rows, e.g. "Candle Type". */
  extra?: Record<string, string>;
  /** Suppresses the material when the name and supplier disagree. */
  materialDisputed?: boolean;
}

/** Google truncates around here; there is no gain in writing past it. */
export const META_LIMIT = 158;

const has = (n: unknown): n is number => typeof n === "number" && n > 0;

function displayName(title: string): string {
  return title.replace(/\s*\|\s*Kaiku(?:\s+Tagline)?\s*$/i, "").trim();
}

/** The most useful single measurement, in the fewest characters. */
function sizePhrase(d: MetaInput["dimensions"]): string | null {
  if (!d) return null;
  const unit = d.unit ?? "cm";
  if (has(d.height) && has(d.width))
    return d.width === d.length
      ? `${d.height}${unit} tall, ${d.width}${unit} across`
      : `${d.height}${unit} tall`;
  if (has(d.height)) return `${d.height}${unit} tall`;
  if (has(d.length) && has(d.width)) return `${d.length} × ${d.width}${unit}`;
  return null;
}

export function buildMetaDescription(input: MetaInput): string {
  const name = displayName(input.title);
  const facts: string[] = [];

  const size = sizePhrase(input.dimensions);
  if (size) facts.push(size);

  const material =
    input.materialDisputed || !input.material
      ? null
      : input.material.toLowerCase();
  if (material && material.length <= 24) facts.push(`in ${material}`);

  const extra = input.extra ?? {};
  const candle = extra["Candle Type"];
  if (candle && /led|faux/i.test(candle)) facts.push("for LED candles");

  const assembly = extra["Assembly Required"];
  if (assembly && /^no\b/i.test(assembly)) facts.push("arrives assembled");

  const outdoor = extra["Indoor Outdoor Use"];
  if (outdoor && /indoor only/i.test(outdoor)) facts.push("indoor use");
  else if (outdoor && /outdoor/i.test(outdoor)) facts.push("suitable outdoors");

  const weight = input.weight?.value;
  if (has(weight) && weight >= 20 && facts.length < 3)
    facts.push(`${weight}${input.weight?.unit ?? "kg"}`);

  // Free delivery is the one promise worth the characters: it is true of every
  // order, it is a genuine differentiator against marketplace listings, and it
  // is the thing shoppers filter on.
  const tail = "Free UK delivery.";

  let sentence = facts.length
    ? `${name} — ${facts.slice(0, 3).join(", ")}. ${tail}`
    : `${name}. ${tail}`;

  if (sentence.length > META_LIMIT) {
    // Drop facts from the end until it fits, rather than cutting mid-word.
    for (let keep = 2; keep >= 0 && sentence.length > META_LIMIT; keep--) {
      sentence = keep
        ? `${name} — ${facts.slice(0, keep).join(", ")}. ${tail}`
        : `${name}. ${tail}`;
    }
  }
  return sentence;
}
