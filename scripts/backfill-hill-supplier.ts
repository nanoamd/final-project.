/**
 * Attaches the Hill Interiors supplier to the imported drafts, and backfills the
 * two fields the importer dropped.
 *
 * The importer writes `supplierSku`, dimensions and `sourceUrl`, but it has never
 * set a `supplier` reference — every product imported before this was linked to its
 * supplier by hand in Studio. Across 102 drafts that is not a job anyone finishes,
 * and without it two things silently break: the margin report groups by supplier, and
 * "which supplier does this come from" is the first question asked when a customer
 * reports a fault.
 *
 * It also backfills **weight**, which matters more than it sounds. Hill charge
 * carriage by weight — £6.99 to 10kg, £9.99 to 20kg, £14.99 to 40kg, £24.99 over,
 * two-man from £49.99 at 35kg, plus £10 to Scotland — so weight is what decides
 * whether a £40 chair is profitable at all. The importer's JSON reader only takes
 * title, description, images, sku, brand, price and sourceUrl, so `weightKg` and
 * `stockQuantity` from the feed were quietly discarded.
 *
 * Matched on `supplierSku` against the shortlist the selector produced, so it only
 * touches documents whose code appears in that file. Idempotent: re-running sets the
 * same values.
 *
 *   pnpm tsx --env-file=.env.local scripts/backfill-hill-supplier.ts <shortlist.json>
 *   pnpm tsx --env-file=.env.local scripts/backfill-hill-supplier.ts <shortlist.json> --apply
 */
import { readFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const shortlistPath = process.argv[2];
const apply = process.argv.includes("--apply");

if (!shortlistPath || shortlistPath.startsWith("--")) {
  console.error(
    "Usage: pnpm tsx --env-file=.env.local scripts/backfill-hill-supplier.ts <shortlist.json> [--apply]",
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

const SUPPLIER_ID = "supplier-hill-interiors";

interface ShortlistEntry {
  sku?: string;
  weightKg?: number;
  colour?: string;
  material?: string;
}

async function main() {
  const shortlist = JSON.parse(
    readFileSync(shortlistPath!, "utf8"),
  ) as ShortlistEntry[];
  const byCode = new Map<string, ShortlistEntry>();
  for (const entry of shortlist)
    if (entry.sku) byCode.set(String(entry.sku), entry);

  const drafts = await client.fetch<
    {
      id: string;
      title: string;
      sku: string;
      supplier: string | null;
      weight: number | null;
    }[]
  >(
    `*[_type == "product" && _id in path("drafts.**") && defined(supplierSku)]{
      "id": _id, title, "sku": supplierSku,
      "supplier": supplier._ref, "weight": weightKg
    }`,
  );

  const targets = drafts.filter((d) => byCode.has(String(d.sku)));

  console.log(
    `\n${shortlist.length} in the shortlist · ${drafts.length} drafts with a supplier code · ` +
      `${targets.length} match\n${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  const needsSupplier = targets.filter((t) => t.supplier !== SUPPLIER_ID);
  const needsWeight = targets.filter(
    (t) => !t.weight && byCode.get(String(t.sku))?.weightKg,
  );
  console.log(
    `  ${needsSupplier.length} need the supplier reference\n` +
      `  ${needsWeight.length} need a weight\n`,
  );

  if (!apply) {
    for (const t of targets.slice(0, 6)) {
      const entry = byCode.get(String(t.sku))!;
      console.log(
        `  ${t.sku}  ${entry.weightKg ?? "?"}kg  ${t.title.slice(0, 52)}`,
      );
    }
    if (targets.length > 6) console.log(`  … and ${targets.length - 6} more`);
    console.log("\nDry run — nothing written. Re-run with --apply.\n");
    return;
  }

  // The supplier document has to exist before anything can reference it. Created,
  // not assumed: the other four suppliers were seeded by earlier scripts and this
  // one has never existed.
  await client.createIfNotExists({
    _id: SUPPLIER_ID,
    _type: "supplier",
    name: "Hill Interiors",
    website: "https://www.hill-interiors.com",
  });
  console.log("Supplier document ready: Hill Interiors");

  let patched = 0;
  for (const target of targets) {
    const entry = byCode.get(String(target.sku))!;
    const set: Record<string, unknown> = {
      supplier: { _type: "reference", _ref: SUPPLIER_ID },
    };
    if (entry.weightKg) set.weightKg = entry.weightKg;
    await client.patch(target.id).set(set).commit({ visibility: "async" });
    patched += 1;
  }

  console.log(`\nLinked ${patched} drafts to Hill Interiors.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
