/**
 * The SaunaPlunge™ Pennine Barrel 6-Person Outdoor Sauna's own `deliveryNotes`
 * says, in full sentences someone deliberately wrote: "This sauna is made to
 * order, with typical delivery taking 4–6 weeks from order confirmation." Its
 * `stockStatus` field said "In Stock" regardless — the schema's own default
 * value, evidently never changed for this product.
 *
 * Found by scripts/audit-and-fix-margins.ts's sibling audit pass: every
 * published product's stockStatus cross-checked against its own deliveryNotes
 * text for exactly this contradiction (Damien's "In Stock vs Made to order"
 * conversion-blocker concern). This was the one match backed by the product's
 * own words rather than an inference from its 4–6 week lead time alone — three
 * other SaunaPlunge products share that lead time but say nothing explicit
 * about being made to order, so they are flagged for Damien to confirm with
 * the supplier rather than changed here on a guess.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-pennine-barrel-stock-status.ts --apply
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
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

async function main() {
  const product = await client.fetch<{
    _id: string;
    title: string;
    stockStatus: string;
    deliveryNotes?: string;
  } | null>(
    `*[_type == "product" && !(_id in path("drafts.**")) && title match "SaunaPlunge™ Pennine Barrel*"][0]{
      _id, title, stockStatus, deliveryNotes
    }`,
  );

  if (!product) {
    console.error("Product not found — nothing to check.");
    process.exit(1);
  }

  if (!/made.to.order/i.test(product.deliveryNotes ?? "")) {
    console.log(
      "deliveryNotes no longer says 'made to order' — no longer applies, leaving stockStatus untouched.",
    );
    return;
  }
  if (product.stockStatus === "Made to Order") {
    console.log("Already 'Made to Order' — nothing to do.");
    return;
  }

  console.log(
    `${product.title}: stockStatus "${product.stockStatus}" contradicts its own deliveryNotes ("made to order").`,
  );
  console.log(apply ? "APPLYING" : "DRY RUN — re-run with --apply to fix.");
  if (!apply) return;

  await client
    .patch(product._id)
    .set({ stockStatus: "Made to Order" })
    .commit();
  console.log("Set stockStatus to 'Made to Order'.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
