/**
 * Writes `promotionTier` on every product from its real margin.
 *
 * Derived rather than typed, so it cannot drift from the prices. Re-run it after
 * any repricing.
 *
 *   strong  35%+ margin and £25+ cash
 *   viable  30%+ margin and £20+ cash
 *   cash    £250+ cash at 15%+  — a sauna at 18% is still £600 a sale
 *   below   everything else, and it is most of the catalogue
 *
 * Two things consume it. The Merchant feed emits it as `custom_label_0`, which
 * is how a Performance Max campaign targets the products that pay instead of
 * all 907 — left to itself an automated campaign buys the cheapest clicks,
 * which are exactly the products that make nothing. And the sizing calculators
 * use it to recommend something worth selling rather than whatever a category
 * query happens to return first.
 *
 *   pnpm tsx --env-file=.env.local scripts/set-promotion-tier.ts
 *   pnpm tsx --env-file=.env.local scripts/set-promotion-tier.ts --apply
 */
import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");
const token = process.env.SANITY_API_WRITE_TOKEN;
if (apply && !token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — refusing to --apply.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
  perspective: "raw",
});

const CARD_RATE = 0.015;
const CARD_FIXED = 0.2;

export type PromotionTier = "strong" | "viable" | "cash" | "below";

export function promotionTier(
  price: number,
  costPrice: number,
  shippingCost: number | null,
): PromotionTier {
  const keep =
    price - costPrice - (shippingCost ?? 0) - (price * CARD_RATE + CARD_FIXED);
  const margin = keep / price;
  if (margin >= 0.35 && keep >= 25) return "strong";
  if (margin >= 0.3 && keep >= 20) return "viable";
  if (keep >= 250 && margin >= 0.15) return "cash";
  return "below";
}

interface Row {
  _id: string;
  price: number | null;
  costPrice: number | null;
  shippingCost: number | null;
  promotionTier: string | null;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type=="product" && !(_id in path("drafts.**")) && defined(price) && defined(costPrice)]{
      _id, price, costPrice, shippingCost, promotionTier }`,
  );

  const counts: Record<PromotionTier, number> = {
    strong: 0,
    viable: 0,
    cash: 0,
    below: 0,
  };
  const changes: { _id: string; tier: PromotionTier }[] = [];

  for (const row of rows) {
    const tier = promotionTier(row.price!, row.costPrice!, row.shippingCost);
    counts[tier] += 1;
    if (row.promotionTier !== tier) changes.push({ _id: row._id, tier });
  }

  console.log(`\n${rows.length} products`);
  for (const tier of ["strong", "viable", "cash", "below"] as PromotionTier[])
    console.log(`  ${tier.padEnd(7)} ${String(counts[tier]).padStart(4)}`);
  console.log(
    `\n  ${counts.strong + counts.viable + counts.cash} worth advertising`,
  );
  console.log(`  ${changes.length} to update\n`);

  if (!apply) return console.log("Dry run — re-run with --apply.");
  for (const c of changes)
    await client.patch(c._id).set({ promotionTier: c.tier }).commit();
  console.log(`Set promotionTier on ${changes.length} products.`);
}

if (process.argv[1]?.includes("set-promotion-tier")) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
