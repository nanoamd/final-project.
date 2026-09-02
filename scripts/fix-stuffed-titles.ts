/**
 * 50 published products carry a keyword-stuffed middle segment in their
 * title — "Hampton Ivory Shagreen Chest of Drawers | Luxury 3 Drawer Chest
 * | Kaiku" — where the second phrase restates the product type with a
 * marketing adjective in front of it.
 *
 * Two reasons this is worth fixing rather than leaving:
 *
 *   1. Length. Google truncates a title around 55-60 characters. That
 *      example is 71, so the part that gets cut is "| Kaiku" and the tail of
 *      the duplicate — the brand disappears from the SERP and the visible
 *      title ends mid-phrase.
 *   2. It reads as spam. Two near-identical descriptions of the same object
 *      separated by a pipe is a recognised keyword-stuffing pattern, and it
 *      is exactly the voice this catalogue has spent a session removing from
 *      the descriptions.
 *
 * The rule is deliberately narrow: strip the middle segment ONLY when it
 * opens with a marketing qualifier (Luxury, Industrial, Modern, Rustic,
 * Recycled). Middle segments carrying real information are left alone and
 * reported instead — "Ancient Wisdom" is a genuine brand on the essential
 * oils, and "30 x 20 x 5cm" is a real size on the salt plate. Those are
 * judgement calls for Damien, not for a regex.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-stuffed-titles.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-stuffed-titles.ts --apply
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

/** A middle segment opening with one of these is a marketing restatement of
 * the product type, not information the shopper does not already have. */
const MARKETING_OPENER = /^(Luxury|Industrial|Modern|Rustic|Recycled)\b/i;

interface Product {
  _id: string;
  title: string;
}

async function main() {
  const docs: Product[] = await client.fetch(
    `*[_type == "product" && !(_id in path("drafts.**"))]{_id, title}`,
  );

  const fixed: { id: string; before: string; after: string }[] = [];
  const skipped: { id: string; title: string; middle: string }[] = [];

  for (const doc of docs) {
    const parts = (doc.title || "").split("|").map((p) => p.trim());
    if (parts.length < 3) continue;

    // Everything between the product name and the trailing brand.
    const middles = parts.slice(1, -1);
    const kept = middles.filter((m) => !MARKETING_OPENER.test(m));

    if (kept.length === middles.length) {
      skipped.push({
        id: doc._id,
        title: doc.title,
        middle: middles.join(" | "),
      });
      continue;
    }

    const after = [parts[0], ...kept, parts[parts.length - 1]].join(" | ");
    fixed.push({ id: doc._id, before: doc.title, after });
  }

  console.log(`Titles to fix: ${fixed.length}`);
  for (const f of fixed) {
    console.log(`\n  ${f.before}`);
    console.log(
      `  -> ${f.after}  (${f.before.length} -> ${f.after.length} chars)`,
    );
  }

  if (skipped.length) {
    console.log(
      `\n\nLeft alone — middle segment carries real information, your call:`,
    );
    for (const s of skipped) console.log(`  ${s.title}`);
  }

  if (apply && fixed.length) {
    const transaction = client.transaction();
    for (const f of fixed) {
      transaction.patch(f.id, (p) => p.set({ title: f.after }));
    }
    await transaction.commit();
    console.log(`\nApplied: ${fixed.length} titles updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-fix-stuffed-titles.json",
    JSON.stringify({ apply, fixed, skipped }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
