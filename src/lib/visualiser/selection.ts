/**
 * Chooses which products go into a render, and in what role.
 *
 * The first version shuffled the department's products and took three:
 * `[...pool].sort(() => Math.random() - 0.5).slice(0, 3)`. That is literally random,
 * and it showed. Damien's verdict on a real render: *"it just dumps random
 * products"* — and in that render it had put an **indoor folding shelf** on a decked
 * terrace, alongside two barrels, with nothing to sit on and nothing to light the
 * space.
 *
 * Two faults, and the second is the expensive one.
 *
 * **No sense of what a set is.** A staged garden needs something to sit on, something
 * to put a drink on, and ideally something that anchors the whole scene. Three items
 * pulled at random are three items, not a design. Roles fix that: the picker fills
 * distinct jobs rather than counting to three.
 *
 * **The pool was one department wide.** `pickAutoProducts` fetched only the department
 * the visitor had picked, so choosing "Outdoor Living" made the five outdoor saunas
 * and the cold plunge ineligible — they live under their own departments. Damien, on
 * the same render: *"this was a perfect garden for a sauna"*. He is right, and it is
 * the whole commercial point of the tool: the saunas are the £3,189–£6,379 products
 * and the most transformative thing that can be put in a garden. A garden visualiser
 * that cannot show a sauna in a garden is missing its best trick.
 *
 * **What this cannot fix.** The outdoor range is nine products, of which three are
 * genuinely outdoor pieces — a chair, a table and a pot — and **there is no outdoor
 * lighting in the catalogue at all**. So "add lighting" cannot come from stock, and
 * the picker will still reach for cross-listed rustic pieces to fill a set. That is a
 * buying gap, not a code one.
 */

export interface SelectableProduct {
  slug: string;
  name: string;
  category: string;
  price: number;
  image?: string | null;
  /** The room tags on the document, e.g. ["Living room", "Garden"]. */
  roomTags?: string[];
  /** The department of the product's primary category. */
  departmentSlug?: string | null;
}

/**
 * The job a product does in a staged scene.
 *
 * `hero` is the piece the render is built around — a sauna, a cold plunge, an outdoor
 * kitchen. Everything else supports it.
 */
export type ProductRole =
  "hero" | "seating" | "table" | "light" | "planter" | "storage" | "other";

/** Departments whose products belong outside. */
export const OUTDOOR_DEPARTMENTS = [
  "outdoor-living",
  "sauna",
  "cold-plunge",
  "outdoor-kitchen",
] as const;

const HERO_CATEGORIES =
  /^(outdoor-saunas|indoor-saunas|cold-plunges|outdoor-kitchens|pergolas)$/;

/**
 * The role a product plays, from its category and its name.
 *
 * The name is needed as well as the category because `garden-furniture` holds both
 * the Axis Carver Dining Chair and the Alto Outdoor Table — one is seating and one is
 * a table, and the category cannot tell them apart.
 */
export function productRole(product: SelectableProduct): ProductRole {
  const category = product.category ?? "";
  const name = product.name.toLowerCase();

  if (HERO_CATEGORIES.test(category)) return "hero";
  if (/\b(sauna|plunge|ice bath)\b/.test(name)) return "hero";

  if (/\b(chair|bench|sofa|armchair|stool|seat|lounger)\b/.test(name))
    return "seating";
  if (/table/.test(name) || /tables$/.test(category)) return "table";
  if (
    /\b(lamp|light|lantern|festoon)\b/.test(name) ||
    /lighting/.test(category)
  )
    return "light";
  if (/\b(planter|pot|plant stand)\b/.test(name) || category === "planters")
    return "planter";
  if (
    /\b(crate|tub|chest|shelf|shelving|storage|sideboard|cabinet)\b/.test(
      name,
    ) ||
    /storage|shelving/.test(category)
  )
    return "storage";
  return "other";
}

/**
 * Whether a product is a native outdoor piece rather than a cross-listing.
 *
 * The distinction matters because room tags are generous: the indoor folding A-frame
 * shelf carries `Garden` in its `roomTags`, which is how it ended up on a terrace.
 * Being in an outdoor *department* is the stronger signal, so those products are
 * preferred and the Garden-tagged cross-listings are only filler.
 */
export function isNativeOutdoor(product: SelectableProduct): boolean {
  return (OUTDOOR_DEPARTMENTS as readonly string[]).includes(
    product.departmentSlug ?? "",
  );
}

/** Whether a product may appear in an outdoor scene at all. */
export function suitsOutdoors(product: SelectableProduct): boolean {
  if (isNativeOutdoor(product)) return true;
  return (product.roomTags ?? []).some((tag) => /garden|outdoor/i.test(tag));
}

/**
 * The order roles are filled in, most important first.
 *
 * A hero first, because it changes the whole scene. Then somewhere to sit and
 * something to put a glass on, which is what makes a terrace look used rather than
 * furnished. Lighting next — when there is any to show. Storage last: a crate is a
 * detail, and the previous version led with them.
 */
const ROLE_PRIORITY: ProductRole[] = [
  "hero",
  "seating",
  "table",
  "light",
  "planter",
  "storage",
  "other",
];

/**
 * Picks a coherent set: one product per role, in priority order.
 *
 * Deliberately not random. Within a role the dearest is taken, for two reasons that
 * happen to agree — the more expensive piece is usually the more photogenic one, and
 * a tool whose job is to sell should not lead with the £40 tub when there is a
 * £3,189 sauna eligible for the same slot.
 *
 * Variety across repeat visits comes from `rotate`, which shifts which candidate is
 * taken within each role, so somebody generating twice does not see the same scene.
 */
export function curateSet(
  products: SelectableProduct[],
  { max = 3, rotate = 0 }: { max?: number; rotate?: number } = {},
): SelectableProduct[] {
  const byRole = new Map<ProductRole, SelectableProduct[]>();
  for (const product of products) {
    const role = productRole(product);
    const list = byRole.get(role) ?? [];
    list.push(product);
    byRole.set(role, list);
  }
  for (const list of byRole.values()) list.sort((a, b) => b.price - a.price);

  const chosen: SelectableProduct[] = [];
  for (const role of ROLE_PRIORITY) {
    if (chosen.length >= max) break;
    const candidates = byRole.get(role);
    if (!candidates?.length) continue;
    chosen.push(candidates[rotate % candidates.length]!);
  }

  // Roles ran out before the set was full — top up with whatever is left, dearest
  // first, rather than returning a thinner scene than asked for.
  if (chosen.length < max) {
    const taken = new Set(chosen.map((p) => p.slug));
    const rest = products
      .filter((p) => !taken.has(p.slug))
      .sort((a, b) => b.price - a.price);
    chosen.push(...rest.slice(0, max - chosen.length));
  }

  return chosen;
}

/**
 * The outdoor pool, native products first.
 *
 * Cross-listings are kept as filler rather than dropped: with three genuinely outdoor
 * non-sauna products in the catalogue, excluding them outright would leave most
 * scenes with a sauna and nothing else.
 */
export function outdoorPool(
  products: SelectableProduct[],
): SelectableProduct[] {
  const eligible = products.filter(suitsOutdoors);
  const native = eligible.filter(isNativeOutdoor);
  const crossListed = eligible.filter((p) => !isNativeOutdoor(p));
  return [...native, ...crossListed];
}
