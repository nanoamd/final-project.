/**
 * Removes the seeded star ratings from every product.
 *
 * All 45 published products carried `rating: 5` with review counts between 4
 * and 17. They came from scripts/seed-sanity.ts, which set 4.7-4.9 as demo data
 * while the site was being built. Nobody invented them to deceive — they were
 * placeholders nobody cleared.
 *
 * The problem is where they end up. product-summary.tsx renders "5.0 (9
 * reviews)" on the page, and json-ld.tsx emits them as `aggregateRating` in
 * Product structured data, which is what Google reads to show stars in search
 * results. The shop has never had a customer, so every one of those ratings is
 * fabricated, publicly displayed, and marked up for search engines.
 *
 * Three reasons that has to go before the site gets traffic:
 *
 *   - Google's review snippet policy prohibits marking up ratings that are not
 *     from genuine users. The penalty is a manual action removing rich results.
 *   - Merchant Center treats it as misrepresentation, which is a suspension
 *     reason, and a product feed was about to be submitted.
 *   - The Digital Markets, Competition and Consumers Act 2024 bans fake reviews
 *     outright in the UK, and the CMA can enforce directly.
 *
 * Unsets the fields rather than zeroing them: both the page and the JSON-LD are
 * already conditional on the values existing, so unsetting makes the stars and
 * the aggregateRating disappear with no code change. The day real reviews exist,
 * filling these fields in again turns both back on.
 *
 * Dry run by default. Add --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/clear-seeded-ratings.ts
 */
import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

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
  // Drafts too: publishing one would put its rating straight back on the site.
  const products = await client.fetch<
    {
      _id: string;
      title: string;
      rating: number | null;
      reviewCount: number | null;
    }[]
  >(
    `*[_type == "product" && (defined(rating) || defined(reviewCount))]{_id, title, rating, reviewCount} | order(title asc)`,
  );

  if (!products.length) {
    console.log("\nNothing to do — no product carries a rating.\n");
    return;
  }

  console.log(
    `\n${products.length} product(s) carry a rating that no customer left:\n`,
  );
  for (const p of products) {
    console.log(
      `  ${String(p.rating ?? "—").padEnd(4)} (${String(p.reviewCount ?? "—").padStart(2)} reviews)  ` +
        `${p._id.startsWith("drafts.") ? "[draft] " : ""}${p.title.slice(0, 56)}`,
    );
  }
  console.log("");

  if (!apply) {
    console.log("Dry run — nothing written. Re-run with --apply.\n");
    return;
  }

  for (const p of products) {
    await client.patch(p._id).unset(["rating", "reviewCount"]).commit();
    console.log(`✓ cleared: ${p.title.slice(0, 60)}`);
  }
  console.log(
    `\nDone. ${products.length} product(s) cleared.\n` +
      "Stars and aggregateRating now disappear from the pages and the\n" +
      "structured data. Fill these fields in again only from real reviews.\n",
  );
}

main().catch((err) => {
  console.error("clear-seeded-ratings failed:", err);
  process.exit(1);
});
