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

/**
 * Nothing on the rail costs more than this.
 *
 * Damien: *"I don't want the bookcase there but everything else is okay"* — a
 * £4,567 bookcase, which is nearly double the next piece and reads as a price
 * list rather than a shop front. The cap sits above the £2,745 marble dining
 * table he kept and below the bookcase, so the rail tops out at a figure that
 * still looks like furniture somebody buys.
 */
const RAIL_MAX_PRICE = 3000;

/**
 * The categories the affordable slots may draw from.
 *
 * Damien: *"in between these products add the most aesthetic Premier
 * Housewares products"*. Aesthetic is a judgement a list cannot make, but the
 * categories it lives in are knowable: lighting, mirrors, vases, planters,
 * wall art and occasional tables are things bought because of how they look.
 * Desks, wardrobes and shelving are bought because of what they hold, and a
 * veneer desk between a chandelier and a marble table is what made the rail
 * read as a warehouse.
 *
 * The hero slots are unrestricted — a sideboard or a sofa is the right thing
 * to anchor a rail with, and the constraint is only about what goes between.
 */
const AESTHETIC_CATEGORIES: ReadonlySet<string> = new Set([
  "Lighting",
  "Mirrors",
  "Vases",
  "Planters",
  "Wall Art",
  "Candles & Lanterns",
  "Side Tables",
  "Coffee Tables",
  "Console Tables",
  "Wall Clocks",
]);

const byPriceAsc = (a: RailCandidate, b: RailCandidate) =>
  (a.price ?? 0) - (b.price ?? 0);

/**
 * How keenly each product is priced, by slug: `price ÷ landed cost`.
 *
 * Kept as a separate map rather than a field on the product, so no cost figure
 * is ever attached to an object that renders. A markup ratio beside a visible
 * price is the cost price with one division, and the rail is a public page.
 */
export type MarkupBySlug = Readonly<Record<string, number>>;

export function selectRailProducts<T extends RailCandidate>(
  products: T[],
  size: number,
  markupBySlug?: MarkupBySlug,
): T[] {
  const usable = products.filter(
    (product) =>
      product.slug &&
      product.category &&
      typeof product.price === "number" &&
      product.price <= RAIL_MAX_PRICE,
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

  // Damien: *"Our products with the best prices should go there"*.
  //
  // With a markup map, each category contributes the piece Kaiku prices most
  // keenly — the lowest `price ÷ landed cost` — rather than its dearest or its
  // cheapest. That is the honest reading of "best price": not the smallest
  // number on the page, but the one where the customer is getting the most for
  // it. Where two are equally keen the dearer wins, because it is the better
  // piece at the same keenness.
  // Kept for the path with no markup index, where "best" can only mean dearest.
  const keenest = (group: T[]): T =>
    markupBySlug
      ? [...group].sort(
          (a, b) =>
            (markupBySlug[a.slug] ?? Infinity) -
              (markupBySlug[b.slug] ?? Infinity) ||
            (b.price ?? 0) - (a.price ?? 0),
        )[0]!
      : group.at(-1)!;

  // The rail still alternates a dear piece with an affordable one, so nobody
  // scrolling meets four four-figure prices in a row. That is rhythm, not
  // selection — both sides are now chosen on price keenness.
  if (markupBySlug) {
    // One pick per category fills about sixteen slots and the rail wants
    // twenty-four — Damien: *"Don't reduce product count in new and
    // noteworthy. Only add it in don't remove anything"*.
    //
    // So categories are drawn in rounds rather than once: every category's
    // keenest piece first, then every category's second-keenest, and so on.
    // The rail still opens with one of each rather than four lamps, and it
    // keeps filling instead of stopping short when the shallow categories run
    // out. No product can appear twice, because each round takes a different
    // index.
    const keenFirst = (group: T[]): T[] =>
      [...group].sort(
        (a, b) =>
          (markupBySlug[a.slug] ?? Infinity) -
            (markupBySlug[b.slug] ?? Infinity) ||
          (b.price ?? 0) - (a.price ?? 0),
      );
    const byKeenness = ranked.map(keenFirst);
    const deepest = Math.max(...byKeenness.map((group) => group.length), 0);
    const picks: T[] = [];
    for (let round = 0; round < deepest; round += 1) {
      for (const group of byKeenness) {
        const item = group[round];
        if (item) picks.push(item);
      }
    }

    // Deliberately NOT re-sorted by price. Sorting the full pool collapsed the
    // rail into four near-identical Troyes sofas and eleven small planters,
    // because price order ignores which round a pick came from. Keeping the
    // round order means every category is represented once before any category
    // appears twice, which is the whole reason rounds exist.
    const dear = picks.filter(
      (product) => (product.price ?? 0) > VALUE_CEILING,
    );
    const affordable = picks.filter(
      (product) =>
        (product.price ?? 0) <= VALUE_CEILING &&
        AESTHETIC_CATEGORIES.has(product.category as string),
    );

    const out: T[] = [];
    for (
      let i = 0;
      out.length < size && (dear.length || affordable.length);
      i += 1
    ) {
      const next =
        i % 2 === 0
          ? (dear.shift() ?? affordable.shift())
          : (affordable.shift() ?? dear.shift());
      if (!next) break;
      out.push(next);
    }
    return out;
  }

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
