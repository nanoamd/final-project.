/**
 * Which drafts are safe to publish right now, and which are not.
 *
 * Damien: "can i publish products whilst i wait for rewrites?" The answer is
 * different for three groups, and the difference matters enough to compute
 * rather than estimate.
 *
 *   BLOCKED   — a published version already exists and is better. Publishing
 *               replaces a good live page with a worse one. Never.
 *   NOT READY — nothing to destroy, but the product cannot be sold or would
 *               embarrass us: no price, no supplier, or copy that admits it
 *               does not know what the product is.
 *   READY     — new page, sellable, and the copy stands up.
 *
 * Read-only.
 *
 *   pnpm tsx --env-file=.env.local scripts/publishable-now.ts
 */
import { createClient } from "@sanity/client";

import { scoreProduct } from "../src/lib/catalog/quality";
import {
  type ProductDocument,
  QUALITY_PROJECTION,
  toQualityInput,
} from "../src/lib/catalog/quality-input";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

type Row = ProductDocument & { _createdAt: string };

async function main() {
  const rows: Row[] = await client.fetch(
    `*[_type == "product"] ${QUALITY_PROJECTION}`,
  );

  const publishedIds = new Set(
    rows.filter((r) => !r._id.startsWith("drafts.")).map((r) => r._id),
  );

  const ready: { title: string; price: number; category: string }[] = [];
  const blocked: string[] = [];
  const reasons = new Map<string, number>();
  const note = (reason: string) =>
    reasons.set(reason, (reasons.get(reason) ?? 0) + 1);

  for (const doc of rows) {
    if (!doc._id.startsWith("drafts.")) continue;
    const base = doc._id.replace(/^drafts\./, "");

    // A live page already exists. See audit-draft-regressions.ts — 90 of the
    // 94 in this position are worse in draft, so this group is off limits
    // until each has been compared by hand.
    if (publishedIds.has(base)) {
      blocked.push(doc.title ?? base);
      note("a better version is already live");
      continue;
    }

    const result = scoreProduct(toQualityInput(doc));
    const blockers = result.findings.filter((f) => f.severity === "blocker");

    if (blockers.length > 0) {
      // Report the single most decisive reason rather than all of them, so the
      // counts add up to the number of products.
      note(blockers[0]!.message.replace(/\d+/g, "N"));
      continue;
    }
    if (
      result.findings.some((f) =>
        /does not know something|placeholder|template syntax/.test(f.message),
      )
    ) {
      note("copy still admits it does not know something");
      continue;
    }
    if (result.tier === "REVIEW") {
      note("scores REVIEW on quality");
      continue;
    }

    ready.push({
      title: doc.title ?? base,
      price: doc.price ?? 0,
      category: doc.category ?? "—",
    });
  }

  const drafts = rows.filter((r) => r._id.startsWith("drafts.")).length;
  console.log(`\nDrafts: ${drafts}\n`);
  console.log(`  READY to publish now:       ${ready.length}`);
  console.log(
    `  BLOCKED (would replace a better live page): ${blocked.length}`,
  );
  console.log(
    `  NOT READY:                  ${drafts - ready.length - blocked.length}`,
  );

  console.log(`\n──── why the rest are not ready ────`);
  for (const [reason, count] of [...reasons]
    .filter(([r]) => r !== "a better version is already live")
    .sort((a, b) => b[1] - a[1]))
    console.log(`  ${String(count).padStart(4)}  ${reason.slice(0, 78)}`);

  if (ready.length) {
    console.log(`\n──── safe to publish tonight ────`);
    ready.sort((a, b) => b.price - a.price);
    for (const item of ready.slice(0, 40))
      console.log(
        `  £${String(item.price).padStart(7)}  ${item.category.padEnd(24)}  ${item.title.slice(0, 52)}`,
      );
    if (ready.length > 40) console.log(`  …and ${ready.length - 40} more`);
  }
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
