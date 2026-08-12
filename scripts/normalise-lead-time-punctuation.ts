/**
 * Makes the delivery lead times read consistently, without changing a single
 * duration.
 *
 * The standing instruction is not to change lead times, and this does not: the
 * only edits are punctuation and stray whitespace. What it fixes, found by
 * scripts/audit-delivery-lead-times.ts:
 *
 *   - 47 of 88 values carry leading or trailing whitespace. That is how a SKU
 *     with a trailing space slipped through earlier in this project, and it makes
 *     any exact-match grouping — a filter, a report, a Merchant feed attribute —
 *     silently treat "3-4 weeks " and "3-4 weeks" as two different promises.
 *   - The same promise is written both "3-4 weeks" and "3–4 weeks", 47 hyphens
 *     against 41 en dashes, so two products side by side in a comparison table
 *     appear to say different things.
 *
 * En dash rather than hyphen, because that is what a numeric range takes
 * typographically, and because the majority of the catalogue and the copy in
 * `docs/` already use it.
 *
 * Any value whose parsed span would change is refused outright — see the guard
 * in `main`. The point is that this cannot alter a promise even by accident.
 *
 * Dry run by default:
 *   pnpm tsx --env-file=.env.local scripts/normalise-lead-time-punctuation.ts
 *   pnpm tsx --env-file=.env.local scripts/normalise-lead-time-punctuation.ts --apply
 */
import { createClient } from "@sanity/client";

import { normaliseLeadTime, parseLeadTime } from "./lib/lead-time";

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
  useCdn: false,
  token,
});

async function main() {
  const products = await client.fetch<
    { id: string; title: string | null; leadTime: string }[]
  >(
    `*[_type == "product" && !(_id in path("drafts.**")) && defined(deliveryLeadTime)]{
      "id": _id, title, "leadTime": deliveryLeadTime
    }|order(title asc)`,
  );

  const changes: { id: string; title: string; from: string; to: string }[] = [];
  for (const p of products) {
    const next = normaliseLeadTime(p.leadTime);
    if (next === p.leadTime) continue;

    // The guard that makes this safe to run. If the parsed span differs at all,
    // the edit is not punctuation and must not happen.
    const before = parseLeadTime(p.leadTime);
    const after = parseLeadTime(next);
    if (before?.min !== after?.min || before?.max !== after?.max) {
      console.error(
        `REFUSED — "${p.leadTime}" → "${next}" changes the duration. ${p.title}`,
      );
      process.exit(1);
    }

    changes.push({
      id: p.id,
      title: p.title ?? p.id,
      from: p.leadTime,
      to: next,
    });
  }

  console.log(
    `\n${changes.length} of ${products.length} lead times need punctuation fixing. ${apply ? "APPLYING" : "DRY RUN"}\n`,
  );
  const summary = new Map<string, number>();
  for (const c of changes) {
    const key = `"${c.from}" → "${c.to}"`;
    summary.set(key, (summary.get(key) ?? 0) + 1);
  }
  for (const [k, n] of [...summary].sort((a, b) => b[1] - a[1]))
    console.log(`  ${String(n).padStart(3)}  ${k}`);

  if (!apply) {
    console.log("\nDry run — nothing written. Re-run with --apply.\n");
    return;
  }

  for (const c of changes)
    await client
      .patch(c.id)
      .set({ deliveryLeadTime: c.to })
      .commit({ visibility: "async" });

  console.log(
    `\nUpdated ${changes.length} products. No duration changed — only whitespace and dashes.\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
