/**
 * Gives every product a code in one format, per Damien: "everything needs an
 * sku made in a certain format making products easy to identify".
 *
 * The format and the reasoning behind it live in src/lib/catalog/sku.ts —
 * shared with the storefront rather than defined here, so Studio, the product
 * page and this script cannot drift apart.
 *
 * **The catalogue currently holds six different formats.** Counted directly:
 * 142 of 235 published products have a code and 93 have none at all, and among
 * those 142 are `KK-CT-ABB-BRN-001` (deliberate), `DI-CT-ABB-BLK-001` (same
 * scheme, different prefix), `AW-ACShop-01` alongside `AW-ACSHOP-08` (same
 * scheme, inconsistent case), `KK-DL-23677`, `HIL-23674`, `KA-HILL-20696`, and
 * bare supplier codes like `24456`. None of that is identifiable at a glance,
 * which is the whole point of the field.
 *
 * **Two safety rules, both deliberate:**
 *
 * 1. A code that already matches the canonical format is never rewritten, so
 *    re-running this is idempotent and the D.I. Designs range Damien numbered
 *    himself keeps its numbers where they already conform.
 * 2. Sequence numbers are assigned per stem across the *whole* catalogue,
 *    drafts included, and existing canonical codes are read first so their
 *    numbers are treated as taken. Two products that reduce to the same stem
 *    therefore get -001 and -002 rather than colliding.
 *
 * Changing a code is safe for anything outward-facing: Merchant Center keys on
 * `g:id`, which is the slug and is untouched, and past orders store the SKU as
 * a snapshot at time of purchase (see src/server/webhooks/stripe.ts), so
 * history stays intact. Every change is still logged to a `skuAssignment`
 * document, because a code that appears on an invoice should be traceable to
 * the moment it changed.
 *
 *   pnpm tsx --env-file=.env.local scripts/assign-skus.ts
 *   pnpm tsx --env-file=.env.local scripts/assign-skus.ts --published-only
 *   pnpm tsx --env-file=.env.local scripts/assign-skus.ts --apply
 */
import { createClient } from "@sanity/client";

import { formatSku, isCanonicalSku, skuStem } from "../src/lib/catalog/sku";

const apply = process.argv.includes("--apply");
const publishedOnly = process.argv.includes("--published-only");
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

const SOURCE = "scripts/assign-skus.ts";

interface Row {
  _id: string;
  title: string;
  sku?: string;
  categorySlug?: string | null;
  primaryColour?: string | null;
}

async function main() {
  // Every product, drafts included, so sequence numbers never collide with a
  // draft that gets published later.
  const rows = await client.fetch<Row[]>(
    `*[_type == "product" && defined(title)]{
      _id, title, sku,
      "categorySlug": category->slug.current,
      primaryColour
    } | order(_id asc)`,
  );

  const considered = publishedOnly
    ? rows.filter((row) => !row._id.startsWith("drafts."))
    : rows;

  console.log(
    `\n${rows.length} products in the catalogue` +
      `${publishedOnly ? ` (${considered.length} published, drafts skipped)` : ""}.` +
      `\n${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  // Existing canonical codes claim their sequence numbers before anything new
  // is handed out — read from every row, not just the considered ones.
  const takenByStem = new Map<string, Set<number>>();
  for (const row of rows) {
    if (!isCanonicalSku(row.sku)) continue;
    const match = /^(.*)-(\d{3})$/.exec(row.sku!);
    if (!match) continue;
    const set = takenByStem.get(match[1]!) ?? new Set<number>();
    set.add(Number(match[2]));
    takenByStem.set(match[1]!, set);
  }

  const nextFree = (stem: string): number => {
    const taken = takenByStem.get(stem) ?? new Set<number>();
    let n = 1;
    while (taken.has(n)) n += 1;
    taken.add(n);
    takenByStem.set(stem, taken);
    return n;
  };

  let assigned = 0;
  let rewritten = 0;
  let alreadyFine = 0;

  for (const row of considered) {
    if (isCanonicalSku(row.sku)) {
      alreadyFine += 1;
      continue;
    }

    const stem = skuStem({
      title: row.title,
      categorySlug: row.categorySlug,
      primaryColour: row.primaryColour,
    });
    const sku = formatSku(stem, nextFree(stem));
    const isDraft = row._id.startsWith("drafts.");

    if (row.sku) {
      rewritten += 1;
      console.log(
        `  ~ ${isDraft ? "draft " : "public"} ${row.title.slice(0, 44).padEnd(44)} ${row.sku.padEnd(28)} -> ${sku}`,
      );
    } else {
      assigned += 1;
      console.log(
        `  + ${isDraft ? "draft " : "public"} ${row.title.slice(0, 44).padEnd(44)} ${"(none)".padEnd(28)} -> ${sku}`,
      );
    }

    if (!apply) continue;

    await client.patch(row._id).set({ sku }).commit();
    await client.create({
      _type: "skuAssignment",
      // Weak, deliberately: a strong reference here once blocked Damien
      // from publishing a draft this had touched — Sanity refuses to delete
      // a document something still strongly references, and publish deletes
      // drafts.X as part of the same transaction. An audit trail should
      // never be able to hold the thing it's auditing hostage.
      product: { _type: "reference", _ref: row._id, _weak: true },
      productTitle: row.title,
      previousSku: row.sku ?? null,
      newSku: sku,
      reason: row.sku
        ? `Rewritten from a non-standard format ("${row.sku}") to the canonical one.`
        : "Assigned — the product had no code at all.",
      source: SOURCE,
      assignedAt: new Date().toISOString(),
    });
  }

  console.log(
    `\n${assigned} assigned (had none), ${rewritten} rewritten (non-standard format), ` +
      `${alreadyFine} already canonical and left alone.\n`,
  );
  console.log(
    apply
      ? "Applied. Every change has a skuAssignment document recording it.\n"
      : "Dry run — nothing written. Re-run with --apply.\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
