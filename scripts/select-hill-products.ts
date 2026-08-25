/**
 * Chooses products from the Hill Interiors dropship feed, and says why.
 *
 * The feed is 1,626 products, of which 721 are in stock. Nobody can read that, so
 * this applies Kaiku's own standards and hands back a shortlist with the reasoning
 * attached. It writes nothing to Sanity — it produces a report and, with `--json`,
 * a file the importer can take.
 *
 * **Three things the feed revealed that change what is worth listing.**
 *
 * 1. **`Status` is either ACT or DRD, and nothing states what DRD means.** It is
 *    most likely a run-down code — discontinued once stock clears — and it covers a
 *    lot of the garden range Damien picked out: the Capri corner set, all four Axis
 *    chairs, both Alto tables, the Bloom footstool. If it does mean discontinued,
 *    listing them means writing descriptions for products that will vanish. This
 *    script therefore **separates ACT from DRD rather than guessing**, and the DRD
 *    list is held back until Hill confirm. One question to their trade desk.
 *
 * 2. **Not everything on the website is dropshippable.** Four of the products in
 *    Damien's screenshots — the Actium vase, both Ordo planter sets, the Hellenic
 *    pot — are simply absent from the dropship feed. They are wholesale-only, so
 *    listing them would mean holding stock. Anything not in this feed cannot be
 *    dropshipped, which is exactly the trap that the Ankorstore mistake was.
 *
 * 3. **The feed barely touches the empty categories.** Its strength is decorative
 *    accessories — 126 single-stem artificial flowers, 44 vases, 43 candles, 23
 *    photo frames — and Kaiku has no category for any of that. Meanwhile it offers
 *    **one** pendant, **four** wall mirrors, and nothing at all for rugs, towel
 *    rails, bathroom accessories, bathroom lighting, garden lighting, privacy
 *    screens, kitchen furniture or fire pits. The honest summary is that this feed
 *    thickens what exists and stocks Christmas; it does not fill the eleven gaps.
 *    Those still need a different supplier.
 *
 * **Descriptions are deliberately not carried through.** The feed has them and they
 * are written for the trade — "Encourage your trade customers to enrich their
 * offerings" — which is both wrong for a shopper and against the standing rule that
 * every description is written from scratch. Only the provable facts come across:
 * code, dimensions, weight, colour, material, stock, and the image URLs.
 *
 *   pnpm tsx scripts/select-hill-products.ts <feed.xml>
 *   pnpm tsx scripts/select-hill-products.ts <feed.xml> --include-drd
 *   pnpm tsx scripts/select-hill-products.ts <feed.xml> --json shortlist.json
 */
import { readFileSync, writeFileSync } from "node:fs";

const feedPath = process.argv[2];
const includeDrd = process.argv.includes("--include-drd");
const jsonIndex = process.argv.indexOf("--json");
const jsonOut = jsonIndex > -1 ? process.argv[jsonIndex + 1] : null;

if (!feedPath || feedPath.startsWith("--")) {
  console.error(
    "Usage: pnpm tsx scripts/select-hill-products.ts <feed.xml> [--include-drd] [--json out.json]",
  );
  process.exit(1);
}

interface FeedProduct {
  code: string;
  title: string;
  /** What Kaiku pays. Never written to Sanity. */
  price: number;
  /** Hill's suggested retail. Printed for the pricing decision only. */
  rrp: number;
  stock: number;
  status: string;
  height: number;
  width: number;
  depth: number;
  weight: number;
  categories: string;
  colour: string;
  material: string;
  images: string[];
  deliverySize: string;
}

function decode(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function parse(xml: string): FeedProduct[] {
  const tag = (block: string, name: string) => {
    const match = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(block);
    return match ? decode(match[1]!.trim()) : "";
  };
  return xml
    .split("<Product>")
    .slice(1)
    .map((block) => ({
      code: tag(block, "Code"),
      title: tag(block, "Title"),
      price: parseFloat(tag(block, "Price")) || 0,
      rrp: parseFloat(tag(block, "RRP")) || 0,
      stock: parseInt(tag(block, "AvailableStock"), 10) || 0,
      status: tag(block, "Status"),
      height: parseFloat(tag(block, "Height")) || 0,
      width: parseFloat(tag(block, "Width")) || 0,
      depth: parseFloat(tag(block, "Depth")) || 0,
      weight: parseFloat(tag(block, "Weight")) || 0,
      categories: tag(block, "Categories"),
      colour: tag(block, "Colour"),
      material: tag(block, "Material"),
      images: [1, 2, 3, 4, 5]
        .map((n) => tag(block, `Image${n}`))
        .filter(Boolean),
      deliverySize: tag(block, "DeliverySize"),
    }));
}

/**
 * Hill's category path mapped onto a Kaiku category slug, with how many to take.
 *
 * Order matters — the first match wins — so the specific paths sit above the
 * general ones. A path with no rule is reported as unmapped rather than guessed at:
 * a wrong category is worse than an absent product, and 126 artificial flower stems
 * have no home on this site at all.
 */
const MAPPING: {
  match: RegExp;
  /** Additional test on the title, where the category path alone is ambiguous. */
  titleMust?: RegExp;
  titleMustNot?: RegExp;
  slug: string;
  take: number;
}[] = [
  // Outdoor.
  //
  // **The category path alone is not enough here, and the first version got it
  // wrong.** Hill file indoor and outdoor seating under the same
  // `Seating > Occasional Chairs` and `Seating > Dining Chairs` paths, so matching
  // on the path put an Avaris Wingback Armchair, a Compton Boucle Dining Chair and
  // a Sorelle Two Seater Sofa into Garden Furniture. A shopper who taps Garden
  // Furniture and finds a boucle armchair has learned the navigation lies.
  //
  // So an outdoor signal in the title is required: either the word itself, or one
  // of the collection names Damien's own screenshots showed under Hill's Garden
  // Furniture breadcrumb.
  {
    match:
      /Outdoor Furniture|Seating > (Occasional Chairs|Dining Chairs|Benches|Stools)|Tables > (Dining|Outdoor)/i,
    titleMust:
      /outdoor|\b(capri|provence|amalfi|bloom|palma|axis|alto|echo|kyra|aura|verdan)\b/i,
    slug: "garden-furniture",
    take: 18,
  },
  // A bird bath is the only thing in the whole feed that fits `water-features`,
  // which is one of the eleven empty categories. Worth taking for that reason alone.
  {
    match: /Gifts & Accessories > Outdoors|Garden Accessories/i,
    titleMust: /bird bath|fountain|water feature/i,
    slug: "water-features",
    take: 3,
  },

  // Indoor seating, which is what the outdoor rule above now leaves behind. The
  // sofas category already covers armchairs.
  {
    match: /Seating > (Occasional Chairs|Benches)/i,
    titleMustNot: /outdoor/i,
    slug: "sofas",
    take: 8,
  },

  // Lighting. The room lighting categories hold 4 products each.
  { match: /Lighting > Pendant/i, slug: "kitchen-lighting", take: 4 },
  { match: /Lighting > Floor Lamps/i, slug: "lighting", take: 5 },
  {
    match: /Lighting > (Table Lamps|Ceramic Lamps)/i,
    slug: "lighting",
    take: 14,
  },

  // Mirrors.
  { match: /Mirrors > Wall Mirrors/i, slug: "bedroom-mirrors", take: 6 },

  // Furniture, thickening what is thin.
  {
    match: /Tables > Console Tables|Cabinets > Console Tables/i,
    slug: "console-tables",
    take: 6,
  },
  {
    match: /Tables > (Side Tables|Lamp Tables)/i,
    slug: "side-tables",
    take: 6,
  },
  { match: /Tables > Coffee Tables/i, slug: "coffee-tables", take: 3 },
  { match: /Tables > Bedside Tables/i, slug: "bedside-tables", take: 2 },
  {
    match: /Cabinets > (Sideboards|Storage Cabinets|Chest Of Drawers)/i,
    slug: "living-room-storage",
    take: 6,
  },
  {
    match: /Display Units > (Shelf Unit|Bookcases)/i,
    slug: "shelving",
    take: 4,
  },
  // The path is not enough again: `Gifts & Accessories > Outdoors` and the potted
  // plant sections carry ornaments and shell bowls, so the first version put a "Kin
  // Family Ornament" and a "Ceramic Adele Shell Bowl" into Planters. The title has
  // to say it holds a plant.
  {
    match: /Indoor Planters|Potted Plan/i,
    titleMust: /planter|plant pot|\bpot\b|plant stand|\bplant\b|\btree\b/i,
    slug: "planters",
    take: 8,
  },

  // Christmas.
  //
  // **A real Christmas tree and an ornament of a tree are not the same product**,
  // and the feed is almost entirely the latter: of 49 titles containing "tree",
  // exactly two are full-size pre-lit trees, with a combined stock of three units.
  // So `christmas-trees` takes only genuine pre-lit trees and will stay nearly
  // empty from this supplier — which is worth knowing before promising a Christmas
  // range — and the tabletop trees go where they belong, with the decorations.
  {
    match: /Christmas/i,
    titleMust: /pre-?lit.*christmas tree|christmas tree.*pre-?lit/i,
    slug: "christmas-trees",
    take: 4,
  },
  { match: /Christmas/i, slug: "christmas-decorations", take: 12 },
];

/** A photograph is the one thing that cannot be written later. */
const MIN_IMAGES = 2;

/**
 * Weight decides carriage, and carriage decides whether a cheap product is worth
 * listing at all. Hill's own bands: £6.99 to 10kg, £9.99 to 20kg, £14.99 to 40kg,
 * £24.99 over 40kg; two-man from £49.99 at 35kg, and Scotland adds £10.
 */
function carriage(weight: number): number {
  if (weight > 35) return 49.99;
  if (weight > 40) return 24.99;
  if (weight > 20) return 14.99;
  if (weight > 10) return 9.99;
  return 6.99;
}

function main() {
  const all = parse(readFileSync(feedPath!, "utf8"));
  const sellable = all.filter(
    (p) => p.stock > 0 && p.images.length >= MIN_IMAGES,
  );
  const act = sellable.filter((p) => p.status === "ACT");
  const drd = sellable.filter((p) => p.status === "DRD");

  console.log(
    `\n${all.length} products in the feed.\n` +
      `  ${all.filter((p) => p.stock > 0).length} in stock\n` +
      `  ${sellable.length} in stock with ${MIN_IMAGES}+ photographs\n` +
      `  ${act.length} ACT · ${drd.length} DRD (status unexplained — see the header)\n` +
      `${includeDrd ? "Selecting from ACT and DRD." : "Selecting from ACT only. Pass --include-drd to add the rest."}\n`,
  );

  const pool = includeDrd ? [...act, ...drd] : act;
  const chosen: { product: FeedProduct; slug: string }[] = [];
  const usedCodes = new Set<string>();

  for (const rule of MAPPING) {
    const candidates = pool
      .filter(
        (p) =>
          !usedCodes.has(p.code) &&
          rule.match.test(p.categories) &&
          (!rule.titleMust || rule.titleMust.test(p.title)) &&
          (!rule.titleMustNot || !rule.titleMustNot.test(p.title)),
      )
      // Cheapest first, then spread across the price range below.
      .sort((a, b) => a.price - b.price);
    if (!candidates.length) {
      console.log(`  ?  ${rule.slug.padEnd(22)} nothing in the feed matches`);
      continue;
    }

    // An even spread across the price range rather than the cheapest N — the brief
    // asks for low to high, and taking the first N by price would give a category
    // full of the same £4 stem.
    const step = Math.max(1, Math.floor(candidates.length / rule.take));
    const picked: FeedProduct[] = [];
    for (
      let i = 0;
      i < candidates.length && picked.length < rule.take;
      i += step
    )
      picked.push(candidates[i]!);
    // Top up from whatever is left if the spread came up short.
    for (const candidate of candidates) {
      if (picked.length >= rule.take) break;
      if (!picked.includes(candidate)) picked.push(candidate);
    }

    for (const product of picked) {
      usedCodes.add(product.code);
      chosen.push({ product, slug: rule.slug });
    }

    const prices = picked.map((p) => p.price);
    console.log(
      `  →  ${rule.slug.padEnd(22)} ${String(picked.length).padStart(2)} of ${String(candidates.length).padStart(3)} available   ` +
        `cost £${Math.min(...prices).toFixed(2)}–£${Math.max(...prices).toFixed(2)}`,
    );
  }

  console.log(`\n${chosen.length} products selected.\n`);

  // Grouped detail, so every choice can be read before anything is imported.
  const bySlug = new Map<string, FeedProduct[]>();
  for (const { product, slug } of chosen)
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), product]);

  for (const [slug, products] of bySlug) {
    console.log(`${slug}`);
    for (const p of products.sort((a, b) => a.price - b.price)) {
      const ship = carriage(p.weight);
      console.log(
        `  ${p.code}  cost £${p.price.toFixed(2).padStart(8)}  RRP £${p.rrp.toFixed(2).padStart(8)}  ` +
          `+£${ship.toFixed(2)} carriage  ${p.weight.toFixed(1)}kg  ${p.images.length} img  ` +
          `stock ${String(p.stock).padStart(4)}  ${p.status}  ${p.title.slice(0, 44)}`,
      );
    }
    console.log("");
  }

  // What the feed cannot do, stated rather than left to be discovered later.
  const unmapped = new Map<string, number>();
  for (const p of pool) {
    if (usedCodes.has(p.code)) continue;
    if (MAPPING.some((r) => r.match.test(p.categories))) continue;
    const top = p.categories.split(">").slice(0, 2).join(">").trim();
    unmapped.set(top, (unmapped.get(top) ?? 0) + 1);
  }
  console.log(
    "Feed sections with no Kaiku category to put them in — the decision is whether\n" +
      "these are worth new categories, not whether to force them into existing ones:",
  );
  for (const [section, count] of [...unmapped.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12))
    console.log(`  ${String(count).padStart(4)}  ${section}`);

  if (jsonOut) {
    // Exactly what the importer's --json mode reads, and nothing more. No
    // description: the feed's copy is written for the trade and every description
    // is written from scratch.
    const payload = chosen.map(({ product, slug }) => ({
      title: product.title,
      sku: product.code,
      brand: "Hill Interiors",
      images: product.images,
      sourceUrl: `https://www.hill-interiors.com/search?q=${product.code}`,
      price: product.rrp ? `£${product.rrp.toFixed(2)}` : undefined,
      category: slug,
      dimensions:
        product.height && product.width && product.depth
          ? {
              length: product.depth,
              width: product.width,
              height: product.height,
              unit: "cm" as const,
            }
          : undefined,
      weightKg: product.weight || undefined,
      colour: product.colour || undefined,
      material: product.material || undefined,
    }));
    writeFileSync(jsonOut, JSON.stringify(payload, null, 2), "utf8");
    console.log(
      `\nWrote ${payload.length} products to ${jsonOut}.\n` +
        `Descriptions are deliberately absent — the feed's copy is trade-facing.\n`,
    );
  } else {
    console.log(
      "\nNothing written. Pass --json <file> to produce an importer payload.\n",
    );
  }
}

main();
