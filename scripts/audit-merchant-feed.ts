/**
 * Why Merchant Center holds fewer products than the feed sends.
 *
 * Damien: _"We have 500 products on merchant centre not 900."_ He is reading
 * Merchant Center; I was reading the number of rows our own feed emits. Those
 * are two different numbers and I reported the wrong one as if it were the
 * live one.
 *
 * The gap is disapprovals. Merchant Center accepts a feed row and then rejects
 * the item, so a feed that "works" can still leave half the catalogue unable to
 * appear in a free listing or a Shopping ad. Nothing on our side reports that —
 * it is only visible inside Merchant Center — so this reconstructs it from the
 * data we hold, using Google's own documented required fields.
 *
 * Read-only. No token, no writes.
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-merchant-feed.ts
 */
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

interface Row {
  slug: string | null;
  title: string | null;
  category: string | null;
  price: number | null;
  image: string | null;
  images: number;
  brand: string | null;
  gtin: string | null;
  mpn: string | null;
  stockStatus: string | null;
  description: string | null;
}

async function main() {
  // The same filter the live feed uses, so the counts are comparable.
  const rows = await client.fetch<Row[]>(
    `*[_type == "product" && !(_id in path("drafts.**")) && defined(category->slug.current)]{
      "slug": slug.current,
      title,
      "category": category->slug.current,
      price,
      "image": gallery[0].asset->url,
      "images": count(gallery),
      "brand": brand->name,
      gtin, mpn, stockStatus,
      "description": summary
    }`,
  );

  console.log(`\nFeed sends ${rows.length} rows.\n`);

  /**
   * Google's required fields for a UK apparel-free feed: id, title,
   * description, link, image_link, availability, price. An item missing any of
   * them is disapproved outright rather than served badly.
   */
  const hard = {
    "no image — disapproved, item cannot serve": rows.filter((r) => !r.image),
    "no price or price is zero": rows.filter((r) => !r.price || r.price <= 0),
    "no description": rows.filter(
      (r) => !r.description || !r.description.trim(),
    ),
    "no title": rows.filter((r) => !r.title || !r.title.trim()),
  };

  /** Not disapprovals, but each one suppresses or limits how an item serves. */
  const soft = {
    "out of stock — stays in the feed, does not serve": rows.filter((r) =>
      (r.stockStatus ?? "").toLowerCase().includes("out"),
    ),
    "no brand — limits matching, and required in some categories": rows.filter(
      (r) => !r.brand,
    ),
    "no gtin and no mpn — needs identifier_exists:no, which the feed sends":
      rows.filter((r) => !r.gtin && !r.mpn),
    "single image — no lifestyle shot for the Shopping tile": rows.filter(
      (r) => r.images <= 1,
    ),
  };

  const failing = new Set<string>();
  console.log("HARD FAILURES — these are disapproved and cannot serve:\n");
  for (const [label, list] of Object.entries(hard)) {
    console.log(`  ${String(list.length).padStart(4)}  ${label}`);
    for (const r of list) failing.add(r.slug ?? "(no slug)");
  }

  console.log(`\n  ${failing.size} distinct products fail at least one.\n`);
  console.log(
    `  So at most ${rows.length - failing.size} can be approved from our side.\n`,
  );

  console.log("SUPPRESSED — accepted, but will not or cannot serve well:\n");
  for (const [label, list] of Object.entries(soft))
    console.log(`  ${String(list.length).padStart(4)}  ${label}`);

  const oos = soft["out of stock — stays in the feed, does not serve"];
  const servable = rows.filter(
    (r) =>
      !failing.has(r.slug ?? "(no slug)") &&
      !(r.stockStatus ?? "").toLowerCase().includes("out"),
  );
  console.log(
    `\n  ${servable.length} products are both approvable and in stock — that is the number that can actually appear.\n`,
  );

  if (failing.size) {
    console.log("First 15 that cannot serve at all:\n");
    const names = [...failing].slice(0, 15);
    for (const slug of names) console.log(`    ${slug}`);
    console.log("");
  }

  console.log(
    `Totals: ${rows.length} sent, ${failing.size} hard-failing, ${oos.length} out of stock, ${servable.length} servable.\n`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
