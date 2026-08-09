/**
 * What each product actually leaves you, after the costs that are certain.
 *
 * This exists because "which supplier has the best margin" turned out to be the
 * wrong question. Across the 45 published products, D.I. Designs runs from 70%
 * on the Pershore to 10% on the Elmley, and the four Aosom products average
 * around a third — so an Aosom BBQ at 45% is a better product to list than a
 * D.I. Designs coffee table at 10%, and the supplier's name tells you nothing.
 * The decision is per product.
 *
 * Three costs are subtracted, in this order:
 *
 *   costPrice      what the supplier charges.
 *   shippingCost   carriage, where it is recorded. Delivery is free to the
 *                  customer on every product (one £0 shipping option in
 *                  createCheckoutSession), so this comes out of the margin, not
 *                  the customer's card. 11 products have no figure recorded and
 *                  are marked — their real margin is lower than shown, and on a
 *                  heavy item it can be much lower.
 *   card fees      Stripe UK standard: 1.5% + 20p on a UK card. Small in
 *                  percentage terms and decisive on a £10 margin.
 *
 * Not subtracted, because no figure exists to use: returns, packaging, the cost
 * of a redelivery, or your time. Treat the output as a ceiling.
 *
 * Read-only.
 *   pnpm tsx --env-file=.env.local scripts/margin-report.ts
 *
 * --drafts includes unpublished products, which is the useful mode while
 * deciding whether a batch is worth finishing.
 */
import { createClient } from "@sanity/client";

const includeDrafts = process.argv.includes("--drafts");

/** Stripe UK standard pricing for a UK card, October 2025. */
const CARD_RATE = 0.015;
const CARD_FIXED = 0.2;

/**
 * Below this, listing a product is hard to justify: it takes the same photo
 * work, alt text, specs and FAQ effort as a product that pays properly, and one
 * return wipes out several sales.
 */
const THIN_MARGIN = 0.25;

/** Under this in cash, a single return or redelivery costs more than the sale. */
const THIN_CASH = 15;

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

interface Row {
  _id: string;
  title: string;
  price: number | null;
  costPrice: number | null;
  shippingCost: number | null;
  supplier: string | null;
}

function money(n: number) {
  return `£${n.toFixed(2)}`;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type == "product" ${includeDrafts ? "" : '&& !(_id in path("drafts.**"))'}]{
      _id, title, price, costPrice, shippingCost, "supplier": supplier->name
    }`,
  );

  const priced = rows.filter(
    (r) => typeof r.price === "number" && typeof r.costPrice === "number",
  );
  const unpriced = rows.length - priced.length;

  const analysed = priced
    .map((r) => {
      const price = r.price!;
      const cost = r.costPrice!;
      const carriage = r.shippingCost ?? 0;
      const fees = price * CARD_RATE + CARD_FIXED;
      const keep = price - cost - carriage - fees;
      return {
        ...r,
        price,
        cost,
        carriage,
        fees,
        keep,
        margin: price > 0 ? keep / price : 0,
        carriageUnknown: r.shippingCost === null,
      };
    })
    .sort((a, b) => b.margin - a.margin);

  console.log(
    `\n${analysed.length} product(s)${includeDrafts ? " including drafts" : ""} with a cost price` +
      `${unpriced ? `, ${unpriced} without one and left out` : ""}.\n`,
  );

  console.log(
    "  net%   price     cost    carr    fees     keep   supplier          product",
  );
  for (const r of analysed) {
    // Two different problems, so two different marks: a percentage too thin to
    // repay the listing work, and a cash figure too small to survive one return.
    const flag =
      r.margin < THIN_MARGIN ? " %" : r.keep < THIN_CASH ? " £" : "  ";
    console.log(
      `${String(Math.round(r.margin * 100)).padStart(5)}%` +
        `${money(r.price).padStart(9)}${money(r.cost).padStart(9)}` +
        `${(r.carriageUnknown ? "?" : money(r.carriage)).padStart(8)}` +
        `${money(r.fees).padStart(8)}${money(r.keep).padStart(9)}${flag} ` +
        `${(r.supplier ?? "—").slice(0, 16).padEnd(17)} ` +
        `${(r._id.startsWith("drafts.") ? "[d] " : "") + r.title.slice(0, 40)}`,
    );
  }

  // By supplier, to show how little the supplier's name predicts.
  const bySupplier = new Map<string, typeof analysed>();
  for (const r of analysed) {
    const key = r.supplier ?? "—";
    bySupplier.set(key, [...(bySupplier.get(key) ?? []), r]);
  }
  console.log("\nBy supplier");
  const summaries = [...bySupplier].map(([supplier, items]) => ({
    supplier,
    items,
    mean: items.reduce((a, r) => a + r.margin, 0) / items.length,
  }));
  summaries.sort((a, b) => b.mean - a.mean);
  for (const { supplier, items, mean } of summaries) {
    const margins = items.map((r) => r.margin);
    console.log(
      `  ${supplier.slice(0, 18).padEnd(19)} ${String(items.length).padStart(2)} product(s)   ` +
        `mean ${String(Math.round(mean * 100)).padStart(3)}%   ` +
        `range ${String(Math.round(Math.min(...margins) * 100)).padStart(3)}% to ${String(Math.round(Math.max(...margins) * 100)).padStart(3)}%   ` +
        `total kept ${money(items.reduce((a, r) => a + r.keep, 0))}`,
    );
  }

  const thinPercent = analysed.filter((r) => r.margin < THIN_MARGIN);
  const thinCash = analysed.filter(
    (r) => r.margin >= THIN_MARGIN && r.keep < THIN_CASH,
  );
  const unknown = analysed.filter((r) => r.carriageUnknown);

  console.log(
    `\n%  ${thinPercent.length} product(s) under ${Math.round(THIN_MARGIN * 100)}% net. Same listing work as everything else,\n` +
      `   and one return undoes several sales.`,
  );
  console.log(
    `£  ${thinCash.length} product(s) keep under ${money(THIN_CASH)} in cash despite a healthy percentage.\n` +
      `   Fine as a basket-filler alongside something bigger; not worth a listing on their own.`,
  );

  // The floor nobody set. Checkout offers one shipping option at £0 with no
  // minimum, so a basket holding only a small item ships free — and the cheapest
  // products here do not contain the price of a parcel.
  const cheapest = [...analysed].sort((a, b) => a.keep - b.keep)[0];
  if (cheapest && cheapest.keep < 5) {
    console.log(
      `\nNo minimum order value. Delivery is free on every basket (one £0 shipping\n` +
        `option in createCheckoutSession), so an order holding only ${cheapest.title.slice(0, 34)}\n` +
        `leaves ${money(cheapest.keep)} to pay for a parcel. That is a decision to make before launch:\n` +
        `a minimum order value, a delivery charge under a threshold, or accept it as\n` +
        `the cost of getting a first customer.`,
    );
  }

  if (unknown.length)
    console.log(
      `\n${unknown.length} product(s) have no shippingCost recorded (carr shown as ?). Their\n` +
        `real margin is lower than this, and on a heavy item it can be much lower.\n`,
    );
}

main().catch((err) => {
  console.error("margin-report failed:", err);
  process.exit(1);
});
