/**
 * Fills in the GTIN (EAN barcode) on products imported from a supplier feed.
 *
 * Every one of the 1,626 products in the Hill Interiors feed carries a valid
 * 13-digit EAN in its `Barcode` field, and not one of the 126 imported drafts got
 * it — the importer reads title, images, SKU, brand, price and URL, and the barcode
 * was never in that list.
 *
 * **This matters specifically for Google Shopping.** Google asks for a GTIN on any
 * product that has one, and listings for branded goods without it get limited
 * visibility or disapproved outright. It is also how Google knows that a Kaiku
 * listing and ten other retailers' listings are the same object — which is exactly
 * the situation here, since the same Hill products appear on HomesDirect365,
 * Olivia's, JB Furniture and the rest. Without a GTIN, Kaiku is an unidentifiable
 * item in a comparison it would otherwise win on price; with one, it is in the
 * comparison.
 *
 * Matched on `supplierSku` against the feed's own product codes, so it can only
 * write a barcode onto the product it belongs to. Idempotent, and it skips any
 * product that already has a GTIN rather than overwriting an editor's value.
 *
 *   pnpm tsx --env-file=.env.local scripts/backfill-gtins.ts <feed.xml>
 *   pnpm tsx --env-file=.env.local scripts/backfill-gtins.ts <feed.xml> --apply
 *   pnpm tsx --env-file=.env.local scripts/backfill-gtins.ts <feed.xml> --apply --published
 */
import { readFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const feedPath = process.argv[2];
const apply = process.argv.includes("--apply");
/** Drafts only by default — published products are live and worth a closer look. */
const includePublished = process.argv.includes("--published");

if (!feedPath || feedPath.startsWith("--")) {
  console.error(
    "Usage: pnpm tsx --env-file=.env.local scripts/backfill-gtins.ts <feed.xml> [--apply] [--published]",
  );
  process.exit(1);
}

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

/**
 * A GTIN has to be 8, 12, 13 or 14 digits and pass its check digit.
 *
 * Validated rather than trusted, because a malformed GTIN is worse than none at
 * all: Google rejects the item and the disapproval has to be found and undone,
 * whereas a missing GTIN merely limits it.
 */
function isValidGtin(value: string): boolean {
  if (!/^\d+$/.test(value)) return false;
  if (![8, 12, 13, 14].includes(value.length)) return false;
  const digits = value.split("").map(Number);
  const check = digits.pop()!;
  // Weights alternate 3 and 1 from the rightmost body digit leftwards.
  const sum = digits
    .reverse()
    .reduce(
      (total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1),
      0,
    );
  return (10 - (sum % 10)) % 10 === check;
}

async function main() {
  const feed = readFileSync(feedPath!, "utf8");
  const barcodeByCode = new Map<string, string>();
  let invalid = 0;
  for (const chunk of feed.split("<Product>").slice(1)) {
    const code = /<Code>([\s\S]*?)<\/Code>/.exec(chunk)?.[1]?.trim();
    const barcode = /<Barcode>([\s\S]*?)<\/Barcode>/.exec(chunk)?.[1]?.trim();
    if (!code || !barcode) continue;
    if (!isValidGtin(barcode)) {
      invalid += 1;
      continue;
    }
    barcodeByCode.set(code, barcode);
  }

  console.log(
    `\n${barcodeByCode.size} valid GTINs in the feed` +
      (invalid ? `, ${invalid} rejected as malformed` : "") +
      `. ${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  const scope = includePublished ? "" : ' && _id in path("drafts.**")';
  const products = await client.fetch<
    { id: string; title: string; sku: string; gtin: string | null }[]
  >(
    `*[_type == "product" && defined(supplierSku)${scope}]{
      "id": _id, title, "sku": supplierSku, gtin
    } | order(title asc)`,
  );

  const targets = products.filter(
    (p) => !p.gtin && barcodeByCode.has(String(p.sku)),
  );
  const already = products.filter((p) => p.gtin).length;

  console.log(
    `  ${products.length} products with a supplier code` +
      `${includePublished ? " (drafts and published)" : " (drafts only)"}\n` +
      `  ${already} already carry a GTIN and are left alone\n` +
      `  ${targets.length} can be filled from the feed\n`,
  );

  for (const target of targets.slice(0, 8))
    console.log(
      `  ${target.sku}  ${barcodeByCode.get(String(target.sku))}  ${target.title.slice(0, 46)}`,
    );
  if (targets.length > 8) console.log(`  … and ${targets.length - 8} more`);

  if (!apply) {
    console.log("\nDry run — nothing written. Re-run with --apply.\n");
    return;
  }

  for (const target of targets)
    await client
      .patch(target.id)
      .set({ gtin: barcodeByCode.get(String(target.sku))! })
      .commit({ visibility: "async" });

  console.log(`\nSet a GTIN on ${targets.length} products.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
