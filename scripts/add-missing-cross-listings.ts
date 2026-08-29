/**
 * Adds a genuine second category to five products that only have one.
 *
 * Damien: *"alot of products in the wrong categories"*, after the shelving
 * grid showed a lifestyle photo leading two products. The image fix is
 * `derive-studio-shots.ts`; this is what the same look turned up on the
 * category side — a keyword scan of every live title against the category it
 * sits in (`scripts/tmp/category-mismatch.ts`, not checked in) surfaced 21
 * candidates. Nineteen were false alarms — a desk with a "storage shelf"
 * feature is still a desk, a sofa set that includes a fire pit table is still
 * garden furniture, and this is the same mistake as the six-products-cut-to-
 * two recategorisation earlier in this file: generalising from a title
 * keyword to a category is exactly how that one went wrong.
 *
 * Two candidates were real, and both are additions, not moves — nothing here
 * changes a product's primary category:
 *
 *   - **Four Reclaimed Collection pieces have no second category at all**,
 *     out of the collection's 20 — 16 of 20 already do. Two console tables, a
 *     bedside table and a dining table sit only under "The Reclaimed
 *     Collection", which is a materials-led collection page, not the
 *     functional category a search for "console table" or "bedside table"
 *     lands on.
 *   - **The Cebu side table's own summary says it "fits seamlessly into any
 *     bedroom or living space"** — it is filed under Bedside Tables alone,
 *     which is true but only half true by its own copy. Cross-listed into
 *     Side Tables rather than moved, because Bedside Tables is not wrong.
 *
 * Only `additionalCategories` is touched. No primary category changes, no
 * product is renamed, nothing is removed from anywhere it already appears.
 *
 *   pnpm tsx --env-file=.env.local scripts/add-missing-cross-listings.ts
 *   pnpm tsx --env-file=.env.local scripts/add-missing-cross-listings.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const ADDITIONS: { title: string; add: string; why: string }[] = [
  {
    title: "Reclaimed Teak Sideboard Console Table with 6 Drawers | Kaiku",
    add: "console-tables",
    why: "A console table by name and function, in the collection page alone.",
  },
  {
    title: "Reclaimed Teak Console Table with 3 Drawers | Kaiku",
    add: "console-tables",
    why: "Same as above.",
  },
  {
    title: "Reclaimed Teak Dining Table 180cm | Kaiku",
    add: "kitchen-furniture",
    why: "Dining tables are filed under Kitchen Furniture on this site.",
  },
  {
    title: "Round Reclaimed Teak Bedside Table with Drawer | Kaiku",
    add: "bedside-tables",
    why: "A bedside table by name and function, in the collection page alone.",
  },
  {
    title: "Cebu Black Side Table with Rattan Drawer | Kaiku",
    add: "side-tables",
    why: 'Its own summary: "fits seamlessly into any bedroom or living space" — filed under Bedside Tables only.',
  },
];

async function main() {
  const results: {
    title: string;
    add: string;
    why: string;
    status: string;
  }[] = [];

  for (const item of ADDITIONS) {
    const product = await client.fetch<{
      _id: string;
      existing: string[] | null;
    } | null>(
      `*[_type == "product" && !(_id in path("drafts.**")) && title == $title][0]{
         _id, "existing": additionalCategories[]->slug.current }`,
      { title: item.title },
    );
    if (!product) {
      results.push({ ...item, status: "NOT FOUND" });
      continue;
    }
    if ((product.existing ?? []).includes(item.add)) {
      results.push({ ...item, status: "already listed there" });
      continue;
    }

    const target = await client.fetch<{ _id: string } | null>(
      `*[_type == "category" && slug.current == $slug][0]{_id}`,
      { slug: item.add },
    );
    if (!target) {
      results.push({ ...item, status: "NO SUCH CATEGORY" });
      continue;
    }

    results.push({ ...item, status: "add" });

    if (apply) {
      try {
        await client
          .patch(product._id)
          .setIfMissing({ additionalCategories: [] })
          .append("additionalCategories", [
            { _type: "reference", _ref: target._id, _key: `add-${item.add}` },
          ])
          .commit();
      } catch (error) {
        console.log(`  FAILED ${item.title}: ${(error as Error).message}`);
      }
    }
  }

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — cross-listings\n`);
  for (const r of results)
    console.log(
      `  ${r.status.padEnd(20)} +${r.add.padEnd(18)} ${r.title.slice(0, 52)}`,
    );
  console.log(`\n${results.filter((r) => r.status === "add").length} to add.`);

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-cross-listings.json`,
    JSON.stringify({ applied: apply, results }, null, 2),
  );

  if (!apply) console.log("\nNothing written. Re-run with --apply.");
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
