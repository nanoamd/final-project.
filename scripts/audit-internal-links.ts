/**
 * Finds the pages nothing links to.
 *
 * Search Console reports **44 URLs as "Discovered – currently not indexed"**, which
 * means Google knows the URL exists and has decided not to spend a crawl on it. On a
 * young domain the usual cause is not a penalty, it is that nothing on the site
 * points at the page. A URL that appears only in the sitemap is a URL Google has been
 * told about and given no reason to care about; a URL linked from three other pages
 * is one the crawler keeps arriving at.
 *
 * So this counts, for every product and category, how many internal links point *at*
 * it — and lists the ones with none. That is the actionable half of "internal linking
 * system" from the brief, because you cannot fix orphan pages you have not found.
 *
 * The link sources it counts are the ones that actually exist in the markup:
 *
 *   - a product's `category` and `additionalCategories` — the category page lists it
 *   - `relatedProducts` on posts and buying guides
 *   - `relatedCategories` on categories, added with the category content
 *   - the automatic related-products carousel, which pulls same-category products,
 *     so a product in a category of one has nothing pointing at it from there
 *
 * Read-only. It writes nothing and changes nothing.
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-internal-links.ts
 */
import { createClient } from "@sanity/client";

const token = process.env.SANITY_API_WRITE_TOKEN;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  useCdn: false,
  token,
});

interface ProductRow {
  slug: string;
  title: string;
  category: string | null;
  extras: string[] | null;
  /** How many products share its primary category, itself included. */
  siblings: number;
  /** Posts and guides that reference it. */
  editorial: number;
}

interface CategoryRow {
  slug: string;
  title: string;
  products: number;
  /** Other categories that link to it via relatedCategories. */
  inbound: number;
  /** Whether it appears in the room grids, which is a link from a room page. */
  inRoomGrid: boolean;
}

async function main() {
  const products = await client.fetch<ProductRow[]>(
    `*[_type == "product" && !(_id in path("drafts.**")) && defined(slug.current)]{
      "slug": slug.current, title,
      "category": category->slug.current,
      "extras": additionalCategories[]->slug.current,
      "siblings": count(*[_type == "product" && !(_id in path("drafts.**")) && category._ref == ^.category._ref]),
      "editorial": count(*[_type in ["post", "buyingGuide"] && references(^._id)])
    } | order(title asc)`,
  );

  const categories = await client.fetch<CategoryRow[]>(
    `*[_type == "category" && !(_id in path("drafts.**")) && defined(slug.current)]{
      "slug": slug.current, title,
      "products": count(*[_type == "product" && !(_id in path("drafts.**")) && references(^._id)]),
      "inbound": count(*[_type == "category" && !(_id in path("drafts.**")) && references(^._id)]),
      "inRoomGrid": !coalesce(excludeFromRoomGrid, false) && defined(department)
    } | order(products desc)`,
  );

  console.log(
    `\n${products.length} published products · ${categories.length} categories\n`,
  );

  /**
   * A product's inbound links, counted conservatively.
   *
   * Its category page is one. Each additional category is another. Editorial
   * references are another each. The related-products carousel only produces a link
   * if there is another product in the same category to pull — in a category of one
   * it renders nothing, which is exactly the case that goes uncrawled.
   */
  const scored = products.map((p) => {
    const categoryLinks = (p.category ? 1 : 0) + (p.extras?.length ?? 0);
    const carousel = p.siblings > 1 ? 1 : 0;
    return { ...p, inbound: categoryLinks + carousel + p.editorial };
  });

  const thin = scored
    .filter((p) => p.inbound <= 1)
    .sort((a, b) => a.inbound - b.inbound);

  console.log(
    `PRODUCTS WITH ONE INBOUND LINK OR FEWER — ${thin.length} of ${products.length}\n` +
      `Only their own category page points at them, so a crawler that has not visited\n` +
      `that category recently has no route in.\n`,
  );
  for (const p of thin.slice(0, 30))
    console.log(
      `  ${p.inbound} link${p.inbound === 1 ? " " : "s"}  ${(p.category ?? "no category").padEnd(26)} ${p.title.slice(0, 44)}`,
    );
  if (thin.length > 30) console.log(`  … and ${thin.length - 30} more`);

  const noExtras = scored.filter((p) => !(p.extras?.length ?? 0)).length;
  const noEditorial = scored.filter((p) => !p.editorial).length;
  const alone = scored.filter((p) => p.siblings <= 1);

  console.log(
    `\n  ${noExtras} of ${products.length} products sit in exactly one category\n` +
      `  ${noEditorial} of ${products.length} are referenced by no post or buying guide\n` +
      `  ${alone.length} are the only product in their category, so the related-products\n` +
      `    carousel on their page renders nothing and links nowhere`,
  );
  for (const p of alone.slice(0, 10))
    console.log(`      ${p.category} — ${p.title.slice(0, 50)}`);

  const orphanCategories = categories.filter(
    (c) => c.products > 0 && !c.inbound,
  );
  console.log(
    `\nSTOCKED CATEGORIES WITH NO INBOUND CATEGORY LINK — ${orphanCategories.length}\n` +
      `Reachable from the navigation, but no other category page points at them, so\n` +
      `they collect no link equity from within the site.\n`,
  );
  for (const c of orphanCategories)
    console.log(
      `  ${String(c.products).padStart(3)} products  ${c.slug}${c.inRoomGrid ? "" : "  (also out of the room grids)"}`,
    );

  console.log(
    `\nWhat would move the needle, in order of effect per unit of work:\n` +
      `  1. Cross-list products into a second genuine category — one extra reference\n` +
      `     doubles the inbound links of ${noExtras} products.\n` +
      `  2. Add relatedCategories to the ${orphanCategories.length} stocked categories that have none.\n` +
      `  3. Write editorial that references products: ${noEditorial} have no post or guide\n` +
      `     pointing at them, and that is the link type Google weighs most.\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
