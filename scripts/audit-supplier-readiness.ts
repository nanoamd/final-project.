/**
 * Is a supplier safe to sell from yet?
 *
 * Damien is making product count the brand's edge and going out to find more
 * suppliers. That is a defensible strategy — but the failure mode it multiplies
 * is the one that has already cost real money once.
 *
 * Hill Interiors sat in the catalogue for a month with carriage recorded as
 * "included", justified by a note reading "70 of 136 products already recorded
 * at exactly £0 carriage". Those £0s were the unfilled default on the field. The
 * data was cited as evidence for itself, nobody checked the supplier's actual
 * terms, and 139 products quietly absorbed £1,250 of carriage. Premier
 * Housewares (546 products) and Aosom (103) are in the same position right now:
 * no carriage terms recorded at all, so their margins are assumed rather than
 * known.
 *
 * Every one of those was onboarded without anyone noticing the gap. With six
 * suppliers that is a bad afternoon. With sixteen it is the business.
 *
 * So this is the gate. It scores each supplier on the things that have to be
 * true before their products can be priced honestly, and says plainly whether
 * they are ready. Run it after adding a supplier and before trusting any margin
 * figure that includes them.
 *
 * Read-only.
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-supplier-readiness.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

interface Supplier {
  _id: string;
  name: string;
  carriageIncludedInCost: boolean | null;
  shippingRule: { kind?: string; notes?: string } | null;
  notes: string | null;
}

interface Check {
  label: string;
  ok: boolean;
  detail: string;
  /** A blocker means margins from this supplier cannot be trusted at all. */
  blocking: boolean;
}

async function main() {
  const suppliers = await client.fetch<Supplier[]>(
    `*[_type=="supplier" && !(_id in path("drafts.**"))]{
      _id, name, carriageIncludedInCost, shippingRule, notes
    } | order(name asc)`,
  );

  const report: Record<string, unknown>[] = [];
  let blocked = 0;

  for (const s of suppliers) {
    const stats = await client.fetch<{
      total: number;
      withCost: number;
      withShip: number;
      withWeight: number;
      withPrice: number;
    }>(
      `{
        "total": count(*[_type=="product" && !(_id in path("drafts.**")) && supplier._ref==$id]),
        "withCost": count(*[_type=="product" && !(_id in path("drafts.**")) && supplier._ref==$id && defined(costPrice)]),
        "withShip": count(*[_type=="product" && !(_id in path("drafts.**")) && supplier._ref==$id && defined(shippingCost)]),
        "withWeight": count(*[_type=="product" && !(_id in path("drafts.**")) && supplier._ref==$id && defined(weight.value)]),
        "withPrice": count(*[_type=="product" && !(_id in path("drafts.**")) && supplier._ref==$id && defined(price)])
      }`,
      { id: s._id },
    );

    // A supplier with no products is not a problem, it is just not started.
    if (stats.total === 0) continue;

    const pct = (n: number) => (stats.total ? (n / stats.total) * 100 : 0);
    const hasRule = Boolean(s.shippingRule?.kind);
    const carriageKnown = hasRule || s.carriageIncludedInCost === true;

    /*
     * A weight-banded rule is useless on a product with no weight, so the two
     * are checked together rather than separately — a supplier can pass "has a
     * rule" and still have unresolvable carriage on most of their range.
     */
    const needsWeight = s.shippingRule?.kind === "weightBands";

    const checks: Check[] = [
      {
        label: "Carriage terms recorded",
        ok: carriageKnown,
        detail: hasRule
          ? `rule: ${s.shippingRule?.kind}`
          : s.carriageIncludedInCost === true
            ? "carriage included in trade price"
            : "NONE — a shipping cost of 0 on their products is meaningless",
        blocking: true,
      },
      {
        label: "Carriage source is stated",
        /*
         * Only a note ON THE RULE counts.
         *
         * The first version accepted the supplier's general `notes` field too,
         * and Aosom passed on "Wholesale cost estimated at ~58% of Aosom sale
         * until B2B feed connected" — a note about cost, saying nothing about
         * carriage. A check that passes on unrelated text is worse than no
         * check, because it reads as verified.
         */
        ok: Boolean(s.shippingRule?.notes?.trim()),
        detail: s.shippingRule?.notes?.trim()
          ? "rule cites its source"
          : "no note on the rule saying where the terms came from",
        // Not blocking, but this is exactly what went wrong on Hill: a note
        // existed and cited the product data as its own evidence.
        blocking: false,
      },
      {
        label: "Every product has a cost price",
        ok: stats.withCost === stats.total,
        detail: `${stats.withCost}/${stats.total} (${pct(stats.withCost).toFixed(0)}%)`,
        blocking: true,
      },
      {
        label: "Every product has a carriage figure",
        ok: stats.withShip === stats.total,
        detail: `${stats.withShip}/${stats.total} (${pct(stats.withShip).toFixed(0)}%)`,
        blocking: true,
      },
      {
        label: "Every product has a price",
        ok: stats.withPrice === stats.total,
        detail: `${stats.withPrice}/${stats.total}`,
        blocking: true,
      },
      ...(needsWeight
        ? [
            {
              label: "Weights present for the weight-banded rule",
              ok: stats.withWeight === stats.total,
              detail: `${stats.withWeight}/${stats.total} — carriage cannot be resolved without a weight`,
              blocking: true,
            } satisfies Check,
          ]
        : []),
    ];

    const failedBlocking = checks.filter((c) => !c.ok && c.blocking);
    const failedWarnings = checks.filter((c) => !c.ok && !c.blocking);
    const ready = failedBlocking.length === 0;
    if (!ready) blocked += 1;

    console.log(
      `\n${ready ? "READY   " : "BLOCKED "} ${s.name}  (${stats.total} products)`,
    );
    for (const c of checks) {
      console.log(
        `   ${c.ok ? "ok  " : c.blocking ? "FAIL" : "warn"}  ${c.label.padEnd(44)} ${c.detail}`,
      );
    }

    report.push({
      supplier: s.name,
      products: stats.total,
      ready,
      blockingFailures: failedBlocking.map((c) => c.label),
      warnings: failedWarnings.map((c) => c.label),
      stats,
    });
  }

  const measurable = report
    .filter((r) => r.ready)
    .reduce((sum, r) => sum + (r.products as number), 0);
  const total = report.reduce((sum, r) => sum + (r.products as number), 0);

  console.log(
    `\n${"=".repeat(70)}\n${blocked} of ${report.length} suppliers blocked.`,
  );
  console.log(
    `Products whose margin can be trusted: ${measurable} of ${total} (${((measurable / total) * 100).toFixed(0)}%)`,
  );
  console.log(
    "\nBlocked does not mean stop selling. It means any margin figure that\n" +
      "includes these products is an assumption, not a measurement.",
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-supplier-readiness.json",
    JSON.stringify({ blocked, measurable, total, report }, null, 2),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
