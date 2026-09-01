/**
 * Fills the 48 Aosom products with no `deliveryLeadTime` at all — the field
 * itself is empty, which is different from the earlier-fixed bug where the
 * wrong lead time got written into description *text*. This is the field the
 * live buy-box actually reads.
 *
 * No lead time is invented from nothing. The only basis used is: does this
 * product's *own category*, among Aosom's OTHER products in it, already have
 * a dominant answer? `audit-delivery-lead-times.ts` groups every value by its
 * parsed day-span rather than its raw string for exactly this reason — "7–14
 * days" and "7-14 days" are the same promise in different words, and grouping
 * on the raw string would hide that they agree. This script uses the same
 * `parseLeadTime` to decide whether a category's existing Aosom products
 * agree, then writes the exact wording Aosom's own products in that category
 * use most, so no new spelling variant is introduced.
 *
 * A category is eligible only if, among its OTHER (already-set) Aosom
 * products:
 *   - every one of them agrees on the same span, and there are at least two
 *     of them (one product is a data point, not a pattern), OR
 *   - the majority span covers at least 75% of them, with at least three of
 *     them to take a majority over.
 * Anything weaker — a tie, a single comparable product, a majority under
 * 75%, or no other products in the category at all — is left untouched and
 * reported as blocked, with what Damien would need to supply.
 *
 * Never touches a product that already has a value.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-aosom-missing-lead-times.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-aosom-missing-lead-times.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { parseLeadTime } from "./lib/lead-time";

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

const SOURCE = "scripts/fix-aosom-missing-lead-times.ts";
const MIN_MAJORITY_SHARE = 0.75;
const MIN_MAJORITY_SAMPLE = 3;
const MIN_UNANIMOUS_SAMPLE = 2;

interface Row {
  id: string;
  title: string;
  leadTime: string | null;
  category: string | null;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type == "product" && !(_id in path("drafts.**")) && supplier->name == "Aosom"]{
      "id": _id, title, "leadTime": deliveryLeadTime, "category": category->title
    }|order(category asc, title asc)`,
  );

  const byCategory = new Map<string, Row[]>();
  for (const row of rows) {
    const key = row.category ?? "(no category)";
    byCategory.set(key, [...(byCategory.get(key) ?? []), row]);
  }

  const toWrite: {
    id: string;
    title: string;
    category: string;
    newLeadTime: string;
    evidence: string;
  }[] = [];
  const blocked: { category: string; products: string[]; reason: string }[] =
    [];

  for (const [category, items] of byCategory) {
    const missing = items.filter((r) => !r.leadTime?.trim());
    const set = items.filter((r) => r.leadTime?.trim());
    if (!missing.length) continue;

    // Group the SET products by parsed span (the semantic promise), tallying
    // the exact string used within each span-group so the value written back
    // matches Aosom's own house wording for that promise.
    const spanGroups = new Map<
      string,
      { count: number; exact: Map<string, number> }
    >();
    for (const r of set) {
      const span = parseLeadTime(r.leadTime);
      if (!span) continue;
      const key = `${span.min}-${span.max}`;
      const group = spanGroups.get(key) ?? { count: 0, exact: new Map() };
      group.count += 1;
      const exact = r.leadTime!.trim();
      group.exact.set(exact, (group.exact.get(exact) ?? 0) + 1);
      spanGroups.set(key, group);
    }

    const ranked = [...spanGroups.entries()].sort(
      (a, b) => b[1].count - a[1].count,
    );
    const top = ranked[0];
    const n = set.length;
    const share = top ? top[1].count / n : 0;
    const unanimous = top !== undefined && top[1].count === n;

    const eligible =
      top !== undefined &&
      ((unanimous && n >= MIN_UNANIMOUS_SAMPLE) ||
        (!unanimous &&
          n >= MIN_MAJORITY_SAMPLE &&
          share >= MIN_MAJORITY_SHARE));

    if (!eligible) {
      const reason = !top
        ? `no other Aosom product in "${category}" has a lead time set at all (${n} other, ${missing.length} missing) — nothing to base a default on.`
        : n < MIN_UNANIMOUS_SAMPLE
          ? `only ${n} other Aosom product(s) in "${category}" have a lead time set — one data point is not a pattern.`
          : `the ${n} other Aosom products in "${category}" split ${[...ranked].map(([, g]) => g.count).join("/")} across different promises — no dominant value (top share ${(share * 100).toFixed(0)}%, below the ${MIN_MAJORITY_SHARE * 100}% bar).`;
      blocked.push({
        category,
        products: missing.map((m) => m.title),
        reason,
      });
      continue;
    }

    const [, group] = top!;
    const exactRanked = [...group.exact.entries()].sort((a, b) => b[1] - a[1]);
    const value = exactRanked[0]![0];
    const evidence = unanimous
      ? `all ${n} other Aosom products in "${category}" use "${value}"`
      : `${top![1].count} of ${n} (${(share * 100).toFixed(0)}%) other Aosom products in "${category}" use this promise, most commonly written "${value}"`;

    for (const m of missing) {
      toWrite.push({
        id: m.id,
        title: m.title,
        category,
        newLeadTime: value,
        evidence,
      });
    }
  }

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"}\n`);

  console.log(`${toWrite.length} products get a category-derived default:`);
  for (const w of toWrite)
    console.log(`  ✓ [${w.category}] ${w.title} → "${w.newLeadTime}"`);

  console.log(
    `\n${blocked.reduce((n, b) => n + b.products.length, 0)} products remain blocked (no defensible basis):`,
  );
  for (const b of blocked) {
    console.log(`  ✗ ${b.category} — ${b.reason}`);
    for (const p of b.products) console.log(`      - ${p}`);
  }

  if (apply) {
    for (const w of toWrite) {
      await client
        .patch(w.id)
        .set({ deliveryLeadTime: w.newLeadTime })
        .commit();
    }
    console.log(`\nApplied: ${toWrite.length} products updated.`);
  } else {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-aosom-lead-time-defaults.json`,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: SOURCE,
        applied: apply,
        rule: `Category-level default applied only when Aosom's OTHER (already-set) products in that category are unanimous (n>=${MIN_UNANIMOUS_SAMPLE}) or agree on one promise for >=${MIN_MAJORITY_SHARE * 100}% of them (n>=${MIN_MAJORITY_SAMPLE}), grouping by parsed day-span so differently-worded but equal promises count together.`,
        written: toWrite,
        blocked,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
