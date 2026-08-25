/**
 * Fetches every URL in the live sitemap and reports the things that stop Google
 * indexing a page for reasons that are *ours*.
 *
 * Search Console splits "not indexed" by source, and the distinction is the whole
 * point of this script. Rows sourced from **Google systems** — "Discovered –
 * currently not indexed", "Crawled – currently not indexed" — are Google declining
 * to spend crawl budget, and no code change fixes them. Rows sourced from the
 * **Website** — a redirect, a 404, a canonical pointing elsewhere — are faults in
 * what we serve, and every one of them wastes the small crawl budget a young domain
 * gets on a URL that was never going to be indexed.
 *
 * So: this checks the four website-sourced classes, against the sitemap, which is
 * the one list of URLs we are actively asking Google to crawl.
 *
 *   Redirects        a sitemap URL that 301s. Google indexes the target, not this,
 *                    so listing it spends a crawl to be told to go somewhere else.
 *   404s             a sitemap URL that is gone. Straightforwardly a mistake.
 *   Canonical away   a page whose rel=canonical names a different URL. Google
 *                    reports these as "Alternative page with proper canonical tag"
 *                    and indexes the other one.
 *   noindex          a page we are asking Google to crawl and then telling it not
 *                    to keep.
 *
 * Follows nothing and changes nothing.
 *
 *   pnpm tsx scripts/audit-indexability.ts
 *   pnpm tsx scripts/audit-indexability.ts --base http://localhost:3000
 */
// This file imports nothing, which would make TypeScript treat it as a global
// script rather than a module — and then its `main` collides with the `main` in
// every other script in this directory. An empty export makes it a module.
export {};

const baseArg = (() => {
  const i = process.argv.indexOf("--base");
  return i > -1 ? process.argv[i + 1] : undefined;
})();

const BASE = (baseArg ?? "https://www.kaikuhome.com").replace(/\/$/, "");
const CONCURRENCY = 8;

interface Result {
  url: string;
  status: number;
  location?: string;
  canonical?: string;
  noindex?: boolean;
  error?: string;
}

async function check(url: string): Promise<Result> {
  try {
    const res = await fetch(url, { redirect: "manual" });
    const status = res.status;
    if (status >= 300 && status < 400)
      return {
        url,
        status,
        location: res.headers.get("location") ?? undefined,
      };

    // X-Robots-Tag is checked as well as the meta tag: either one deindexes a page,
    // and a header is the easier of the two to set by accident in a host config.
    const header = res.headers.get("x-robots-tag") ?? "";
    const html = await res.text();
    const canonical = /<link[^>]+rel=["']canonical["'][^>]*>/i
      .exec(html)?.[0]
      ?.match(/href=["']([^"']+)["']/i)?.[1];
    const metaRobots = /<meta[^>]+name=["']robots["'][^>]*>/i
      .exec(html)?.[0]
      ?.match(/content=["']([^"']+)["']/i)?.[1];
    return {
      url,
      status,
      canonical,
      noindex: /noindex/i.test(`${header} ${metaRobots ?? ""}`),
    };
  } catch (error) {
    return { url, status: 0, error: String(error) };
  }
}

/** Same URL for comparison purposes — trailing slash and case of the host only. */
function normalise(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    const path = parsed.pathname.replace(/\/$/, "") || "/";
    return `${parsed.protocol}//${parsed.host.toLowerCase()}${path}`;
  } catch {
    return url;
  }
}

async function main() {
  const res = await fetch(`${BASE}/sitemap.xml`);
  if (!res.ok) {
    console.error(`sitemap.xml returned ${res.status}`);
    process.exit(1);
  }
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1]!)
    // A local run has to hit the local server, not the canonical host the sitemap
    // prints, or every check would silently test production instead.
    .map((u) => (baseArg ? u.replace(/^https?:\/\/[^/]+/, BASE) : u));

  console.log(`\n${urls.length} URLs in ${BASE}/sitemap.xml\n`);

  const results: Result[] = [];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (cursor < urls.length) {
        const url = urls[cursor++]!;
        results.push(await check(url));
        process.stdout.write(".");
      }
    }),
  );
  console.log("\n");

  const inSitemap = new Set(urls.map(normalise));
  const redirects = results.filter((r) => r.status >= 300 && r.status < 400);
  const notFound = results.filter((r) => r.status === 404);
  const errors = results.filter((r) => r.status === 0 || r.status >= 500);
  const noindex = results.filter((r) => r.noindex);
  const canonicalAway = results.filter(
    (r) => r.canonical && normalise(r.canonical) !== normalise(r.url),
  );
  const noCanonical = results.filter((r) => r.status === 200 && !r.canonical);

  const report = (
    label: string,
    rows: Result[],
    line: (r: Result) => string,
  ) => {
    console.log(`${label}: ${rows.length}`);
    for (const r of rows.slice(0, 25)) console.log(`   ${line(r)}`);
    if (rows.length > 25) console.log(`   … and ${rows.length - 25} more`);
    console.log();
  };

  report(
    "Redirects in the sitemap",
    redirects,
    (r) =>
      `${r.status}  ${r.url}\n        → ${r.location ?? "(no Location header)"}`,
  );
  report("404s in the sitemap", notFound, (r) => r.url);
  report(
    "Failed to fetch / 5xx",
    errors,
    (r) => `${r.status}  ${r.url}  ${r.error ?? ""}`,
  );
  report("noindex", noindex, (r) => r.url);
  report(
    "Canonical points elsewhere",
    canonicalAway,
    (r) =>
      `${r.url}\n        → ${r.canonical}${inSitemap.has(normalise(r.canonical!)) ? "  (target is also in the sitemap)" : "  (target NOT in the sitemap)"}`,
  );
  report("200 with no canonical tag", noCanonical, (r) => r.url);

  const clean =
    results.length -
    new Set(
      [...redirects, ...notFound, ...errors, ...noindex, ...canonicalAway].map(
        (r) => r.url,
      ),
    ).size;
  console.log(
    `${clean} of ${results.length} sitemap URLs are a clean, self-canonical 200.\n` +
      `Anything above is a reason Google can point at us. What is left after that is\n` +
      `crawl budget on a young domain, which is answered by links and time, not code.\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
