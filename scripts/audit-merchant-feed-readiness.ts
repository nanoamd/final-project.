/**
 * Pre-flight validation for the Google Merchant Center feed, run against the
 * exact query the feed route uses.
 *
 * The feed at /api/feeds/google-merchant is complete and gated off behind
 * MERCHANT_FEED_ENABLED. The first thing Merchant Center does on a new
 * scheduled fetch is disapprove everything it cannot accept, and the
 * diagnostics that explain why arrive item by item, days later. Every
 * disapproval below is knowable now, from data already in Sanity, before the
 * account exists.
 *
 * Split into two grades, because they are not the same problem:
 *
 *   BLOCKING  Google rejects the item outright. It will not appear in free
 *             listings at all until the field exists.
 *   WARNING   The item is accepted but handicapped — no brand narrows which
 *             queries it can match, an unparseable lead time falls back to
 *             the account-wide handling default, out-of-stock items are
 *             accepted and then not shown.
 *
 * Read-only. Takes no token and writes nothing.
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-merchant-feed-readiness.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { googleAvailability } from "@/lib/catalog/delivery";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

/**
 * The feed route's own query, verbatim, minus the hotspot/crop plumbing that
 * only matters for building the image URL. Auditing anything other than the
 * exact set the feed sends would report on a different catalogue than the one
 * Google is about to read.
 */
const FEED_QUERY = /* groq */ `
*[_type == "product" && !(_id in path("drafts.**")) && defined(category->slug.current)] {
  "slug": slug.current,
  "category": category->slug.current,
  "categoryName": category->title,
  "departmentName": category->department->title,
  "title": title,
  summary,
  price,
  currency,
  "hasHeroRef": defined(gallery[0].asset._ref),
  "image": gallery[0].asset->url,
  "brand": brand->name,
  gtin,
  mpn,
  sku,
  stockStatus,
  deliveryLeadTime,
  "supplierName": supplier->name
}`;

interface FeedRow {
  slug: string | null;
  category: string | null;
  categoryName: string | null;
  departmentName: string | null;
  title: string | null;
  summary: string | null;
  price: number | null;
  currency: string | null;
  hasHeroRef: boolean;
  image: string | null;
  brand: string | null;
  gtin: string | null;
  mpn: string | null;
  sku: string | null;
  stockStatus: string | null;
  deliveryLeadTime: string | null;
  supplierName: string | null;
}

/** The feed route's own handling-time parser, so this reports what it emits. */
function parsesToHandlingTime(leadTime: string | null): boolean {
  if (!leadTime) return false;
  const match = /(\d+)\s*[-–—]\s*(\d+)\s*(day|week|month)/i.exec(leadTime);
  if (!match) return false;
  const perUnit = { day: 1, week: 7, month: 30 }[match[3]!.toLowerCase()];
  if (!perUnit) return false;
  const min = Number(match[1]) * perUnit;
  const max = Number(match[2]) * perUnit;
  return Boolean(min) && max >= min;
}

/** Google truncates a Shopping title past 150 characters. */
const MAX_TITLE = 150;
/** Google's hard cap on description length. */
const MAX_DESCRIPTION = 5000;
/** Shorter than this is accepted but gives Google almost nothing to match on. */
const THIN_DESCRIPTION = 30;

type Grade = "BLOCKING" | "WARNING";

interface Finding {
  grade: Grade;
  code: string;
  detail: string;
}

function auditRow(row: FeedRow): Finding[] {
  const findings: Finding[] = [];
  const blocking = (code: string, detail: string) =>
    findings.push({ grade: "BLOCKING", code, detail });
  const warning = (code: string, detail: string) =>
    findings.push({ grade: "WARNING", code, detail });

  // g:id — without a slug there is no stable identifier and no working link.
  if (!row.slug?.trim())
    blocking("missing-id", "No slug: g:id would be empty.");

  if (!row.title?.trim()) {
    blocking("missing-title", "No title.");
  } else if (row.title.length > MAX_TITLE) {
    warning(
      "title-too-long",
      `Title is ${row.title.length} chars; Google truncates past ${MAX_TITLE}.`,
    );
  }

  // description — a required attribute, not a recommended one.
  if (!row.summary?.trim()) {
    blocking(
      "missing-description",
      "No summary: g:description would be empty.",
    );
  } else if (row.summary.length > MAX_DESCRIPTION) {
    blocking(
      "description-too-long",
      `Summary is ${row.summary.length} chars; Google's cap is ${MAX_DESCRIPTION}.`,
    );
  } else if (row.summary.trim().length < THIN_DESCRIPTION) {
    warning(
      "description-thin",
      `Summary is only ${row.summary.trim().length} chars.`,
    );
  }

  // image_link — no image is an outright disapproval, every time.
  if (!row.hasHeroRef && !row.image) {
    blocking("missing-image", "No gallery image: g:image_link is omitted.");
  }

  // price — 0 or missing is rejected.
  if (row.price === null || row.price === undefined) {
    blocking("missing-price", "No price.");
  } else if (!(row.price > 0)) {
    blocking("price-not-positive", `Price is ${row.price}.`);
  }

  // link — built as /shop/<category>/<slug>; the query already requires a
  // category, so this only catches a category that exists but has no slug.
  if (!row.category?.trim()) {
    blocking("missing-category", "No category slug: the product link breaks.");
  }

  // availability — read from the feed's own mapping rather than a copy of it,
  // so this cannot drift from what Google is actually sent. Anything landing
  // on "out of stock" is accepted by Google and then shown to nobody, which is
  // silent and so worth naming.
  const stock = row.stockStatus?.trim() ?? "";
  if (googleAvailability(row.stockStatus) === "out of stock") {
    warning(
      "not-shown-out-of-stock",
      stock
        ? `stockStatus "${stock}" sends 'out of stock', so this gets no impressions.`
        : "No stockStatus, sending 'out of stock'.",
    );
  }

  // brand — required for essentially everything Kaiku sells. identifier_exists
  // covers the absence of a GTIN/MPN; it does not excuse a missing brand.
  if (!row.brand?.trim()) {
    blocking(
      "missing-brand",
      "No brand. Google requires it for these categories; identifier_exists does not substitute.",
    );
  }

  // gtin/mpn — legitimately absent on own-brand goods, and the feed already
  // declares identifier_exists:no for those. Reported to size the set, since
  // an item with no identifier competes less well on matched queries.
  if (!row.gtin?.trim() && !row.mpn?.trim()) {
    warning(
      "no-identifier",
      "No GTIN or MPN, so the feed declares identifier_exists:no.",
    );
  }

  if (!parsesToHandlingTime(row.deliveryLeadTime)) {
    warning(
      "handling-time-unparseable",
      `deliveryLeadTime ${row.deliveryLeadTime ? `"${row.deliveryLeadTime}"` : "missing"} does not parse; falls back to the account handling default.`,
    );
  }

  const currency = (row.currency || "GBP").toUpperCase();
  if (currency !== "GBP") {
    warning(
      "unexpected-currency",
      `Currency is ${currency}; the account is configured in GBP.`,
    );
  }

  return findings;
}

async function main() {
  const rows: FeedRow[] = await client.fetch(FEED_QUERY);
  console.log(
    `Auditing ${rows.length} published products the feed would send.\n`,
  );

  const byCode = new Map<
    string,
    { grade: Grade; detail: string; slugs: string[] }
  >();
  const perProduct: {
    slug: string | null;
    title: string | null;
    findings: Finding[];
  }[] = [];

  let blockedCount = 0;

  for (const row of rows) {
    const findings = auditRow(row);
    if (!findings.length) continue;

    if (findings.some((f) => f.grade === "BLOCKING")) blockedCount += 1;
    perProduct.push({ slug: row.slug, title: row.title, findings });

    for (const finding of findings) {
      const existing = byCode.get(finding.code);
      if (existing) existing.slugs.push(row.slug ?? "(no slug)");
      else
        byCode.set(finding.code, {
          grade: finding.grade,
          detail: finding.detail,
          slugs: [row.slug ?? "(no slug)"],
        });
    }
  }

  const ordered = [...byCode.entries()].sort((a, b) => {
    if (a[1].grade !== b[1].grade) return a[1].grade === "BLOCKING" ? -1 : 1;
    return b[1].slugs.length - a[1].slugs.length;
  });

  for (const grade of ["BLOCKING", "WARNING"] as Grade[]) {
    const entries = ordered.filter(([, value]) => value.grade === grade);
    if (!entries.length) continue;
    console.log(`--- ${grade} ---`);
    for (const [code, value] of entries) {
      console.log(`${String(value.slugs.length).padStart(4)}  ${code}`);
      console.log(`      ${value.detail}`);
      console.log(`      e.g. ${value.slugs.slice(0, 3).join(", ")}`);
    }
    console.log("");
  }

  const clean = rows.length - perProduct.length;
  console.log("=== Summary ===");
  console.log(`Products the feed would send:        ${rows.length}`);
  console.log(`Would be REJECTED by Google:         ${blockedCount}`);
  console.log(
    `Accepted but handicapped (warnings): ${perProduct.length - blockedCount}`,
  );
  console.log(`Clean, no findings at all:           ${clean}`);
  console.log(
    `\nApprovable today: ${rows.length - blockedCount} of ${rows.length} (${Math.round(((rows.length - blockedCount) / Math.max(rows.length, 1)) * 100)}%).`,
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-08-merchant-feed-readiness.json",
    `${JSON.stringify(
      {
        auditedAt: new Date().toISOString(),
        total: rows.length,
        blockedCount,
        clean,
        byCode: Object.fromEntries(
          ordered.map(([code, value]) => [
            code,
            {
              grade: value.grade,
              count: value.slugs.length,
              slugs: value.slugs,
            },
          ]),
        ),
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    "\nFull per-code slug lists: docs/change-log/2026-09-08-merchant-feed-readiness.json",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
