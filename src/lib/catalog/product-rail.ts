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

/**
 * The most a rail "value" slot may cost.
 *
 * High enough that the pick is a real piece rather than the bottom of a range,
 * low enough that it still reads as a breather beside a four-figure hero.
 */
const VALUE_CEILING = 450;

/**
 * A category whose dearest piece costs less than this is not a range.
 *
 * "Accessories" is thirty-five products between £19 and £49, of which the top
 * seven are the same towel set in different colours. It earned a homepage slot
 * purely by being deep, and put a £49 peach towel set between a marble dining
 * table and a chaise sofa.
 *
 * Depth alone was the wrong test. A category that cannot field a single piece
 * worth £75 has nothing to show on a page that opens at £1,561 — so it is
 * excluded rather than ranked. A floor rather than a name list, because a name
 * list goes stale the moment a category is renamed in Studio.
 */
const MIN_CATEGORY_TOP = 75;

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
    .filter((group) => (group.at(-1)!.price ?? 0) >= MIN_CATEGORY_TOP)
    .sort(
      (a, b) =>
        b.length - a.length || (b.at(-1)!.price ?? 0) - (a.at(-1)!.price ?? 0),
    );

  // Half the rail is heroes, taken from the deepest ranges — but never more
  // than half the categories, or a short catalogue would be all heroes and
  // there would be nothing cheap to put between them.
  const heroCount = Math.min(Math.ceil(size / 2), Math.ceil(ranked.length / 2));
  const heroes = ranked.slice(0, heroCount).map((group) => group.at(-1)!);

  // The rest is whatever is left over — but the BEST piece in each of those
  // ranges that is still a breather, not the cheapest thing in it.
  //
  // Taking `group[0]` was the previous rule and it is what put a £32 pink wall
  // clock, a £39 vase, a framed Labrador and a peach towel set on the homepage
  // between a £2,745 marble dining table and a £2,118 chaise sofa. The cheapest
  // product in a category is almost never the one worth showing; it is the
  // filler at the bottom of the range.
  //
  // So each remaining category offers up its dearest piece under the ceiling.
  // The slot still does its job — something affordable between two heavy
  // prices — while being a piece somebody might actually want. A category with
  // nothing under the ceiling falls back to its cheapest, because a category
  // where everything is expensive has no breather to give.
  const value = ranked
    .slice(heroCount)
    .map((group) => {
      const affordable = group.filter(
        (product) => (product.price ?? 0) <= VALUE_CEILING,
      );
      return affordable.at(-1) ?? group[0]!;
    })
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
