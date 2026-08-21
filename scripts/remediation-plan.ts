/**
 * Every open finding in the catalogue, itemised, with a route to closing it.
 *
 * The audit says what is wrong. This says *who can fix each one and how*, which
 * is the difference between a report and a plan. Findings fall into three
 * routes and the split matters enormously:
 *
 *   AUTOMATIC — a script can close it. No judgement, no missing data.
 *   NEEDS DATA — blocked on a fact only the supplier holds. Cannot be invented;
 *                inventing one is the exact failure this audit exists to fix.
 *   NEEDS DAMIEN — a decision that is his, chiefly retail price.
 *
 * Read-only. Writes the full itemised list to disk; changes nothing.
 *
 *   pnpm tsx --env-file=.env.local scripts/remediation-plan.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { type Finding, scoreProduct } from "../src/lib/catalog/quality";
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

type Route = "AUTOMATIC" | "NEEDS DATA" | "NEEDS DAMIEN" | "WRITING";

/**
 * How each finding gets closed.
 *
 * Ordered: the first matching pattern wins, so put the specific before the
 * general. `WRITING` is separated from `AUTOMATIC` because a rewrite is work
 * even when nothing blocks it, and lumping the two together would make the
 * plan look far cheaper than it is.
 */
const ROUTES: { pattern: RegExp; route: Route; how: string }[] = [
  // --- Automatic -------------------------------------------------------
  {
    pattern: /Title does not end with/,
    route: "AUTOMATIC",
    how: "fix-catalogue-tier1.ts --apply",
  },
  {
    pattern: /FAQs? answer nothing|answer nothing/,
    route: "AUTOMATIC",
    how: "fix-catalogue-tier1.ts --apply",
  },
  {
    pattern: /Supplier name or link/,
    route: "AUTOMATIC",
    how: "fix-catalogue-tier1.ts --apply",
  },
  {
    pattern: /internal value threshold/,
    route: "AUTOMATIC",
    how: "fix-catalogue-tier1.ts --apply",
  },
  {
    pattern: /Meta description is .* characters/,
    route: "AUTOMATIC",
    how: "fix-catalogue-tier1.ts --apply",
  },
  {
    pattern: /SKU is not in the house format/,
    route: "AUTOMATIC",
    how: "assign-skus.ts --apply",
  },
  {
    pattern: /No meta title|No meta description/,
    route: "AUTOMATIC",
    how: "rewrite-meta.ts --apply (derives from title, category and summary)",
  },
  {
    pattern:
      /Doubled spacing|repeated back to back|Markdown markup|HTML entity/,
    route: "AUTOMATIC",
    how: "new: fix-catalogue-tier1.ts, text-artefact pass",
  },
  {
    pattern: /Raw template syntax/,
    route: "AUTOMATIC",
    how: "new: strip serialisation garbage, then re-check by hand",
  },
  {
    pattern: /No slug/,
    route: "AUTOMATIC",
    how: "derive from title",
  },

  // --- Needs supplier data ---------------------------------------------
  {
    pattern: /No cost price/,
    route: "NEEDS DATA",
    how: "supplier trade price file — docs/external-data-requirements.md §B",
  },
  {
    pattern: /No carriage cost/,
    route: "NEEDS DATA",
    how: "supplier carriage terms — §A. AW Dropship weight bands are the blocker",
  },
  {
    pattern: /No supplier SKU/,
    route: "NEEDS DATA",
    how: "supplier product file — §E",
  },
  {
    pattern: /No weight recorded/,
    route: "NEEDS DATA",
    how: "supplier spec sheet — §E",
  },
  {
    pattern: /No dimensions/,
    route: "NEEDS DATA",
    how: "supplier spec sheet — §E. Also on the product's own sourceUrl",
  },
  {
    pattern: /does not know something/,
    route: "NEEDS DATA",
    how: "get the fact from sourceUrl, then rewrite. Never invent",
  },
  {
    pattern: /image/i,
    route: "NEEDS DATA",
    how: "supplier image pack — §E",
  },
  {
    pattern: /No supplier\b/,
    route: "NEEDS DAMIEN",
    how: "assign the supplier in Studio",
  },

  // --- Needs Damien ----------------------------------------------------
  {
    pattern: /No retail price|Loss-making|Margin is only/,
    route: "NEEDS DAMIEN",
    how: "prices are Damien's — never imported, never guessed",
  },

  // --- Writing ---------------------------------------------------------
  {
    pattern: /No description at all|Only .* words|too thin/,
    route: "WRITING",
    how: "Tier 3 — write from sourceUrl",
  },
  {
    pattern:
      /concrete fact|length standing in for substance|not one measurement|longer than it needs/,
    route: "WRITING",
    how: "Tier 2 rewrite — target 350–650 words, facts first",
  },
  {
    pattern: /No short summary|summary repeats/,
    route: "WRITING",
    how: "Tier 2 — summary must not echo the description",
  },
  {
    pattern:
      /filler phrases|generic template heading|Sentences average|generated/i,
    route: "WRITING",
    how: "Tier 2 rewrite",
  },
  {
    pattern: /Chatbot phrasing/,
    route: "WRITING",
    how: "Tier 2 — rewrite the sentence, not the phrase",
  },
  {
    pattern: /the supplier|product page they are already on/i,
    route: "WRITING",
    how: "Tier 2 — restate as Kaiku's own knowledge",
  },
];

function routeFor(finding: Finding): { route: Route; how: string } {
  for (const entry of ROUTES) {
    if (entry.pattern.test(finding.message))
      return { route: entry.route, how: entry.how };
  }
  return { route: "WRITING", how: "unclassified — review by hand" };
}

/** Groups a message so "312 words" and "980 words" are one row. */
function shape(message: string): string {
  return message
    .replace(/\d+(?:\.\d+)?/g, "N")
    .replace(/[“"][^”"]*[”"]/g, "…")
    .replace(/\(e\.g\.[^)]*\)/g, "")
    .trim();
}

type Row = ProductDocument & { _createdAt: string };

async function main() {
  const rows: Row[] = await client.fetch(
    `*[_type == "product"] ${QUALITY_PROJECTION}`,
  );

  interface Item {
    id: string;
    title: string;
    published: boolean;
    supplier: string | null;
    severity: Finding["severity"];
    dimension: string;
    message: string;
    route: Route;
    how: string;
  }

  const items: Item[] = [];
  for (const doc of rows) {
    const result = scoreProduct(toQualityInput(doc));
    for (const finding of result.findings) {
      const { route, how } = routeFor(finding);
      items.push({
        id: doc._id,
        title: doc.title ?? "(untitled)",
        published: !doc._id.startsWith("drafts."),
        supplier: doc.supplier ?? null,
        severity: finding.severity,
        dimension: finding.dimension,
        message: finding.message,
        route,
        how,
      });
    }
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/remediation-items.json",
    JSON.stringify({ generatedAt: new Date().toISOString(), items }, null, 0),
  );

  // CSV, because this is a work list somebody will sort and tick off.
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  writeFileSync(
    "docs/change-log/remediation-items.csv",
    [
      "route,severity,published,supplier,product,finding,how",
      ...items.map((i) =>
        [
          i.route,
          i.severity,
          i.published ? "published" : "draft",
          escape(i.supplier ?? ""),
          escape(i.title),
          escape(i.message),
          escape(i.how),
        ].join(","),
      ),
    ].join("\n"),
  );

  // ---- The plan ---------------------------------------------------------
  const byRoute = new Map<Route, Item[]>();
  for (const item of items) {
    if (!byRoute.has(item.route)) byRoute.set(item.route, []);
    byRoute.get(item.route)!.push(item);
  }

  console.log(`\n════ REMEDIATION PLAN — ${items.length} findings ════\n`);
  const order: Route[] = ["AUTOMATIC", "WRITING", "NEEDS DATA", "NEEDS DAMIEN"];
  for (const route of order) {
    const set = byRoute.get(route) ?? [];
    const pct = ((100 * set.length) / items.length).toFixed(1);
    console.log(`\n──── ${route} — ${set.length} findings (${pct}%) ────`);
    const grouped = new Map<string, { count: number; how: string }>();
    for (const item of set) {
      const key = shape(item.message);
      const entry = grouped.get(key) ?? { count: 0, how: item.how };
      entry.count++;
      grouped.set(key, entry);
    }
    for (const [message, entry] of [...grouped].sort(
      (a, b) => b[1].count - a[1].count,
    )) {
      console.log(
        `  ${String(entry.count).padStart(5)}  ${message.slice(0, 76)}`,
      );
      console.log(`         └─ ${entry.how}`);
    }
  }

  console.log("\n──── BY SEVERITY ────");
  for (const severity of ["blocker", "major", "minor"] as const) {
    const set = items.filter((i) => i.severity === severity);
    const auto = set.filter((i) => i.route === "AUTOMATIC").length;
    console.log(
      `  ${severity.padEnd(8)} ${String(set.length).padStart(5)}   of which automatic: ${auto}`,
    );
  }

  console.log("\n──── PUBLISHED vs DRAFT ────");
  const published = items.filter((i) => i.published);
  console.log(`  published  ${String(published.length).padStart(5)}`);
  console.log(
    `  drafts     ${String(items.length - published.length).padStart(5)}`,
  );

  console.log(
    "\nFull itemised list: docs/change-log/remediation-items.csv (one row per finding)",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
