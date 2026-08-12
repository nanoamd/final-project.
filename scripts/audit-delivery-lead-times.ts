/**
 * Every delivery timeframe the catalogue promises, with a count against each.
 *
 * The brief asks for this to find inconsistent delivery promises. It reports and
 * changes nothing — the standing instruction is not to alter lead times.
 *
 * What makes it more than a `group by`: the values are free text, so "7-10
 * days", "7–10 days" (en dash), "7 to 10 days" and "1-2 weeks" are four strings
 * meaning roughly two things. Grouping on the raw string would report a tidy
 * list of unique values and hide the actual inconsistency. So each value is also
 * parsed into a range of days, and the report groups on that — which is what
 * surfaces two products promising the same thing in different words, and the
 * reverse: one word covering different promises.
 *
 * Read-only.
 *   pnpm tsx --env-file=.env.local scripts/audit-delivery-lead-times.ts
 */
import { createClient } from "@sanity/client";

import { leadTimeLabel, parseLeadTime } from "./lib/lead-time";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

interface Row {
  title: string | null;
  slug: string | null;
  leadTime: string | null;
  supplier: string | null;
  category: string | null;
  price: number | null;
  stockStatus: string | null;
}

/** The bands the brief asks for, in its own terms. */
const BANDS: { name: string; upTo: number }[] = [
  { name: "up to 7 days", upTo: 7 },
  { name: "7–10 days", upTo: 10 },
  { name: "10–14 days", upTo: 14 },
  { name: "2–3 weeks", upTo: 21 },
  { name: "3–4 weeks", upTo: 28 },
  { name: "4+ weeks", upTo: Infinity },
];

function heading(text: string) {
  console.log(`\n${text}\n${"─".repeat(text.length)}`);
}

async function main() {
  const products = await client.fetch<Row[]>(
    `*[_type == "product" && !(_id in path("drafts.**"))]{
      title, "slug": slug.current, "leadTime": deliveryLeadTime,
      "supplier": supplier->name, "category": category->title, price, stockStatus
    }|order(title asc)`,
  );

  console.log(`\n${products.length} published products\n`);

  // --- Coverage -----------------------------------------------------------
  const missing = products.filter((p) => !p.leadTime?.trim());
  heading("Coverage");
  console.log(
    `${products.length - missing.length} of ${products.length} products state a delivery lead time`,
  );
  if (missing.length) {
    console.log(
      `\n${missing.length} with NO lead time — the delivery section has nothing to put in the paragraph:`,
    );
    for (const p of missing)
      console.log(
        `  ✗ ${(p.title ?? p.slug ?? "?").slice(0, 62).padEnd(62)} ${p.supplier ?? "-"}`,
      );
  }

  // --- Exact wording ------------------------------------------------------
  heading("Every timeframe used, verbatim");
  const byRaw = new Map<string, Row[]>();
  for (const p of products) {
    if (!p.leadTime?.trim()) continue;
    const key = p.leadTime.trim();
    byRaw.set(key, [...(byRaw.get(key) ?? []), p]);
  }
  for (const [raw, rows] of [...byRaw].sort(
    (a, b) => b[1].length - a[1].length,
  )) {
    const span = parseLeadTime(raw);
    console.log(
      `  ${String(rows.length).padStart(3)}  "${raw}"${span ? `   → ${leadTimeLabel(span)}` : "   → UNPARSEABLE"}`,
    );
  }
  console.log(`\n  ${byRaw.size} distinct strings in use`);

  // --- The bands the brief asks for ---------------------------------------
  heading("Distribution");
  const banded = new Map<string, number>();
  let unparsed = 0;
  for (const p of products) {
    const span = parseLeadTime(p.leadTime);
    if (!span) {
      if (p.leadTime?.trim()) unparsed += 1;
      continue;
    }
    const band =
      BANDS.find((b) => span.max <= b.upTo) ?? BANDS[BANDS.length - 1]!;
    banded.set(band.name, (banded.get(band.name) ?? 0) + 1);
  }
  for (const band of BANDS) {
    const n = banded.get(band.name) ?? 0;
    console.log(
      `  ${band.name.padEnd(14)} ${String(n).padStart(3)}  ${"█".repeat(n)}`,
    );
  }
  if (unparsed) console.log(`  unparseable    ${String(unparsed).padStart(3)}`);

  // --- The actual inconsistency -------------------------------------------
  // Same promise, different words. This is the thing the report exists to find:
  // a shopper comparing two products should not see "7-10 days" on one and
  // "1-2 weeks" on the other when they mean the same thing.
  heading("Same promise, different wording");
  const bySpan = new Map<string, Set<string>>();
  for (const [raw] of byRaw) {
    const span = parseLeadTime(raw);
    if (!span) continue;
    const key = `${span.min}-${span.max}`;
    bySpan.set(key, new Set([...(bySpan.get(key) ?? []), raw]));
  }
  let clashes = 0;
  for (const [key, variants] of bySpan) {
    if (variants.size < 2) continue;
    clashes += 1;
    const [min, max] = key.split("-").map(Number);
    console.log(
      `  ${leadTimeLabel({ min: min!, max: max! })} is written ${variants.size} ways: ${[...variants].map((v) => `"${v}"`).join(", ")}`,
    );
  }
  if (!clashes) console.log("  none — each timeframe is written one way");

  // --- Per supplier -------------------------------------------------------
  // A supplier quoting several different lead times is usually right (a sauna
  // and an oil ship differently). A supplier quoting the same product range
  // inconsistently is not.
  heading("By supplier");
  const bySupplier = new Map<string, Map<string, number>>();
  for (const p of products) {
    const s = p.supplier ?? "(none)";
    const inner = bySupplier.get(s) ?? new Map<string, number>();
    const key = p.leadTime?.trim() || "(not set)";
    inner.set(key, (inner.get(key) ?? 0) + 1);
    bySupplier.set(s, inner);
  }
  for (const [supplier, inner] of [...bySupplier].sort(
    (a, b) => b[1].size - a[1].size,
  )) {
    console.log(`  ${supplier} — ${inner.size} distinct value(s)`);
    for (const [value, n] of [...inner].sort((a, b) => b[1] - a[1]))
      console.log(`      ${String(n).padStart(3)}  ${value}`);
  }

  // --- Large furniture ----------------------------------------------------
  // The brief wants a doorstep-delivery disclaimer on large furniture. This is
  // the list it applies to, by the only signals the documents carry.
  heading("Large furniture (candidates for the doorstep-delivery note)");
  const large = products.filter(
    (p) =>
      (p.price ?? 0) >= 400 ||
      /sofa|sideboard|chest of drawers|dining table|wardrobe|tv unit|console|bookcase|display unit/i.test(
        p.title ?? "",
      ),
  );
  console.log(`${large.length} products are £400+ or a large-format piece`);
  for (const p of large.slice(0, 40))
    console.log(
      `  £${String(p.price ?? "—").padEnd(6)} ${(p.title ?? "").slice(0, 58).padEnd(58)} ${p.leadTime ?? "(no lead time)"}`,
    );
  if (large.length > 40) console.log(`  … and ${large.length - 40} more`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
