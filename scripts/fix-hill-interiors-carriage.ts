/**
 * Hill Interiors carriage, from their published rate card.
 *
 * Three corrections in sequence, each one because the previous figure was
 * wrong:
 *
 *  1. Originally the supplier record said carriage was FREE, "evidenced" by 70
 *     of 136 products already recorded at £0. Those £0s were the unfilled
 *     default on the field, so the data was cited as evidence for itself.
 *  2. I replaced that with two bands — £6.99 under 30kg, £69.99 over — inferred
 *     from a checkout screenshot and one product's Dropship tab. The 30kg split
 *     was my own guess and I flagged it as such.
 *  3. Damien sent the actual rate card. The guess was wrong: there are four
 *     standard bands and six two-man bands, and £6.99 only covers the first
 *     10kg, not 30.
 *
 * STANDARD DELIVERY (courier)
 *   up to 10kg  £6.99
 *   10–20kg     £9.99
 *   20–40kg     £14.99
 *   over 40kg   £24.99
 *
 * TWO MAN DELIVERY (room of choice, packaging removed)
 *   up to 35kg  £49.99
 *   35–60kg     £59.99
 *   61–100kg    £69.99
 *   101–150kg   £84.99
 *   151–200kg   £109.99
 *   over 200kg  POA
 *
 * Plus £10 surcharge for the Isle of Man, Isle of Wight, Northern Ireland and
 * the Scottish Highlands & Islands, and two-man is not available at all in BT,
 * HS, IM, IV26-99, KA27, KA28, KW, PA15-78, PH19-50 and ZE.
 *
 * WHICH ROUTE — settled, and it is not weight.
 *
 * This file spent two revisions guessing. First the standard bands up to 40kg
 * and two-man above, with the 40kg threshold flagged in these comments as "the
 * one judgement left in here". Then, when two invoices proved that wrong,
 * two-man at every weight.
 *
 * Both were wrong, because carriage was never a function of weight alone:
 *
 *   Contour sideboard   15kg    Large   £49.99 ex   (two-man, up to 35kg)
 *   Sorelle sofa        39.9kg  Large   £59.99 ex   (two-man, 35-60kg)
 *
 * Hill's feed carries a `Delivery Size` column — Small or Large — and that is
 * what picks the rate card. Weight then picks the band inside it. Guessing on
 * weight alone understated a 15kg sideboard by £40. Treating everything as
 * two-man overstated a 2.6kg framed canvas by £43, which is why 84 of 140 Hill
 * products read as loss-making: candles and picture frames were wearing a
 * sofa's delivery cost.
 *
 * The rule now lives in scripts/lib/hill-carriage.ts, pinned against both
 * invoices, and this script reads `Delivery Size` from the feed rather than
 * inferring it. Rows the model cannot resolve are reported and skipped, not
 * filled in the flattering direction.
 *
 * The customer pays £0 shipping by Damien's rule, so every one of these numbers
 * comes out of Kaiku's margin.
 *
 * Pass the feed exported that morning. Without it the script falls back to the
 * `deliverySize` already stored in Sanity, which is only useful on a re-run:
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-hill-interiors-carriage.ts --feed=/path/to/HillInteriorsDropship.csv
 *   pnpm tsx --env-file=.env.local scripts/fix-hill-interiors-carriage.ts --feed=... --apply
 *
 * Writes `deliverySize` as well as `shippingCost`, so the storefront's two-man
 * postcode warning can key on the service rather than on a weight threshold.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { columnReader, parseCsv } from "./lib/csv";
import {
  COURIER_BANDS,
  hillCarriage,
  type Service,
  TWO_MAN_BANDS,
} from "./lib/hill-carriage";

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

const SUPPLIER_ID = "supplier-hill-interiors";

/**
 * `Delivery Size` and `Weight` per supplier code, read from the feed.
 *
 * The feed is authoritative over Sanity here: `deliverySize` in Sanity is
 * whatever a previous run of this script put there, so trusting it on a fresh
 * run would make the first wrong answer permanent.
 */
function readFeed(path: string): Map<string, { size: string; kg: number }> {
  const rows = parseCsv(readFileSync(path, "utf8"));
  const at = columnReader(rows[0]!);
  const out = new Map<string, { size: string; kg: number }>();
  for (const r of rows.slice(1)) {
    const code = (r[0] ?? "").trim();
    if (!code) continue;
    out.set(code, {
      size: at(r, "Delivery Size").trim(),
      kg: Number(at(r, "Weight")) || 0,
    });
  }
  return out;
}

function feedPath(): string | null {
  const arg = process.argv.find((a) => a.startsWith("--feed="));
  return arg ? arg.slice("--feed=".length) : null;
}

/** Both rate cards, written into the supplier record for whoever reads it next. */
function rateCardNotes(): string {
  const card = (
    label: string,
    bands: readonly { maxKg: number; amount: number }[],
  ) =>
    label +
    ": " +
    bands
      .map(
        (b) =>
          `£${b.amount.toFixed(2)} ${Number.isFinite(b.maxKg) ? `to ${b.maxKg}kg` : "above"}`,
      )
      .join(", ");
  return (
    "Hill Interiors published rate card, ex VAT. " +
    card("Standard courier", COURIER_BANDS) +
    ". " +
    card("Two-man (room of choice, packaging removed)", TWO_MAN_BANDS) +
    ". WHICH ONE APPLIES IS NOT A FUNCTION OF WEIGHT: Hill's feed carries a " +
    "`Delivery Size` column, Small routes to courier and Large to two-man, and " +
    "weight only picks the band inside the chosen service. Pinned against two " +
    "invoices: a 15kg Large Contour sideboard charged £49.99 ex, and a 39.9kg " +
    "Large Sorelle sofa charged £59.99 ex. Costing on weight alone understated " +
    "the first by £40; costing everything as two-man overstates a 2.6kg framed " +
    "canvas by £43. Add £10 for Isle of Man, Isle of Wight, Northern Ireland " +
    "and the Scottish Highlands & Islands; two-man is unavailable in BT, HS, " +
    "IM, IV26-99, KA27, KA28, KW, PA15-78, PH19-50, ZE. Kaiku's own trade " +
    "orders are separate: carriage free over £500 by Palletways, £20 between " +
    "£200 and £499.99, and £200 is the minimum Hill will despatch at all."
  );
}

async function main() {
  const path = feedPath();
  const feed = path ? readFeed(path) : null;
  if (!feed) {
    console.log(
      "No --feed= given. Falling back to the deliverySize already in Sanity,\n" +
        "which is only meaningful if a previous run wrote it. Export today's\n" +
        "feed and pass it for a first run.\n",
    );
  }

  const products = await client.fetch<
    {
      _id: string;
      title: string;
      code: string | null;
      shippingCost?: number;
      deliverySize?: string;
      weight?: { value?: number };
    }[]
  >(
    `*[_type=="product" && !(_id in path("drafts.**")) && supplier->name=="Hill Interiors"]{
      _id,title,"code":coalesce(supplierSku,sku),shippingCost,deliverySize,weight
    }`,
  );

  const transaction = client.transaction();
  let queued = 0;
  const results: Record<string, unknown>[] = [];
  const unresolved: string[] = [];
  const estimated: string[] = [];
  const byService = new Map<Service, number>();
  const byBand = new Map<string, number>();

  if (apply) {
    transaction.patch(SUPPLIER_ID, (patcher) =>
      patcher.set({
        carriageIncludedInCost: false,
        shippingRule: {
          _type: "shippingRule",
          kind: "deliverySizeThenWeight",
          bands: TWO_MAN_BANDS.filter((b) => Number.isFinite(b.maxKg)).map(
            (b, i) => ({
              _type: "shippingBand",
              _key: `b${i}`,
              maxKg: b.maxKg,
              amount: b.amount,
            }),
          ),
          notes: rateCardNotes(),
        },
      }),
    );
    queued += 1;
  }

  for (const product of products) {
    const row = product.code ? feed?.get(product.code.trim()) : undefined;
    const deliverySize = row ? row.size : (product.deliverySize ?? "");
    const weightKg = row?.kg || product.weight?.value;

    const carriage = hillCarriage({ weightKg, deliverySize });
    const clean = product.title.replace(/ \| Kaiku$/, "");

    // Neither input. The lib returns no figure on purpose and neither do we:
    // a guess here is worth between £6.99 and £109.99.
    if (carriage.exVat === 0) {
      unresolved.push(`${carriage.reason} — ${clean}`);
      continue;
    }
    if (carriage.estimated) estimated.push(`${carriage.reason} — ${clean}`);

    byService.set(carriage.service, (byService.get(carriage.service) ?? 0) + 1);
    byBand.set(carriage.label, (byBand.get(carriage.label) ?? 0) + 1);

    const sizeChanged =
      Boolean(row?.size) && product.deliverySize !== row!.size;
    if (product.shippingCost === carriage.incVat && !sizeChanged) continue;

    results.push({
      id: product._id,
      title: product.title,
      kg: weightKg ?? null,
      deliverySize: deliverySize || null,
      service: carriage.service,
      was: product.shippingCost ?? null,
      now: carriage.incVat,
      band: carriage.label,
      estimated: carriage.estimated,
    });

    if (apply) {
      transaction.patch(product._id, (patcher) =>
        patcher.set(
          row?.size
            ? { shippingCost: carriage.incVat, deliverySize: row.size }
            : { shippingCost: carriage.incVat },
        ),
      );
      queued += 1;
    }
  }

  console.log(`Hill Interiors products: ${products.length}`);
  if (feed) console.log(`Feed rows: ${feed.size}`);
  console.log(`  carriage changed: ${results.length}`);

  console.log(`\n  By service:`);
  for (const [service, n] of byService)
    console.log(`    ${String(n).padStart(4)}  ${service}`);

  console.log(`\n  By band (inc VAT, as Sanity stores it):`);
  for (const band of [...COURIER_BANDS, ...TWO_MAN_BANDS]) {
    const n = byBand.get(band.label) ?? 0;
    if (n)
      console.log(
        `    ${String(n).padStart(4)}  £${(band.amount * 1.2).toFixed(2).padStart(7)}  ${band.label}`,
      );
  }

  if (estimated.length) {
    console.log(
      `\n  Written, but from an incomplete row (${estimated.length}) — check these:`,
    );
    estimated.slice(0, 20).forEach((e) => console.log(`    ${e}`));
    if (estimated.length > 20)
      console.log(`    ... and ${estimated.length - 20} more`);
  }

  if (unresolved.length) {
    console.log(`\n  Left alone, nothing to go on (${unresolved.length}):`);
    unresolved.slice(0, 20).forEach((u) => console.log(`    ${u}`));
    if (unresolved.length > 20)
      console.log(`    ... and ${unresolved.length - 20} more`);
  }

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} documents patched.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-fix-hill-interiors-carriage.json",
    JSON.stringify(
      {
        apply,
        courierBands: COURIER_BANDS,
        twoManBands: TWO_MAN_BANDS,
        results,
        estimated,
        unresolved,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
