/**
 * Writes Hill Interiors' real stock levels into Sanity.
 *
 * ## Why this exists
 *
 * On 25 October a customer paid £81 for the Mistora Hand Painted Canvas. The
 * site said "In Stock". Hill had none until 26 January 2027 — three months.
 * The replacement offered her, the Silvra from the same range, was also listed
 * In Stock and also had none.
 *
 * The data to prevent that was already here. Damien supplied Hill's dropship
 * feed weeks earlier and `reprice-hill-from-dropship-feed.ts` reads it —
 * including its `Available Stock` column, which it uses to decide which
 * products may be promoted. It never wrote that number back to `stockStatus`.
 * So the shop knew which products were sellable and went on telling customers
 * something different.
 *
 * `stockStatus` defaults to "In Stock" in the schema, which means every
 * product ever imported claims availability until somebody says otherwise.
 * Nobody ever did.
 *
 * ## What it writes
 *
 *   Available Stock > 0, Status ACT   -> In Stock
 *   Available Stock = 0, Status ACT   -> Out of Stock
 *   Status is not ACT                 -> Out of Stock
 *
 * `Available Stock` is also written to `stockQuantity`. The checkout guard in
 * `src/server/actions/checkout.ts` only enforces a basket limit where a
 * quantity exists, and 304 of the 768 products claiming In Stock have none, so
 * they pass on status alone. It also makes the product page's "Only N left in
 * stock" line real — that component deliberately stays silent without a
 * quantity rather than invent urgency, and the supplier's own figure is what it
 * was waiting for.
 *
 * Nothing is marked Backorder or Coming Soon. The feed carries a stock number
 * and a status, not a restock date, and "Backorder" to a shopper implies one
 * is known. Out of Stock is the honest word for "we cannot send this today".
 *
 * A product with no matching code in the feed is LEFT ALONE and reported.
 * Silence is not evidence of stock, but neither is an absent row evidence of
 * its absence — the feed may simply not carry that line. Those are listed so
 * they can be checked by hand rather than silently flipped either way.
 *
 * ## Running it
 *
 * The feed is a file Damien exports from Hill's trade portal. Uploads do not
 * survive a container rebuild, so pass the path rather than relying on one
 * being where it was last time:
 *
 *   pnpm tsx scripts/sync-hill-stock.ts --feed=/path/to/HillInteriorsDropship.csv
 *   pnpm tsx scripts/sync-hill-stock.ts --feed=... --apply
 *
 * Dry run by default. `--apply` refuses without SANITY_API_WRITE_TOKEN.
 *
 * **This is only as fresh as the export.** Run it against a feed downloaded
 * that morning, not one from last month.
 */
import { readFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { parseCsv } from "./lib/csv";

/**
 * Re-exported so the existing test keeps importing it from here, and so the
 * parser has one home now that the carriage script reads the same feed.
 */
export { parseCsv };

const apply = process.argv.includes("--apply");
const token = process.env.SANITY_API_WRITE_TOKEN;

/**
 * Argument checks live in here, not at module scope.
 *
 * At module scope they run on import, so the test file could not load this
 * module at all without the process exiting — which is how a script ends up
 * with no tests on the one function worth pinning.
 */
function resolveFeedPath(): string {
  if (apply && !token) {
    console.error("SANITY_API_WRITE_TOKEN is not set — refusing to --apply.");
    process.exit(1);
  }
  const arg = process.argv.find((a) => a.startsWith("--feed="));
  if (!arg) {
    console.error(
      "No feed. Pass --feed=/path/to/HillInteriorsDropship.csv (export it today).",
    );
    process.exit(1);
  }
  return arg.slice("--feed=".length);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

/**
 * What the shop should say about a feed row.
 *
 * Exported because this is the whole judgement of the script and it is the
 * part worth pinning: a zero that reads as In Stock is how the Mistora was
 * sold three months before it existed.
 */
export function statusFor(stock: number, status: string): string {
  if (status.trim().toUpperCase() !== "ACT") return "Out of Stock";
  return stock > 0 ? "In Stock" : "Out of Stock";
}

interface Row {
  code: string;
  title: string;
  stock: number;
  status: string;
}

function readFeed(path: string): Map<string, Row> {
  const rows = parseCsv(readFileSync(path, "utf8"));
  const header = rows[0]!;
  const at = (r: string[], name: string) => r[header.indexOf(name)] ?? "";
  const out = new Map<string, Row>();
  for (const r of rows.slice(1)) {
    const code = (r[0] ?? "").trim();
    if (!code) continue;
    out.set(code, {
      code,
      title: at(r, "Title"),
      stock: Number(at(r, "Available Stock")) || 0,
      status: at(r, "Status"),
    });
  }
  return out;
}

interface Product {
  _id: string;
  title: string;
  code: string | null;
  stockStatus: string | null;
  stockQuantity: number | null;
}

async function main() {
  const feed = readFeed(resolveFeedPath());
  const products = await client.fetch<Product[]>(
    `*[_type == "product" && !(_id in path("drafts.**"))
      && supplier->name == "Hill Interiors"]{
      _id, title, "code": coalesce(supplierSku, sku), stockStatus, stockQuantity
    }`,
  );

  const changes: {
    product: Product;
    from: string;
    to: string;
    stock: number;
    qtyFrom: number | null;
  }[] = [];
  const unmatched: Product[] = [];

  for (const product of products) {
    const row = product.code ? feed.get(product.code.trim()) : undefined;
    if (!row) {
      unmatched.push(product);
      continue;
    }
    const to = statusFor(row.stock, row.status);
    const from = product.stockStatus ?? "(unset)";
    // A quantity change counts even when the status holds: "In Stock, 1 left"
    // and "In Stock, 400 left" are not the same promise to a customer.
    if (from !== to || product.stockQuantity !== row.stock)
      changes.push({
        product,
        from,
        to,
        stock: row.stock,
        qtyFrom: product.stockQuantity,
      });
  }

  console.log(`Feed rows: ${feed.size}`);
  console.log(`Hill products in Sanity: ${products.length}`);
  console.log(`No matching code in the feed: ${unmatched.length}`);
  console.log(`Would change: ${changes.length}\n`);

  const nowOut = changes.filter(
    (c) => c.to === "Out of Stock" && c.from !== c.to,
  );
  const nowIn = changes.filter((c) => c.to === "In Stock" && c.from !== c.to);
  const qtyOnly = changes.filter((c) => c.from === c.to);
  const lowStock = changes.filter((c) => c.to === "In Stock" && c.stock <= 5);

  console.log(`=== ${nowOut.length} being sold that Hill cannot send ===`);
  for (const c of nowOut.slice(0, 40))
    console.log(
      `   ${c.from.padEnd(13)} -> ${c.to.padEnd(13)} stock ${String(c.stock).padStart(4)}  ${c.product.title.replace(/ \| Kaiku$/, "")}`,
    );
  if (nowOut.length > 40) console.log(`   ... and ${nowOut.length - 40} more`);

  console.log(`\n=== ${nowIn.length} back in stock ===`);
  for (const c of nowIn.slice(0, 15))
    console.log(
      `   ${c.from.padEnd(13)} -> ${c.to.padEnd(13)} stock ${String(c.stock).padStart(4)}  ${c.product.title.replace(/ \| Kaiku$/, "")}`,
    );

  if (qtyOnly.length) {
    console.log(
      `\n=== ${qtyOnly.length} right about availability, wrong about how many ===`,
    );
    for (const c of qtyOnly.slice(0, 10))
      console.log(
        `   qty ${String(c.qtyFrom ?? "unset").padStart(6)} -> ${String(c.stock).padEnd(6)}  ${c.product.title.replace(/ \| Kaiku$/, "")}`,
      );
    if (qtyOnly.length > 10)
      console.log(`   ... and ${qtyOnly.length - 10} more`);
  }

  if (lowStock.length) {
    console.log(
      `\n=== ${lowStock.length} in stock but down to 5 or fewer — these will now say "Only N left" ===`,
    );
    for (const c of lowStock.slice(0, 15))
      console.log(
        `   ${String(c.stock).padStart(3)} left  ${c.product.title.replace(/ \| Kaiku$/, "")}`,
      );
  }

  if (unmatched.length) {
    console.log(
      `\n=== ${unmatched.length} not in the feed — left alone, check by hand ===`,
    );
    for (const p of unmatched.slice(0, 15))
      console.log(
        `   code ${String(p.code ?? "(none)").padEnd(12)} ${p.title.replace(/ \| Kaiku$/, "")}`,
      );
  }

  if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
    return;
  }

  const tx = client.transaction();
  for (const c of changes)
    tx.patch(c.product._id, (p) =>
      p.set({ stockStatus: c.to, stockQuantity: c.stock }),
    );
  await tx.commit();
  console.log(`\nWrote ${changes.length} stock statuses and quantities.`);
}

if (process.argv[1]?.endsWith("sync-hill-stock.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
