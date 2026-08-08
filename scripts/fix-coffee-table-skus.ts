/**
 * Fixes two SKU problems in the coffee-table range.
 *
 * 1. Witley carries Abberley's SKU. Both products were live with
 *    KK-CT-ABB-BRN-001, which Merchant Center treats as one item — the second
 *    listing is dropped or merged into the first, and any order export cannot
 *    tell which table was bought.
 *
 * 2. Bentley, added today, has no SKU at all. Everything else about it is
 *    complete: £895, in stock, four images, weight and dimensions.
 *
 * The convention is unambiguous from the six existing values —
 * KK-CT-<model>-<colour>-001, three letters each:
 *
 *   KK-CT-ABB-BRN-001  abberley-coffee-table-brown
 *   KK-CT-CRO-WHT-001  crofton-white-marble-coffee-table
 *   KK-CT-ELM-IVY-001  elmley-coffee-table-ivory
 *   KK-CT-OVB-BRN-001  overbury-coffee-table-chocolate-brown
 *   KK-CT-PER-OAK-001  pershore-rectangular-aged-oak-coffee-table
 *
 * Aborts rather than writing if a target SKU is already in use, or if the
 * current value is not the one expected — if someone has edited these by hand
 * since, that edit wins and this script should not silently undo it.
 *
 * Dry run by default. Add --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/fix-coffee-table-skus.ts
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

const FIXES: { slug: string; expect: string | null; sku: string }[] = [
  {
    slug: "witley-coffee-table",
    expect: "KK-CT-ABB-BRN-001",
    sku: "KK-CT-WIT-OAK-001",
  },
  { slug: "bentley-coffee-table-oak", expect: null, sku: "KK-CT-BEN-OAK-001" },
];

async function main() {
  const inUse = new Set(
    await client.fetch<string[]>(
      `*[_type == "product" && defined(sku)].sku`,
      {},
    ),
  );

  const planned: {
    _id: string;
    title: string;
    from: string | null;
    sku: string;
  }[] = [];

  for (const fix of FIXES) {
    // Published and draft alike: a draft copy keeps the wrong SKU otherwise and
    // reinstates it the moment someone publishes.
    const docs = await client.fetch<
      { _id: string; title: string; sku: string | null }[]
    >(`*[_type == "product" && slug.current == $slug]{_id, title, sku}`, {
      slug: fix.slug,
    });
    if (!docs.length) {
      console.error(`✗ ${fix.slug}: no product with this slug — aborting.`);
      process.exit(1);
    }
    if (inUse.has(fix.sku)) {
      console.error(`✗ ${fix.sku} is already in use — aborting.`);
      process.exit(1);
    }
    for (const doc of docs) {
      if (doc.sku === fix.sku) continue;
      if ((doc.sku ?? null) !== fix.expect) {
        console.error(
          `✗ ${fix.slug}: expected SKU ${fix.expect ?? "none"}, found ${doc.sku ?? "none"}.\n` +
            "  Someone has changed it since this script was written. Leaving it alone.",
        );
        process.exit(1);
      }
      planned.push({
        _id: doc._id,
        title: doc.title,
        from: doc.sku ?? null,
        sku: fix.sku,
      });
    }
  }

  if (!planned.length) {
    console.log("\nNothing to do — both SKUs are already correct.\n");
    return;
  }

  console.log("");
  for (const p of planned)
    console.log(
      `  ${(p.from ?? "(none)").padEnd(20)} → ${p.sku}   ${p._id.startsWith("drafts.") ? "[draft] " : ""}${p.title.slice(0, 44)}`,
    );
  console.log("");

  if (!apply) {
    console.log("Dry run — nothing written. Re-run with --apply.\n");
    return;
  }
  for (const p of planned) {
    await client.patch(p._id).set({ sku: p.sku }).commit();
    console.log(`✓ ${p.sku}  ${p.title.slice(0, 50)}`);
  }
  console.log("\nDone.\n");
}

main().catch((err) => {
  console.error("fix-coffee-table-skus failed:", err);
  process.exit(1);
});
