/**
 * Choosing what goes in the New & Noteworthy rail.
 *
 * Two rounds of Damien's feedback, and the second corrected the first.
 *
 * It began as one supplier's range ordered cheapest-first, which showed a
 * bedside table and then four near-identical gesso lamps between £205 and
 * £290: *"we need a better range of products here, some cheap, some expensive
 * 1 of each type"*. Taking one product per category fixed the repetition, but
 * taking the *median* of each category filled the rail with the unremarkable
 * middle of the shop — a chopping board, a soap dispenser: *"poor selection of
 * products for that scroll bar, use some fancy lighting pieces etc. must be
 * our best products with some cheaper products inbetween each one"*.
 *
 * So the rail is not a price ramp and not an average. It alternates:
 *
 *   - a **hero** — the dearest piece in a category, which is where the
 *     statement lighting and the large furniture live;
 *   - then something **affordable** from a different category, so nobody
 *     scrolling is looking at four four-figure prices in a row.
 *
 * Which categories get to be heroes is decided by **how deep the range is**,
 * not by what its dearest piece costs. Ranking on price alone put the four
 * most expensive things in the shop at the front and pushed Lighting — the
 * largest category by some distance, and the one Damien named — to the very
 * last card of a twenty-four card scroll, where nobody would see it. Depth is
 * the better signal for a rail that is meant to say "here is what we sell":
 * a category with a hundred products is a range, and a category with three is
 * a shelf.
 *
 * The **value** picks are then chosen on price, not on depth. Taking them from
 * the shallow end of the same depth ranking looked reasonable and was not: a
 * category with three products is not a cheap category, and the rail ended up
 * putting a £989 shelving unit in a slot that was supposed to be the breather
 * between two expensive pieces. They are drawn from whatever is left, cheapest
 * first, which is what actually makes them cheap.
 *
 * No category appears twice in the rail.
 */

export interface RailCandidate {
  slug: string;
  category?: string | null;
  price?: number | null;
}

const byPriceAsc = (a: RailCandidate, b: RailCandidate) =>
  (a.price ?? 0) - (b.price ?? 0);

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

  // Deepest ranges first, and where two are the same depth the one with the
  // better piece at the top of it wins.
  const ranked = [...byCategory.values()]
    .map((group) => [...group].sort(byPriceAsc))
    .sort(
      (a, b) =>
        b.length - a.length || (b.at(-1)!.price ?? 0) - (a.at(-1)!.price ?? 0),
    );

  // Half the rail is heroes, taken from the deepest ranges — but never more
  // than half the categories, or a short catalogue would be all heroes and
  // there would be nothing cheap to put between them.
  const heroCount = Math.min(Math.ceil(size / 2), Math.ceil(ranked.length / 2));
  const heroes = ranked.slice(0, heroCount).map((group) => group.at(-1)!);

  // The rest is whatever is left over, cheapest first.
  const value = ranked
    .slice(heroCount)
    .map((group) => group[0]!)
    .sort(byPriceAsc);

  const chosen: T[] = [];
  for (let index = 0; index < heroes.length + value.length; index += 1) {
    if (chosen.length >= size) break;
    const next = index % 2 === 0 ? heroes[index / 2] : value[(index - 1) / 2];
    // One side runs out before the other on a short catalogue; keep taking
    // from whichever still has something rather than stopping early.
    if (next) chosen.push(next);
    else {
      const rest = [
        ...heroes.slice(Math.ceil(index / 2)),
        ...value.slice(index / 2),
      ];
      for (const item of rest) {
        if (chosen.length >= size) break;
        if (!chosen.includes(item)) chosen.push(item);
      }
      break;
    }
  }

  return chosen;
}
