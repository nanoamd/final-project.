/**
 * Deep audit of where products actually sit in the catalogue.
 *
 * Damien, looking at the Mirrors page: "all mirrors should be in this category,
 * we need to audit the categories and the products inside, to make the catalogue
 * as accessible as possible and make sure we are using cross categories… all
 * lighting products should be in lighting."
 *
 * Two different faults hide behind that, and this reports both:
 *
 * 1. **Products in the wrong category.** A photo frame filed under Mirrors
 *    because its title says "Mirror And Wood 5X7 Frame". A pendant light filed
 *    under Living Room furniture. The product-type rules below decide what a
 *    thing *is* from its title, then compare that with where it sits.
 *
 * 2. **Categories that duplicate each other.** "Mirrors" exists three times —
 *    once each under Decor, Bedroom and Bathroom — so a customer browsing
 *    mirrors sees a third of them wherever they start. Same for Lighting, which
 *    exists six times. This is the bigger of the two problems and the reason
 *    "all mirrors should be in this category" is currently impossible to satisfy
 *    by moving products around.
 *
 * Report-only. Nothing here writes to Sanity — the fixes it implies are
 * different in kind (a re-parent, a merge, a cross-listing) and each wants
 * deciding rather than applying in bulk.
 *
 *   pnpm tsx scripts/audit-catalogue-placement.ts
 *   pnpm tsx scripts/audit-catalogue-placement.ts --drafts   include drafts
 */

import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

if (!projectId || !dataset) {
  console.error("NEXT_PUBLIC_SANITY_PROJECT_ID / _DATASET not set — aborting.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-10-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const includeDrafts = process.argv.includes("--drafts");

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  dept: string | null;
  extraDepts: string[] | null;
  excludeFromRoomGrid: boolean | null;
  primary: number;
  secondary: number;
}

interface ProductRow {
  id: string;
  slug: string | null;
  title: string;
  categorySlug: string | null;
  categoryName: string | null;
  dept: string | null;
  extraCategorySlugs: string[] | null;
  productTypes: string[] | null;
}

/**
 * What a product *is*, decided from its title.
 *
 * `not` exists because the single word is never enough. "Mirror" appears in the
 * title of photo frames with mirrored edges, mirror-faced clocks and
 * mirror-topped tables — none of which is a mirror, and two of which are already
 * sitting in the Mirrors category on the live site. Every `not` below is a real
 * product in this catalogue, not a hypothetical.
 */
interface TypeRule {
  /** The category slug fragment a product of this type belongs in. */
  type: string;
  /** Categories that legitimately hold this type. */
  belongsIn: string[];
  match: RegExp;
  not?: RegExp;
}

const TYPE_RULES: TypeRule[] = [
  {
    type: "mirror",
    belongsIn: ["mirrors"],
    match: /\bmirrors?\b/i,
    // A photo frame with a mirrored border is a frame; a clock with a mirrored
    // face is a clock. But "Chunky Frame" describes a mirror's own frame, so the
    // bare word cannot be an exclusion — it has to be the frame *size* pattern or
    // the words "photo"/"picture".
    not: /\b(photo frame|picture frame|\d+ ?x ?\d+ frame|clock|tray|coaster|placemat|jewellery box)\b/i,
  },
  {
    type: "lighting",
    belongsIn: ["lighting", "garden-lighting"],
    match:
      /\b(lamp|lampshade|pendant light|ceiling light|wall light|chandelier|sconce|festoon|uplighter|downlighter|(string|fairy|cluster|micro|led|festoon|rope) lights?)\b/i,
    // A lantern that holds a candle is a candle holder, not a light fitting.
    not: /\b(lamp table|lampstand only|candle lantern)\b/i,
  },
  {
    type: "photo frame",
    belongsIn: ["wall-art", "decorative-accessories", "photo-frames"],
    match: /\b(photo frame|picture frame|\d+x\d+ frame)\b/i,
  },
  {
    type: "clock",
    belongsIn: ["wall-clocks"],
    match: /\bclock\b/i,
  },
  {
    type: "vase",
    belongsIn: ["vases"],
    match: /\bvase\b/i,
  },
  {
    type: "rug",
    belongsIn: ["rugs"],
    match: /\brug\b/i,
    not: /\brugged\b/i,
  },
  {
    type: "candle or lantern",
    belongsIn: ["candles-and-lanterns"],
    match: /\b(candle holder|candlestick|tealight|candle lantern|hurricane)\b/i,
  },
  {
    type: "planter",
    belongsIn: ["planters", "plant-stands"],
    match: /\b(planter|plant pot|plant stand|jardini[eè]re)\b/i,
  },
];

function titleType(title: string): TypeRule | null {
  for (const rule of TYPE_RULES) {
    if (!rule.match.test(title)) continue;
    if (rule.not?.test(title)) continue;
    return rule;
  }
  return null;
}

/** Whether a product sits in any category that legitimately holds its type. */
function isPlacedCorrectly(product: ProductRow, rule: TypeRule): boolean {
  const slugs = [
    product.categorySlug,
    ...(product.extraCategorySlugs ?? []),
  ].filter((slug): slug is string => Boolean(slug));
  return slugs.some((slug) =>
    rule.belongsIn.some(
      (allowed) => slug === allowed || slug.endsWith(allowed),
    ),
  );
}

function heading(text: string) {
  console.log(`\n${text}\n${"─".repeat(text.length)}`);
}

async function main() {
  const draftFilter = includeDrafts ? "" : ` && !(_id in path("drafts.**"))`;

  const categories = await client.fetch<CategoryRow[]>(
    `*[_type == "category"${draftFilter}]{
      "id": _id,
      "slug": slug.current,
      "name": title,
      "dept": department->slug.current,
      "extraDepts": additionalDepartments[]->slug.current,
      excludeFromRoomGrid,
      "primary": count(*[_type == "product"${draftFilter} && category._ref == ^._id]),
      "secondary": count(*[_type == "product"${draftFilter} && ^._id in additionalCategories[]._ref])
    } | order(name asc)`,
  );

  const products = await client.fetch<ProductRow[]>(
    `*[_type == "product"${draftFilter}]{
      "id": _id,
      "slug": slug.current,
      title,
      "categorySlug": category->slug.current,
      "categoryName": category->title,
      "dept": category->department->slug.current,
      "extraCategorySlugs": additionalCategories[]->slug.current,
      productTypes
    } | order(title asc)`,
  );

  console.log(
    `${categories.length} categories, ${products.length} products${includeDrafts ? " (drafts included)" : ""}.`,
  );

  // 1. Categories whose name appears more than once ---------------------------
  const byName = new Map<string, CategoryRow[]>();
  for (const category of categories) {
    const list = byName.get(category.name) ?? [];
    list.push(category);
    byName.set(category.name, list);
  }
  const duplicated = [...byName.entries()]
    .filter(([, list]) => list.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  heading("Categories with the same name in more than one place");
  console.log(
    "A customer browsing this name sees only the slice under whichever room they\n" +
      "entered from. Merging them, or cross-listing every product into one canonical\n" +
      "category, is what makes 'all mirrors in Mirrors' possible at all.\n",
  );
  for (const [name, list] of duplicated) {
    const total = list.reduce((sum, c) => sum + c.primary + c.secondary, 0);
    console.log(`${name}  ×${list.length}  (${total} products across them)`);
    for (const category of list) {
      console.log(
        `    ${category.slug.padEnd(30)} room=${(category.dept ?? "—").padEnd(16)} ` +
          `primary=${String(category.primary).padStart(3)} secondary=${String(category.secondary).padStart(3)}`,
      );
    }
  }
  if (!duplicated.length) console.log("None.");

  // 2. Products whose title says one thing and whose category says another ----
  heading("Products that look mis-filed, judged from their own title");
  const misfiled: {
    product: ProductRow;
    rule: TypeRule;
  }[] = [];
  for (const product of products) {
    const rule = titleType(product.title);
    if (!rule) continue;
    if (isPlacedCorrectly(product, rule)) continue;
    misfiled.push({ product, rule });
  }

  const byType = new Map<string, typeof misfiled>();
  for (const entry of misfiled) {
    const list = byType.get(entry.rule.type) ?? [];
    list.push(entry);
    byType.set(entry.rule.type, list);
  }
  for (const [type, list] of [...byType.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  )) {
    console.log(`\n  reads as a ${type} — ${list.length}`);
    for (const { product } of list) {
      console.log(
        `    ${product.title.slice(0, 62).padEnd(64)} in: ${product.categorySlug ?? "NONE"}`,
      );
    }
  }
  if (!misfiled.length) console.log("None.");

  // 3. The reverse: things sitting in a category they do not read as ----------
  heading("Products in a category their title does not support");
  const wronglyIncluded: { product: ProductRow; expected: string }[] = [];
  for (const product of products) {
    if (!product.categorySlug) continue;
    const rule = TYPE_RULES.find((r) =>
      r.belongsIn.some((slug) => product.categorySlug === slug),
    );
    if (!rule) continue;
    // In a category for this type, but the title does not read as that type.
    const actual = titleType(product.title);
    if (!actual || actual.type === rule.type) continue;
    // "Reads as nothing we have a rule for" is a gap in the rules, not a fault
    // in the catalogue: Wall Art holds plaques and canvases, Planters holds
    // plants in pots. Reporting those trains you to ignore this list.
    wronglyIncluded.push({ product, expected: actual.type });
  }
  for (const { product, expected } of wronglyIncluded) {
    console.log(
      `    ${product.title.slice(0, 58).padEnd(60)} in ${(product.categorySlug ?? "").padEnd(22)} reads as ${expected}`,
    );
  }
  if (!wronglyIncluded.length) console.log("None.");

  // 4. Empty categories ------------------------------------------------------
  heading("Categories with nothing in them");
  const empty = categories.filter((c) => !c.primary && !c.secondary);
  for (const category of empty) {
    console.log(`    ${category.slug.padEnd(30)} room=${category.dept ?? "—"}`);
  }
  console.log(`    (${empty.length} of ${categories.length})`);

  // 5. Cross-category coverage ----------------------------------------------
  heading("Cross-category usage");
  const withExtras = products.filter(
    (p) => (p.extraCategorySlugs ?? []).length,
  );
  console.log(
    `    ${withExtras.length} of ${products.length} products are cross-listed ` +
      `(${Math.round((withExtras.length / Math.max(products.length, 1)) * 100)}%).`,
  );
  const noCategory = products.filter((p) => !p.categorySlug);
  if (noCategory.length) {
    console.log(
      `\n    ${noCategory.length} product(s) have NO primary category:`,
    );
    for (const product of noCategory)
      console.log(`      ${product.title.slice(0, 70)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
