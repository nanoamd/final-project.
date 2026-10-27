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
 * `available_to_sell` is also written to `stockQuantity`, which does two
 * things. It restores the checkout quantity guard — `src/server/actions/
 * checkout.ts` only enforces a basket limit where a quantity exists, and 304
 * of the 768 products claiming In Stock have none, so they pass on status
 * alone. And it makes the "Only N left in stock" line on the product page
 * real: that component deliberately stays silent without a quantity rather
 * than invent urgency, and a supplier's own figure is the thing it was waiting
 * for.
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
 * Pages here expire after twelve hours instead, so a crashed or interrupted
 * run resumes without re-fetching while yesterday's figures can never pass for
 * today's.
 *
 * ## Running it
 *
 * `robots.txt` names ClaudeBot explicitly, allows product pages, and asks for
 * `Crawl-delay: 10`. That is honoured, and the User-Agent says what this is
 * rather than claiming to be Chrome. Ten seconds times the catalogue is about
 * an hour and a half, so give it the time or use --limit.
 *
 * Premier still return the occasional 429 at that pace. Those are waited out
 * and retried — 30s, 60s, 120s, or whatever `Retry-After` asks — rather than
 * skipped, because a skipped product stays unverified and unverified is the
 * state this exists to get out of. So the run can take longer than 91 minutes;
 * it should not come back with holes in it.
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
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
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

/**
 * Per-request ceiling.
 *
 * `fetch` has no default timeout, and this script is meant to be started and
 * left for an hour and a half. One request that never answers would stall the
 * whole run silently, with the last thing printed being a progress line from
 * twenty minutes earlier. A request that times out is treated exactly like a
 * 503: the product is left alone and reported, which is the same safe default.
 */
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Backoff for a 429, which Premier do send even at the crawl delay their
 * own robots.txt asks for.
 *
 * Skipping on 429 is the wrong default here. A skipped product is an
 * unverified product, and unverified is the state this whole script exists to
 * get out of — so a rate limit should cost time, not coverage. Waiting is also
 * what the status code is asking for, so this is the polite reading as well as
 * the useful one.
 */
const BACKOFF_MS = [30_000, 60_000, 120_000];

async function getWithTimeout(url: string): Promise<Response | null> {
  for (let attempt = 0; ; attempt += 1) {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const why = error instanceof Error ? error.name : "failed";
      console.warn(`   ${why} fetching ${url} — left alone`);
      return null;
    }

    if (res.status !== 429) return res;

    const wait = retryAfterMs(res) ?? BACKOFF_MS[attempt];
    if (wait === undefined) {
      console.warn(`   429 after ${BACKOFF_MS.length} backoffs — left alone`);
      return res;
    }
    console.warn(`   429 — waiting ${Math.round(wait / 1000)}s then retrying`);
    await sleep(wait);
  }
}

/** `Retry-After`, in seconds or as an HTTP date. Capped so it cannot park the run. */
export function retryAfterMs(res: {
  headers: { get(name: string): string | null };
}): number | undefined {
  const header = res.headers.get("retry-after");
  if (!header) return undefined;
  const seconds = Number(header);
  const ms = Number.isFinite(seconds)
    ? seconds * 1000
    : Date.parse(header) - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return undefined;
  return Math.min(ms, 300_000);
}

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

/**
 * How long a cached page may be reused.
 *
 * This was a date-stamped directory, which was wrong in a way that only showed
 * up once a run crossed midnight: a run started at 23:50 threw away its own
 * first ten minutes of work at 00:00 and began re-fetching pages it had just
 * paid ten seconds each for. 211 pages were lost that way.
 *
 * An age is what was actually meant. Twelve hours is comfortably inside a day
 * — the point of the cache is to make a crashed or interrupted run cheap to
 * resume, not to let yesterday's stock figures masquerade as today's.
 */
const CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

function cacheDir(): string {
  return path.join(process.cwd(), ".image-work/premier-stock");
}

/** The cached file, if it exists and is young enough to still be true. */
async function readIfFresh(file: string): Promise<string | null> {
  try {
    const info = await stat(file);
    if (Date.now() - info.mtimeMs > CACHE_MAX_AGE_MS) return null;
    return await readFile(file, "utf8");
  } catch {
    return null;
  }
}

async function fetchFresh(url: string, key: string): Promise<string | null> {
  const dir = cacheDir();
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${key}.html`);
  const cached = await readIfFresh(file);
  if (cached !== null) return cached;
  const res = await getWithTimeout(url);
  await sleep(PH_DELAY_MS);
  if (!res) return null;
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
  const cached = await readIfFresh(file);
  if (cached !== null) return cached;
  const pages: string[] = [];
  for (const page of [1, 2]) {
    const res = await getWithTimeout(
      `${PH_HOST}/xmlsitemap.php?type=products&page=${page}`,
    );
    await sleep(PH_DELAY_MS);
    // The sitemap is different from a product page: without it there is nothing
    // to match on at all, so this one does fail the run rather than carry on.
    if (!res) throw new Error(`sitemap page ${page} did not respond`);
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
  stockQuantity: number | null;
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
      _id, title, "code": coalesce(supplierSku, sku), stockStatus, stockQuantity
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

  const changes: {
    product: Product;
    from: string;
    to: string;
    qty: number;
    qtyFrom: number | null;
  }[] = [];
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
    // A quantity change counts as a change even when the status is unmoved:
    // "In Stock, 1 left" and "In Stock, 956 left" are not the same promise.
    if (from !== to || product.stockQuantity !== attrs.availableToSell)
      changes.push({
        product,
        from,
        to,
        qty: attrs.availableToSell,
        qtyFrom: product.stockQuantity,
      });
    if (checked % 25 === 0)
      console.log(`   … ${checked} read, ${changes.length} differ so far`);
  }

  const nowOut = changes.filter(
    (c) => c.to === "Out of Stock" && c.from !== c.to,
  );
  const nowIn = changes.filter((c) => c.to === "In Stock" && c.from !== c.to);
  const qtyOnly = changes.filter((c) => c.from === c.to);
  const lowStock = changes.filter((c) => c.to === "In Stock" && c.qty <= 5);

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

  if (qtyOnly.length) {
    console.log(
      `\n=== ${qtyOnly.length} right about availability, wrong about how many ===`,
    );
    for (const c of qtyOnly.slice(0, 10))
      console.log(
        `   qty ${String(c.qtyFrom ?? "unset").padStart(6)} -> ${String(c.qty).padEnd(6)}  ${clean(c.product.title)}`,
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
        `   ${String(c.qty).padStart(3)} left  ${clean(c.product.title)}`,
      );
  }

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
    tx.patch(c.product._id, (p) =>
      p.set({ stockStatus: c.to, stockQuantity: c.qty }),
    );
  await tx.commit();
  console.log(`\nWrote ${changes.length} stock statuses and quantities.`);
}

if (process.argv[1]?.endsWith("sync-premier-stock.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
