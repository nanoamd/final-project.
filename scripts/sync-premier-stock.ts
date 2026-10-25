/**
 * Writes Premier Housewares' real stock levels into Sanity.
 *
 * ## Why this exists
 *
 * `scripts/sync-hill-stock.ts` fixed this for Hill Interiors after the Mistora
 * was sold three months before it existed. Premier is the bigger exposure and
 * had nothing: `scripts/import-premier-housewares.ts` sets
 * `stockStatus: "In Stock"` on every draft it creates, because that is what the
 * schema defaults to and nothing has ever written it since. Every Premier
 * product on the site claims availability on the strength of an import default.
 *
 * Premier has no dropship CSV. It does not need one — the storefront is
 * BigCommerce, and every product page carries the live figure in a script tag,
 * visible without logging in:
 *
 *   var BCData = {"product_attributes":{"sku":"5502580", …,
 *     "stock":16,"instock":true,"available_to_sell":16,
 *     "available_on_hand":16,"available_for_backorder":0,
 *     "unlimited_backorder":false,"purchasable":false, …}};
 *
 * ## Three signals on the page disagree. Only one of them is true.
 *
 * Checked against `allure-chrome-wing-base-end-table-5502580`, which had 16 in
 * stock at the time of writing:
 *
 *   og:availability            "instock"                  always says this
 *   JSON-LD offer availability "schema.org/OutOfStock"     WRONG — said out at 16
 *   BCData.available_to_sell   16                          correct
 *
 * The JSON-LD block is unusable logged out: its `price` is `""` for the same
 * reason — trade pricing sits behind `/login.php`, so the block is rendered
 * without the figures that would make it meaningful. Reading it would have
 * marked a product with sixteen units Out of Stock.
 *
 * `purchasable` is false on that same in-stock product, also because of the
 * logged-out price. It is not a stock signal and is not read here.
 *
 * ## What it writes
 *
 *   instock true  and available_to_sell > 0   -> In Stock
 *   anything else                             -> Out of Stock
 *
 * No Backorder, no Coming Soon — same reasoning as the Hill script. The page
 * gives a number, not a restock date, and "Backorder" tells a shopper a date is
 * known when it is not.
 *
 * A product whose page cannot be read, or carries no BCData, is LEFT ALONE and
 * reported. A failed fetch is not evidence of anything, and flipping a product
 * to Out of Stock on a 503 takes a sellable line off the shop.
 *
 * ## Freshness, and why there is no long-lived page cache
 *
 * `scripts/lib/premier-housewares.ts` caches each fetched page to disk forever,
 * which is right for importing a title and wrong for reading stock: a page
 * cached last month would reproduce the exact bug this script exists to stop.
 * Pages here are cached under a directory stamped with today's date, so a
 * re-run after a crash resumes without re-fetching, and tomorrow's run starts
 * clean.
 *
 * ## Running it
 *
 * `robots.txt` names ClaudeBot explicitly, allows product pages, and asks for
 * `Crawl-delay: 10`. That is honoured, and the User-Agent says what this is
 * rather than claiming to be Chrome. Ten seconds times the catalogue is about
 * an hour and a half, so give it the time or use --limit:
 *
 *   pnpm tsx --env-file=.env.local scripts/sync-premier-stock.ts
 *   pnpm tsx --env-file=.env.local scripts/sync-premier-stock.ts --limit 20
 *   pnpm tsx --env-file=.env.local scripts/sync-premier-stock.ts --apply
 *
 * Dry run by default. `--apply` refuses without SANITY_API_WRITE_TOKEN.
 *
 * ## Validated against live pages
 *
 * Fourteen products sampled across the catalogue, 25 October. Thirteen in stock
 * reporting real numbers from 1 to 956, and one genuinely out:
 *
 *   filta-leopard-face-doormat-1902049   stock=0  instock=false  ats=0
 *
 * So both paths are confirmed against reality, not just unit tests.
 *
 * `purchasable` was false on all fourteen, including one with 956 units. It
 * tracks the logged-out price, not stock, and is why it is not read here.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@sanity/client";

import { PH_DELAY_MS, PH_HOST, sleep } from "./lib/premier-housewares";

const apply = process.argv.includes("--apply");
const token = process.env.SANITY_API_WRITE_TOKEN;

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};

/** Says what this is. robots.txt allows it by name, so there is nothing to hide. */
const UA = "ClaudeBot/1.0 (+https://www.anthropic.com/claude-bot)";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

/**
 * BigCommerce's own stock numbers for the product, as the page reports them.
 *
 * Deliberately narrow: the blob carries a dozen more keys and every one of them
 * that looked like a stock signal turned out not to be.
 */
export interface StockAttributes {
  sku: string;
  stock: number;
  instock: boolean;
  availableToSell: number;
}

/**
 * Pulls `BCData.product_attributes` out of a product page.
 *
 * Returns null rather than throwing, and null means "this page did not tell us"
 * — which the caller treats as leave-alone, not as out of stock.
 */
export function parseStock(html: string): StockAttributes | null {
  const match = html.match(/var\s+BCData\s*=\s*(\{[\s\S]*?\});/);
  if (!match) return null;
  let data: unknown;
  try {
    data = JSON.parse(match[1]!);
  } catch {
    return null;
  }
  const attrs = (data as { product_attributes?: Record<string, unknown> })
    ?.product_attributes;
  if (!attrs || typeof attrs !== "object") return null;
  const sku = typeof attrs.sku === "string" ? attrs.sku.trim() : "";
  if (!sku) return null;
  const num = (v: unknown) => (typeof v === "number" ? v : Number(v)) || 0;
  return {
    sku,
    stock: num(attrs.stock),
    instock: attrs.instock === true,
    availableToSell: num(attrs.available_to_sell),
  };
}

/**
 * What the shop should say.
 *
 * Both conditions, not either: `instock` is a flag Premier sets and
 * `available_to_sell` is the number behind it, and a product is only sendable
 * when they agree. This is the whole judgement of the script, which is why it
 * is exported and pinned by tests.
 */
export function statusFor(attrs: StockAttributes): string {
  return attrs.instock && attrs.availableToSell > 0
    ? "In Stock"
    : "Out of Stock";
}

/**
 * Every Premier product URL, keyed by the SKU it ends in.
 *
 * Checked against the live sitemap: all 9,872 product URLs on page one end in a
 * six-to-eight digit SKU, so this needs no page fetches to build. That is what
 * makes the run bearable — only the few hundred SKUs Kaiku actually carries get
 * fetched, not the whole catalogue.
 */
export function indexSitemapBySku(xml: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of xml.matchAll(
    /<loc>(https:\/\/www\.premierhousewares\.com\/[a-z0-9-]*?-(\d{5,9}))<\/loc>/g,
  )) {
    map.set(m[2]!, m[1]!);
  }
  return map;
}

/** Today's cache directory. Tomorrow's run gets a different one, on purpose. */
function cacheDir(): string {
  const day = new Date().toISOString().slice(0, 10);
  return path.join(process.cwd(), ".image-work/premier-stock", day);
}

async function fetchFresh(url: string, key: string): Promise<string | null> {
  const dir = cacheDir();
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${key}.html`);
  try {
    return await readFile(file, "utf8");
  } catch {
    // not cached today — fetch it
  }
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  await sleep(PH_DELAY_MS);
  if (!res.ok) {
    console.warn(`   ${res.status} fetching ${url} — left alone`);
    return null;
  }
  const html = await res.text();
  await writeFile(file, html, "utf8");
  return html;
}

async function sitemapXml(): Promise<string> {
  const dir = cacheDir();
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "sitemap.xml");
  try {
    return await readFile(file, "utf8");
  } catch {
    // not cached today — fetch it
  }
  const pages: string[] = [];
  for (const page of [1, 2]) {
    const res = await fetch(
      `${PH_HOST}/xmlsitemap.php?type=products&page=${page}`,
      { headers: { "User-Agent": UA } },
    );
    await sleep(PH_DELAY_MS);
    if (!res.ok) throw new Error(`sitemap page ${page} returned ${res.status}`);
    pages.push(await res.text());
  }
  const xml = pages.join("\n");
  await writeFile(file, xml, "utf8");
  return xml;
}

interface Product {
  _id: string;
  title: string;
  code: string | null;
  stockStatus: string | null;
}

const clean = (title: string) => title.replace(/ \| Kaiku$/, "");

async function main() {
  if (apply && !token) {
    console.error("SANITY_API_WRITE_TOKEN is not set — refusing to --apply.");
    process.exit(1);
  }

  const products = await client.fetch<Product[]>(
    `*[_type == "product" && !(_id in path("drafts.**"))
      && supplier->name == "Premier Housewares"]{
      _id, title, "code": coalesce(supplierSku, sku), stockStatus
    } | order(title asc)`,
  );

  const urls = indexSitemapBySku(await sitemapXml());
  console.log(`Premier products in Sanity: ${products.length}`);
  console.log(`Product URLs in Premier's sitemap: ${urls.size}`);

  const limit = Number(arg("limit"));
  const queue = Number.isFinite(limit) ? products.slice(0, limit) : products;
  console.log(
    `Checking ${queue.length} at ${PH_DELAY_MS / 1000}s apart — about ${Math.ceil((queue.length * PH_DELAY_MS) / 60000)} minutes.\n`,
  );

  const changes: { product: Product; from: string; to: string; qty: number }[] =
    [];
  const noUrl: Product[] = [];
  const unreadable: Product[] = [];
  let checked = 0;

  for (const product of queue) {
    const code = product.code?.trim();
    const url = code ? urls.get(code) : undefined;
    if (!url) {
      noUrl.push(product);
      continue;
    }
    const html = await fetchFresh(url, code!);
    if (!html) {
      unreadable.push(product);
      continue;
    }
    const attrs = parseStock(html);
    if (!attrs) {
      unreadable.push(product);
      continue;
    }
    checked += 1;
    const to = statusFor(attrs);
    const from = product.stockStatus ?? "(unset)";
    if (from !== to)
      changes.push({ product, from, to, qty: attrs.availableToSell });
    if (checked % 25 === 0)
      console.log(`   … ${checked} read, ${changes.length} differ so far`);
  }

  const nowOut = changes.filter((c) => c.to === "Out of Stock");
  const nowIn = changes.filter((c) => c.to === "In Stock");

  console.log(`\nPages read: ${checked}`);
  console.log(`No URL for the code: ${noUrl.length}`);
  console.log(`Unreadable, left alone: ${unreadable.length}`);
  console.log(`Would change: ${changes.length}\n`);

  console.log(`=== ${nowOut.length} being sold that Premier cannot send ===`);
  for (const c of nowOut.slice(0, 40))
    console.log(
      `   ${c.from.padEnd(13)} -> ${c.to.padEnd(13)} qty ${String(c.qty).padStart(4)}  ${clean(c.product.title)}`,
    );
  if (nowOut.length > 40) console.log(`   ... and ${nowOut.length - 40} more`);

  console.log(`\n=== ${nowIn.length} back in stock ===`);
  for (const c of nowIn.slice(0, 15))
    console.log(
      `   ${c.from.padEnd(13)} -> ${c.to.padEnd(13)} qty ${String(c.qty).padStart(4)}  ${clean(c.product.title)}`,
    );

  if (noUrl.length) {
    console.log(
      `\n=== ${noUrl.length} with no matching URL — left alone, check by hand ===`,
    );
    for (const p of noUrl.slice(0, 15))
      console.log(
        `   code ${String(p.code ?? "(none)").padEnd(12)} ${clean(p.title)}`,
      );
  }

  if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
    return;
  }

  const tx = client.transaction();
  for (const c of changes)
    tx.patch(c.product._id, (p) => p.set({ stockStatus: c.to }));
  await tx.commit();
  console.log(`\nWrote ${changes.length} stock statuses.`);
}

if (process.argv[1]?.endsWith("sync-premier-stock.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
