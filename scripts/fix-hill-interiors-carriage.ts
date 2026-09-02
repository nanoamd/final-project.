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
 * WHICH ROUTE. Hill state both tables and do not say which applies to a given
 * product; their Capri Outdoor Large Corner Set page quotes £69.99, which is the
 * two-man 61–100kg band, so furniture goes two-man. The rule below therefore
 * uses the standard bands up to 40kg and the two-man bands above it, because
 * above 40kg the pieces in this catalogue are sofas, dining sets and shelf units
 * that a single courier will not take. That is the one judgement left in here,
 * and it is the expensive direction: if Hill will send a 52kg dining set by
 * standard courier at £24.99 rather than two-man at £59.99, the margin improves
 * by £35 and the band should be changed.
 *
 * The customer pays £0 shipping by Damien's rule, so every one of these numbers
 * comes out of Kaiku's margin.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-hill-interiors-carriage.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-hill-interiors-carriage.ts --apply
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

const SUPPLIER_ID = "supplier-hill-interiors";

/** Where the standard courier stops being an option for this catalogue. */
export const TWO_MAN_FROM_KG = 40;

/**
 * The published bands, lightest first, as `resolveShippingCost` expects.
 * Standard up to 40kg, two-man above — see the header for why.
 */
export const HILL_BANDS: { maxKg: number; amount: number; label: string }[] = [
  { maxKg: 10, amount: 6.99, label: "standard, up to 10kg" },
  { maxKg: 20, amount: 9.99, label: "standard, 10–20kg" },
  { maxKg: 40, amount: 14.99, label: "standard, 20–40kg" },
  { maxKg: 60, amount: 59.99, label: "two-man, 35–60kg" },
  { maxKg: 100, amount: 69.99, label: "two-man, 61–100kg" },
  { maxKg: 150, amount: 84.99, label: "two-man, 101–150kg" },
  { maxKg: 200, amount: 109.99, label: "two-man, 151–200kg" },
];

/** Carriage for one unit, or null above 200kg where Hill quote per consignment. */
export function hillCarriage(
  kg: number,
): { amount: number; label: string } | null {
  const band = HILL_BANDS.find((b) => kg <= b.maxKg);
  return band ? { amount: band.amount, label: band.label } : null;
}

async function main() {
  const products = await client.fetch<
    {
      _id: string;
      title: string;
      shippingCost?: number;
      weight?: { value?: number };
    }[]
  >(
    `*[_type=="product" && !(_id in path("drafts.**")) && supplier->name=="Hill Interiors"]{
      _id,title,shippingCost,weight
    }`,
  );

  const transaction = client.transaction();
  let queued = 0;
  const results: Record<string, unknown>[] = [];
  const unknown: string[] = [];
  const byBand = new Map<string, number>();

  if (apply) {
    transaction.patch(SUPPLIER_ID, (p) =>
      p.set({
        carriageIncludedInCost: false,
        shippingRule: {
          _type: "shippingRule",
          kind: "weightBands",
          bands: HILL_BANDS.map((b, i) => ({
            _type: "shippingBand",
            _key: `b${i}`,
            maxKg: b.maxKg,
            amount: b.amount,
          })),
          notes:
            "Hill Interiors published rate card. Standard courier: £6.99 to 10kg, " +
            "£9.99 to 20kg, £14.99 to 40kg, £24.99 over 40kg. Two-man (room of " +
            "choice, packaging removed): £49.99 to 35kg, £59.99 to 60kg, £69.99 to " +
            "100kg, £84.99 to 150kg, £109.99 to 200kg, POA above. These bands use " +
            "standard up to 40kg and two-man above it, because above 40kg this " +
            "catalogue is sofas, dining sets and shelf units a single courier will " +
            "not carry — Hill's own Capri corner set page quotes the £69.99 two-man " +
            "band. Add £10 for Isle of Man, Isle of Wight, Northern Ireland and the " +
            "Scottish Highlands & Islands; two-man is unavailable in BT, HS, IM, " +
            "IV26-99, KA27, KA28, KW, PA15-78, PH19-50, ZE. Kaiku's own trade orders " +
            "are separate: carriage free over £500 by Palletways, £20 between £200 " +
            "and £499.99, and £200 is the minimum Hill will despatch at all.",
        },
      }),
    );
    queued += 1;
  }

  for (const p of products) {
    const kg = p.weight?.value;
    if (typeof kg !== "number" || kg <= 0) {
      unknown.push(`no weight recorded — ${p.title}`);
      continue;
    }
    const band = hillCarriage(kg);
    if (!band) {
      unknown.push(`${kg}kg, over 200kg so POA — ${p.title}`);
      continue;
    }
    byBand.set(band.label, (byBand.get(band.label) ?? 0) + 1);
    if (p.shippingCost === band.amount) continue;
    results.push({
      id: p._id,
      title: p.title,
      kg,
      was: p.shippingCost ?? null,
      now: band.amount,
      band: band.label,
    });
    if (apply) {
      transaction.patch(p._id, (patcher) =>
        patcher.set({ shippingCost: band.amount }),
      );
      queued += 1;
    }
  }

  console.log(`Hill Interiors products: ${products.length}`);
  console.log(`  shippingCost corrected: ${results.length}`);
  console.log(`\n  Products per band:`);
  for (const b of HILL_BANDS) {
    const n = byBand.get(b.label) ?? 0;
    if (n)
      console.log(
        `    ${String(n).padStart(4)}  £${b.amount.toFixed(2).padStart(6)}  ${b.label}`,
      );
  }
  if (unknown.length) {
    console.log(`\n  Carriage left unknown (${unknown.length}):`);
    unknown.forEach((u) => console.log(`    ${u}`));
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
    JSON.stringify({ apply, bands: HILL_BANDS, results }, null, 2),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
