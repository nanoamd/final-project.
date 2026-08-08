import type { SanityProduct } from "@/types/sanity-content";

/**
 * Every array on a product, and whether the type promises it is always there.
 *
 * GROQ returns `null` for an array field that does not exist on a document —
 * not `[]`. The SanityProduct type declares `highlights`, `specs` and `faqs` as
 * plain arrays, so TypeScript is satisfied and every consumer writes
 * `product.highlights.map(...)`. The first product published without those
 * fields returned a 500: "Portable Charcoal BBQ Grill with Wheels" had a full
 * description, price, gallery and FAQs, and no specs or highlights, and its page
 * threw on `product.highlights.map` while its category page and /shop/all
 * rendered perfectly.
 *
 * Coercing at the boundary is what makes the type honest, and fixes every
 * consumer at once. Guarding each `.map()` call instead leaves the next new
 * component free to reintroduce the same crash.
 */
const ARRAY_FIELDS = [
  "gallery",
  "highlights",
  "specs",
  "faqs",
  "badges",
  "styleTags",
  "options",
  "downloads",
  "relatedSlugs",
] as const satisfies readonly (keyof SanityProduct)[];

/**
 * Replaces null/undefined array fields with empty arrays, in place of the
 * document straight off the query. Optional fields are included: a component
 * reading `product.badges?.length` is unaffected by an empty array, and one
 * that forgot the `?.` no longer crashes.
 */
export function withProductArrayDefaults<T extends object>(raw: T): T {
  // Cast through Record rather than genericising the index access: the point of
  // this function is that the declared type disagrees with what arrives at
  // runtime, so the type cannot be the thing describing the fix.
  const out = { ...raw } as unknown as Record<string, unknown>;
  for (const field of ARRAY_FIELDS) {
    if (!Array.isArray(out[field])) out[field] = [];
  }
  return out as unknown as T;
}
