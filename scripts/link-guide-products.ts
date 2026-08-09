/**
 * Links the sauna buying guide to the saunas it is about.
 *
 * "Barrel vs cabin sauna: how to choose" is 1,300 words of real content and its
 * `relatedProducts` array is empty, so the one page on the site whose entire job
 * is helping someone choose a sauna offers no way to buy one. Two costs:
 *
 *   - A reader who has just decided between barrel and cabin has nowhere to go.
 *   - No internal links from the guide to the products, so none of whatever
 *     authority the guide earns reaches the pages that need to rank.
 *
 * That second one is why this matters beyond a single guide. It is the shape all
 * of the planned posts need: an informational page that answers the question and
 * then points at the products it just described. A post that links to nothing
 * competes with the product pages instead of feeding them.
 *
 * Picks the products the guide actually discusses. The body compares barrel
 * against cabin and does not mention infrared, so the two infrared Yorkshire
 * Cabins and both Dales Glows are left out — linking products a guide never
 * covers is what makes a "related" list read as filler.
 *
 * Order is deliberate: the barrel first, since the guide's title leads with it,
 * then the cabins by capacity. Out-of-stock models are still included — they are
 * genuinely the comparison the guide draws, and the product page states its own
 * availability.
 *
 * Dry run by default; --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/link-guide-products.ts
 */
import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const GUIDE_ID = "buyingGuide-choosing-a-sauna";

/** In the order they should appear, keyed to what the guide compares. */
const PRODUCT_IDS = [
  // Barrel — the guide's first term.
  "product-import-pennine-barrel-6-person-sauna-saunaplunge-0c76326a",
  // Cabin, smallest first.
  "product-import-bronte-2-person-cabin-sauna-saunaplunge-0875b2a6",
  "product-import-bronte-6-person-cabin-sauna-saunaplunge-cae97287",
];

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

async function main() {
  const guide = await client.fetch<{
    _id: string;
    title: string;
    relatedProducts: unknown[] | null;
  } | null>(`*[_id == $id][0]{_id, title, relatedProducts}`, { id: GUIDE_ID });
  if (!guide) {
    console.error(`No guide with _id "${GUIDE_ID}" — aborting.`);
    process.exit(1);
  }

  if (guide.relatedProducts?.length) {
    console.log(
      `\n"${guide.title}" already links ${guide.relatedProducts.length} product(s) — nothing to do.\n`,
    );
    return;
  }

  // Confirm every target exists before writing any of them: a reference to a
  // missing document renders as a blank card rather than failing loudly.
  const found = await client.fetch<{ _id: string; title: string }[]>(
    `*[_id in $ids]{_id, title}`,
    { ids: PRODUCT_IDS },
  );
  const missing = PRODUCT_IDS.filter((id) => !found.some((f) => f._id === id));
  if (missing.length) {
    console.error(`These product IDs do not exist:\n  ${missing.join("\n  ")}`);
    process.exit(1);
  }

  console.log(`\n"${guide.title}" → ${PRODUCT_IDS.length} product(s):\n`);
  for (const id of PRODUCT_IDS) {
    const p = found.find((f) => f._id === id)!;
    console.log(`  ${p.title.slice(0, 60)}`);
  }

  if (!apply) {
    console.log("\nDry run — nothing written. Re-run with --apply.\n");
    return;
  }

  await client
    .patch(guide._id)
    .set({
      relatedProducts: PRODUCT_IDS.map((id, index) => ({
        _type: "reference",
        _key: `related-product-${index}`,
        _ref: id,
      })),
    })
    .commit();

  console.log(`\nDone. The guide now points at the saunas it describes.\n`);
}

main().catch((err) => {
  console.error("link-guide-products failed:", err);
  process.exit(1);
});
