/**
 * Adds the 20% VAT Premier Housewares actually charges to the stored
 * `costPrice` on all 401 of their products.
 *
 * Damien: *"i think ive messed up my prices for premier housewares products,
 * i forgot about tax, i have hundreds of products listed from them"* — on a
 * screenshot of a Premier Housewares order summary showing 20% tax added on
 * top of the trade subtotal. Kaiku is not VAT-registered
 * (`siteConfig.vatRegistered === false`), so that 20% is not reclaimable —
 * it is a real, permanent cost that was never in `costPrice`.
 *
 * Checked against the live data before writing anything: across all 401
 * Premier Housewares products with both a cost and a price, the assumed
 * margin (cost with no VAT) totals £40,061; the true margin (cost + 20%)
 * totals £21,064. Seven products are currently sold at an outright loss once
 * the real cost is used.
 *
 * **This only ever touches `costPrice`. `price` is never written here.**
 * That is a deliberate departure from Damien's own standing rule for
 * `audit-and-fix-margins.ts` — *"I would not tell Claude to alter the cost
 * price... tell it to adjust the retail selling price when necessary, while
 * preserving the actual supplier cost"* — because that rule exists to stop
 * cost price being used as a lever to manufacture a target margin. This is
 * the opposite case: the stored cost price is the wrong number for what it
 * claims to be (the trade cost, VAT included, that Premier Housewares
 * actually invoices), and "cost price must remain truthful" is exactly what
 * this corrects. Retail price is left for Damien's own decision — see
 * `docs/change-log/2026-08-31-premier-housewares-margin-review.csv` for the
 * full list of what each product's margin becomes once this lands.
 *
 * `priceAdjustment` is not used to log this: it is documented to log
 * *selling*-price changes only and has no field for a cost change, on
 * purpose. The audit trail here is the change-log JSON this script writes,
 * same as every other data-changing script this session.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-premier-housewares-vat-costs.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-premier-housewares-vat-costs.ts --apply
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

const VAT_RATE = 0.2;
const SUPPLIER = "Premier Housewares";

interface Row {
  _id: string;
  title: string;
  costPrice: number | null;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type == "product" && !(_id in path("drafts.**")) && supplier->name == $supplier]{
      _id, title, costPrice
    }`,
    { supplier: SUPPLIER },
  );

  console.log(
    `\n${rows.length} ${SUPPLIER} products. ${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  const results: {
    title: string;
    before: number | null;
    after: number | null;
    status: string;
  }[] = [];

  for (const row of rows) {
    if (typeof row.costPrice !== "number") {
      results.push({
        title: row.title,
        before: null,
        after: null,
        status: "no cost price — skipped",
      });
      continue;
    }

    const after = +(row.costPrice * (1 + VAT_RATE)).toFixed(2);
    results.push({
      title: row.title,
      before: row.costPrice,
      after,
      status: "fix",
    });

    if (apply) {
      await client.patch(row._id).set({ costPrice: after }).commit();
    }
  }

  for (const r of results)
    console.log(
      `  ${r.status.padEnd(22)} ${r.title.slice(0, 50).padEnd(52)} ${
        r.before !== null
          ? `£${r.before.toFixed(2)} -> £${r.after!.toFixed(2)}`
          : ""
      }`,
    );

  const fixed = results.filter((r) => r.status === "fix");
  console.log(
    `\n${fixed.length} cost prices corrected, ${results.length - fixed.length} skipped (no cost price on record).`,
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-premier-housewares-vat-costs.json`,
    JSON.stringify({ applied: apply, vatRate: VAT_RATE, results }, null, 2),
  );

  if (!apply) console.log("\nNothing written. Re-run with --apply.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
