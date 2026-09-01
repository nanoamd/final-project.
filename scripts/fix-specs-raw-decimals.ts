/**
 * 63 published Premier Housewares products have raw supplier-feed decimals
 * baked into `specs[].value` strings — e.g. "w120.000000 x d40.000000 x
 * h47.000000" — a field the earlier decimal-dump cleanup never touched
 * (that pass covered `dimensions`/`weight`/`description`, not this
 * separate `specs` array). Found live on kaikuhome.com by Damien, in the
 * Specifications tab.
 *
 * The fix is exact, not a rounding call: `dimensions.length/width/height`
 * on these same documents already store the clean integer (120, 40, 47),
 * confirming the ".000000" is pure formatting padding from the supplier
 * feed, not real precision. `parseFloat(...).toString()` strips it losslessly
 * (120.000000 -> "120", 84.500000 -> "84.5") without ever changing the value.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-specs-raw-decimals.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-specs-raw-decimals.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

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
});

interface Spec {
  _key: string;
  _type: string;
  label: string;
  value: string;
}
interface Product {
  _id: string;
  title: string;
  specs: Spec[];
}

const DECIMAL_RE = /\d+\.\d{4,}/g;

function cleanValue(value: string): string {
  return value.replace(DECIMAL_RE, (match) => parseFloat(match).toString());
}

async function main() {
  const docs: Product[] = await client.fetch(
    `*[_type == "product" && !(_id in path("drafts.**")) && defined(specs)]{_id, title, specs}`,
  );

  const results: {
    id: string;
    title: string;
    changed: { label: string; before: string; after: string }[];
  }[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const doc of docs) {
    const changed: { label: string; before: string; after: string }[] = [];
    const newSpecs = doc.specs.map((spec) => {
      const after = cleanValue(spec.value || "");
      if (after !== spec.value) {
        changed.push({ label: spec.label, before: spec.value, after });
      }
      return { ...spec, value: after };
    });
    if (changed.length === 0) continue;
    results.push({ id: doc._id, title: doc.title, changed });
    if (apply) {
      transaction.patch(doc._id, (p) => p.set({ specs: newSpecs }));
      queued += 1;
    }
  }

  console.log(`Products affected: ${results.length}`);
  for (const r of results) {
    console.log(`\n${r.id} — ${r.title}`);
    for (const c of r.changed) {
      console.log(`  ${c.label}: "${c.before}" -> "${c.after}"`);
    }
  }

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-01-fix-specs-raw-decimals.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
