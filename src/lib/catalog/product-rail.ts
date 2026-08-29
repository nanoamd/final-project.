/**
 * Choosing what goes in the New & Noteworthy rail.
 *
 * Damien, on a rail showing a bedside table and then four gesso table lamps
 * between £205 and £290: *"we need a better range of products here, some
 * cheap, some expensive 1 of each type"*.
 *
 * The rail was one supplier's range ordered cheapest first, which is exactly
 * how you get four of the same lamp: a supplier's products cluster by type and
 * by price, so the first five cheapest are usually five of one thing. Sorting
 * harder does not fix it — the fix is to stop the same category appearing
 * twice, and then to keep both ends of the price range.
 *
 * Two passes:
 *
 *   1. **One per category.** The category is the closest thing the catalogue
 *      has to "type". Within a category the middle-priced product is taken
 *      rather than the cheapest or the dearest, so the rail shows what the
 *      range actually looks like instead of its extremes.
 *   2. **Keep the spread.** Sorted by price, then thinned evenly if there are
 *      more categories than slots — always keeping the first and last, so the
 *      cheapest thing in the shop and the dearest both survive the trim.
 */

export interface RailCandidate {
  slug: string;
  category?: string | null;
  price?: number | null;
}

/** The median-priced item, which is the one that represents its category. */
function representative<T extends RailCandidate>(group: T[]): T {
  const sorted = [...group].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  return sorted[Math.floor((sorted.length - 1) / 2)]!;
}

/**
 * Thins a sorted list to `size`, keeping the first and last.
 *
 * Taking the first `size` would hand back the cheap end of the shop, which is
 * the thing being fixed.
 */
function evenSample<T>(items: T[], size: number): T[] {
  if (items.length <= size) return items;
  if (size <= 1) return items.slice(0, size);
  const step = (items.length - 1) / (size - 1);
  return Array.from(
    { length: size },
    (_, index) => items[Math.round(index * step)]!,
  );
}

export function selectRailProducts<T extends RailCandidate>(
  products: T[],
  size: number,
): T[] {
  const usable = products.filter(
    (product) =>
      product.slug && product.category && typeof product.price === "number",
  );

  const byCategory = new Map<string, T[]>();
  for (const product of usable) {
    const key = product.category as string;
    byCategory.set(key, [...(byCategory.get(key) ?? []), product]);
  }

  const oneEach = [...byCategory.values()].map(representative);
  oneEach.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));

  return evenSample(oneEach, size);
}
