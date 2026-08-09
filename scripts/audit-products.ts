/**
 * Launch-readiness check, per product.
 *
 * Every problem this catches has already happened on this catalogue at least
 * once, and none of them were visible in Studio's product list:
 *
 *   - A product with no specs or highlights returned 500 on its own page,
 *     because GROQ gives null for an absent array and the page called .map on
 *     it. Fixed in code, but a product missing them is still a thin page.
 *   - 20 of 45 products had no SKU or GTIN, so Google disapproved them.
 *   - Lead times held 14 spellings of six values, one of which rendered as
 *     "Delivered in 4-6" with no unit.
 *   - All 48 products carried invented 5-star ratings.
 *   - A £5,279 sauna had zero FAQs while every sibling had ten.
 *
 * Grouped by what the problem actually costs, because "37 warnings" is not
 * something anyone acts on:
 *
 *   BLOCKING       cannot be sold at all
 *   GOOGLE         will not appear in Shopping or free listings
 *   TRUST          will lose a sale it could have had
 *   POLISH         worth fixing, loses nothing today
 *
 * Read-only. Run it after listing a batch:
 *   pnpm tsx --env-file=.env.local scripts/audit-products.ts
 *
 * Add --drafts to include unpublished products, which is what you want while
 * still working on them.
 */
import { createClient } from "@sanity/client";

const includeDrafts = process.argv.includes("--drafts");

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

/** Merchant Center's recommended minimum for a product image. */
const MIN_IMAGE_WIDTH = 800;
/** Above this, a buyer expects questions answered before they'll commit. */
const HIGH_TICKET = 1000;

/** Matches what normalise-lead-times.ts produces: "2–4 weeks", "7–14 days". */
const LEAD_TIME = /^\d+–\d+ (days|weeks|months)$/;

type Severity = "BLOCKING" | "GOOGLE" | "TRUST" | "POLISH";

interface Row {
  _id: string;
  title: string;
  slug: string | null;
  price: number | null;
  sku: string | null;
  gtin: string | null;
  summary: string | null;
  description: unknown[] | null;
  category: string | null;
  stockStatus: string | null;
  deliveryLeadTime: string | null;
  dimensions: unknown | null;
  weight: unknown | null;
  rating: number | null;
  reviewCount: number | null;
  specs: number | null;
  highlights: number | null;
  faqs: number | null;
  images: number | null;
  imagesNoAlt: number | null;
  imagesNoAsset: number | null;
  smallestImage: number | null;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type == "product" ${includeDrafts ? "" : '&& !(_id in path("drafts.**"))'}]{
      _id, title, "slug": slug.current, price, sku, gtin, summary, description,
      "category": category->slug.current, stockStatus, deliveryLeadTime,
      dimensions, weight, rating, reviewCount,
      "specs": count(specs),
      "highlights": count(highlights),
      "faqs": count(faqs),
      "images": count(gallery),
      "imagesNoAlt": count(gallery[!defined(alt) || alt == ""]),
      "imagesNoAsset": count(gallery[!defined(asset)]),
      "smallestImage": math::min(gallery[].asset->metadata.dimensions.width)
    } | order(title asc)`,
  );

  const findings: { severity: Severity; product: string; problem: string }[] =
    [];
  const add = (severity: Severity, row: Row, problem: string) =>
    findings.push({
      severity,
      product: `${row._id.startsWith("drafts.") ? "[draft] " : ""}${row.title}`,
      problem,
    });

  for (const row of rows) {
    // BLOCKING — the product cannot be bought.
    if (!row.price) add("BLOCKING", row, "no price");
    if (!row.category)
      add("BLOCKING", row, "no category — page cannot be built");
    if (!row.slug) add("BLOCKING", row, "no slug — no URL");
    if (!row.images) add("BLOCKING", row, "no images at all");
    if (!row.stockStatus) add("BLOCKING", row, "no stock status");

    // GOOGLE — it exists on the site but not in Shopping.
    if (!row.sku) add("GOOGLE", row, "no SKU");
    if (!row.summary)
      add("GOOGLE", row, "no summary — the feed has no description to send");
    if (row.smallestImage && row.smallestImage < MIN_IMAGE_WIDTH)
      add(
        "GOOGLE",
        row,
        `smallest image is ${row.smallestImage}px, under Merchant Center's ${MIN_IMAGE_WIDTH}px`,
      );

    // TRUST — a visitor arrives and leaves.
    if (row.rating || row.reviewCount)
      add(
        "TRUST",
        row,
        "carries a rating — only fill this in from real customer reviews",
      );
    if (!row.description?.length)
      add("TRUST", row, "no full description, only a summary");
    if (!row.specs) add("TRUST", row, "no specs");
    if (!row.highlights) add("TRUST", row, "no highlights");
    if (!row.dimensions)
      add(
        "TRUST",
        row,
        "no dimensions — furniture buyers need to know it fits",
      );
    if (row.deliveryLeadTime && !LEAD_TIME.test(row.deliveryLeadTime))
      add(
        "TRUST",
        row,
        `lead time "${row.deliveryLeadTime}" is not in the "2–4 weeks" form the page expects`,
      );
    if (!row.deliveryLeadTime) add("TRUST", row, "no delivery lead time");
    if ((row.price ?? 0) >= HIGH_TICKET && !row.faqs)
      add(
        "TRUST",
        row,
        `£${row.price} with no FAQs — nothing answers a buyer's questions`,
      );
    if (row.imagesNoAsset)
      add("TRUST", row, `${row.imagesNoAsset} empty gallery slot(s)`);

    // POLISH.
    if (!row.weight) add("POLISH", row, "no weight");
    if (!row.gtin) add("POLISH", row, "no GTIN (fine for own-brand)");
    if (row.imagesNoAlt)
      add("POLISH", row, `${row.imagesNoAlt} image(s) without alt text`);
  }

  const order: Severity[] = ["BLOCKING", "GOOGLE", "TRUST", "POLISH"];
  const explain: Record<Severity, string> = {
    BLOCKING: "cannot be sold — fix before publishing",
    GOOGLE: "invisible in Shopping and free listings",
    TRUST: "will lose a sale it could have had",
    POLISH: "worth doing, costs nothing today",
  };

  console.log(
    `\n${rows.length} product(s)${includeDrafts ? " including drafts" : ""}, ${findings.length} finding(s).`,
  );

  for (const severity of order) {
    const group = findings.filter((f) => f.severity === severity);
    console.log(`\n${severity} — ${group.length}   (${explain[severity]})`);
    if (!group.length) {
      console.log("  none");
      continue;
    }
    // By product, so one product's problems are fixed in one visit to Studio.
    const byProduct = new Map<string, string[]>();
    for (const f of group)
      byProduct.set(f.product, [
        ...(byProduct.get(f.product) ?? []),
        f.problem,
      ]);
    for (const [product, problems] of byProduct) {
      console.log(`  ${product.slice(0, 62)}`);
      for (const problem of problems) console.log(`      ${problem}`);
    }
  }

  // Not a finding — "Out of Stock" is an honest answer, not a mistake. But it
  // is the one thing that decides whether a visitor can spend money today, and
  // it is easy to leave set on a product that has since come back in.
  const byStock = new Map<string, { count: number; value: number }>();
  for (const row of rows) {
    const key = row.stockStatus ?? "not set";
    const entry = byStock.get(key) ?? { count: 0, value: 0 };
    byStock.set(key, {
      count: entry.count + 1,
      value: entry.value + (row.price ?? 0),
    });
  }
  console.log("\nStock");
  for (const [status, { count, value }] of [...byStock].sort(
    (a, b) => b[1].count - a[1].count,
  )) {
    const unbuyable = status === "Out of Stock" || status === "Coming Soon";
    console.log(
      `  ${status.padEnd(14)} ${String(count).padStart(3)} product(s)   ` +
        `£${Math.round(value).toLocaleString("en-GB").padStart(8)}` +
        `${unbuyable ? "   ← cannot be bought" : ""}`,
    );
  }

  const blocking = findings.filter((f) => f.severity === "BLOCKING").length;
  console.log(
    blocking
      ? `\n${blocking} blocking problem(s). Those products cannot be sold as they stand.\n`
      : "\nNothing blocking — every product is complete enough to sell. Anything\n" +
          "marked above as out of stock is a stock decision, not a missing field.\n",
  );
}

main().catch((err) => {
  console.error("audit-products failed:", err);
  process.exit(1);
});
