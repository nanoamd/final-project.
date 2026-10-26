/**
 * Asks the live site whether it still knows about the catalogue.
 *
 * ## Why
 *
 * On 26 October kaikuhome.com served a sitemap of 31 URLs with no products and
 * a Merchant Center feed with no items, for about a day, while every test, the
 * typecheck, the build and the deploy stayed green. A stale
 * `SANITY_API_READ_TOKEN` in Vercel made every Sanity read return 401;
 * `sanityFetch` is fail-soft, so each one resolved to its empty fallback and
 * the build baked the result. Merchant Center then fetched the empty feed and
 * withdrew the products it held — "Provided by you: 0".
 *
 * The build-time guard in `src/lib/sanity/require-content.ts` stops that
 * shipping again. This is the other half: confirmation from outside, against
 * what the public actually receives, because the failure was invisible from
 * inside the repository. Every signal said fine.
 *
 * ## What it checks
 *
 * Only things a stranger can see, so it needs no credentials and can run from
 * anywhere, including against a preview deployment before promoting it.
 *
 *   sitemap.xml          has product URLs, not just the static routes
 *   google-merchant.xml  has <item> elements, or is honestly switched off
 *   both                 are actually XML rather than a firewall interstitial
 *
 * ## Running it
 *
 *   pnpm tsx scripts/verify-live-catalogue.ts
 *   pnpm tsx scripts/verify-live-catalogue.ts --site=https://preview-xyz.vercel.app
 *
 * Exits non-zero on failure, so it can gate a promotion.
 */
const DEFAULT_SITE = "https://www.kaikuhome.com";

/** Below this, something is wrong even if it is not literally empty. */
const MIN_PRODUCT_URLS = 100;
const MIN_FEED_ITEMS = 100;

function siteUrl(): string {
  const arg = process.argv.find((a) => a.startsWith("--site="));
  return (arg ? arg.slice("--site=".length) : DEFAULT_SITE).replace(/\/$/, "");
}

export interface Check {
  name: string;
  ok: boolean;
  detail: string;
}

async function get(url: string): Promise<{ status: number; body: string }> {
  const res = await fetch(url, {
    headers: { "User-Agent": "kaiku-deploy-check" },
    signal: AbortSignal.timeout(30_000),
  });
  return { status: res.status, body: await res.text() };
}

function count(body: string, pattern: RegExp): number {
  return (body.match(pattern) ?? []).length;
}

export async function checkSitemap(site: string): Promise<Check> {
  const { status, body } = await get(`${site}/sitemap.xml`);
  if (status !== 200)
    return { name: "sitemap.xml", ok: false, detail: `HTTP ${status}` };
  // A firewall interstitial answers 200 with HTML. Not a sitemap.
  if (!body.includes("<urlset"))
    return {
      name: "sitemap.xml",
      ok: false,
      detail: "200 but not a sitemap — a challenge page or an error page",
    };
  const products = count(body, /<loc>[^<]*\/shop\/[^<]*<\/loc>/g);
  return {
    name: "sitemap.xml",
    ok: products >= MIN_PRODUCT_URLS,
    detail: `${products} product URLs (need ${MIN_PRODUCT_URLS}), ${count(body, /<loc>/g)} total`,
  };
}

export async function checkFeed(site: string): Promise<Check> {
  const { status, body } = await get(`${site}/google-merchant.xml`);
  if (status !== 200)
    return { name: "google-merchant.xml", ok: false, detail: `HTTP ${status}` };
  if (!body.includes("<rss"))
    return {
      name: "google-merchant.xml",
      ok: false,
      detail: "200 but not a feed — a challenge page or an error page",
    };
  // Switched off on purpose is a different thing from broken, and the route
  // says which in its own description.
  if (body.includes("MERCHANT_FEED_ENABLED=true"))
    return {
      name: "google-merchant.xml",
      ok: true,
      detail: "deliberately off (MERCHANT_FEED_ENABLED unset) — not a failure",
    };
  const items = count(body, /<item>/g);
  return {
    name: "google-merchant.xml",
    ok: items >= MIN_FEED_ITEMS,
    detail: `${items} items (need ${MIN_FEED_ITEMS})`,
  };
}

async function main() {
  const site = siteUrl();
  console.log(`Checking ${site}\n`);

  const checks: Check[] = [];
  for (const run of [checkSitemap, checkFeed]) {
    try {
      checks.push(await run(site));
    } catch (error) {
      checks.push({
        name: run.name,
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const check of checks)
    console.log(
      `  ${check.ok ? "ok  " : "FAIL"}  ${check.name.padEnd(22)} ${check.detail}`,
    );

  if (checks.some((c) => !c.ok)) {
    console.error(
      "\nThe live site is not serving its catalogue. That is almost always " +
        "credentials rather than data — compare a direct query to the dataset " +
        "against what the deployment can see, and check SANITY_API_READ_TOKEN " +
        "and the NEXT_PUBLIC_SANITY_* variables.",
    );
    process.exit(1);
  }
  console.log("\nCatalogue is live.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
