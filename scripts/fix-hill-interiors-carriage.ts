/**
 * Hill Interiors does not deliver free, and the record saying it does was
 * built on circular evidence.
 *
 * The supplier document held:
 *
 *   shippingRule: { kind: "included",
 *     notes: "Free delivery to Kaiku. Evidenced: 70 of 136 products already
 *             recorded at exactly £0 carriage and none above zero, plus
 *             Damien's confirmation that most suppliers deliver free." }
 *   carriageIncludedInCost: true
 *
 * Those £0s were the unfilled default on the product field, and they were then
 * cited as proof that carriage was zero. The data confirmed itself.
 *
 * Hill Interiors' own checkout and product pages say otherwise:
 *
 *   - "Hill Interiors Parcel Delivery Service - £6.99" — next working day for
 *     small parcels.
 *   - "This item can be delivered via a 2 man delivery service to GB mainland
 *     address only for £69.99" (Capri Collection Outdoor Large Corner Set).
 *   - "All 2 Man delivery shipments over 200kg require a quote from our
 *     carriers. You will not be charged shipping at checkout but will still pay
 *     for the goods."
 *   - "All prices ... will be subject to additional VAT and surcharge costs."
 *
 * So carriage is real, it is charged to Kaiku, and because the customer pays £0
 * shipping by Damien's rule it comes straight out of margin. On a £19 pair of
 * LED candles costing £9.86, £6.99 of carriage is most of the gross profit.
 *
 * The 30kg split between the two rates is the one inference here. Hill states
 * both rates but not the threshold; 30kg is the usual ceiling for a single
 * parcel-carrier consignment, and every Hill product either side of it in this
 * catalogue is obviously a parcel or obviously a two-man item. The seven
 * products above 30kg are listed on the console when this runs so Damien can
 * check them against Hill's own Dropship tab.
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
/** Hill's published parcel rate, from their checkout. */
const PARCEL = 6.99;
/** Hill's published two-man GB mainland rate, from a product Dropship tab. */
const TWO_MAN = 69.99;
/** Above this weight a single parcel consignment is not available. Inferred. */
const PARCEL_MAX_KG = 30;

async function main() {
  const products = await client.fetch<
    {
      _id: string;
      title: string;
      price?: number;
      costPrice?: number;
      shippingCost?: number;
      weight?: { value?: number };
    }[]
  >(
    `*[_type=="product" && !(_id in path("drafts.**")) && supplier->name=="Hill Interiors"]{
      _id,title,price,costPrice,shippingCost,weight
    }`,
  );

  const transaction = client.transaction();
  let queued = 0;
  const heavy: string[] = [];
  const unknown: string[] = [];
  const results: Record<string, unknown>[] = [];

  // The supplier rule itself, so margin maths everywhere re-derives correctly
  // from one place rather than from 139 hand-typed numbers.
  if (apply) {
    transaction.patch(SUPPLIER_ID, (p) =>
      p.set({
        carriageIncludedInCost: false,
        shippingRule: {
          _type: "shippingRule",
          kind: "weightBands",
          bands: [
            {
              _type: "shippingBand",
              _key: "parcel",
              maxKg: PARCEL_MAX_KG,
              amount: PARCEL,
            },
            {
              _type: "shippingBand",
              _key: "twoMan",
              maxKg: 200,
              amount: TWO_MAN,
            },
          ],
          notes:
            `£${PARCEL.toFixed(2)} parcel delivery (next working day) up to ${PARCEL_MAX_KG}kg; ` +
            `£${TWO_MAN.toFixed(2)} two-man delivery, GB mainland only, above that. ` +
            "Over 200kg Hill quote per consignment and bill after the order, so those are not " +
            "resolvable here. All rates are subject to VAT and surcharges per Hill's own terms. " +
            "Source: Hill Interiors checkout and product Dropship tabs, September 2026. " +
            "This replaces a 'carriage included' rule whose stated evidence was that products " +
            "already recorded £0 — which was the unfilled default, not a supplier term.",
        },
      }),
    );
    queued += 1;
  }

  for (const p of products) {
    const kg = p.weight?.value;
    if (typeof kg !== "number" || kg <= 0) {
      unknown.push(p.title);
      continue;
    }
    const carriage = kg <= PARCEL_MAX_KG ? PARCEL : TWO_MAN;
    if (kg > PARCEL_MAX_KG) heavy.push(`${kg}kg  ${p.title}`);
    if (p.shippingCost === carriage) continue;

    results.push({
      id: p._id,
      title: p.title,
      kg,
      was: p.shippingCost ?? null,
      now: carriage,
    });
    if (apply) {
      transaction.patch(p._id, (patcher) =>
        patcher.set({ shippingCost: carriage }),
      );
      queued += 1;
    }
  }

  console.log(`Hill Interiors products: ${products.length}`);
  console.log(`  shippingCost corrected: ${results.length}`);
  console.log(`  no weight recorded, left unknown: ${unknown.length}`);
  unknown.forEach((t) => console.log(`     ${t}`));
  console.log(
    `\n  Above ${PARCEL_MAX_KG}kg — CHECK THESE against Hill's Dropship tab, the ${PARCEL_MAX_KG}kg split is my inference:`,
  );
  heavy.forEach((h) => console.log(`     ${h}`));

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
      { apply, parcel: PARCEL, twoMan: TWO_MAN, results },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
