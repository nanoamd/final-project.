/**
 * Reconciles every published product against what the live site actually serves, so
 * "where has this product gone?" has a checkable answer.
 *
 * Damien asked it twice in one message — a Capri sofa he could not find, and two
 * string lights where only one appeared. Both turned out to be unpublished drafts,
 * but the general question deserves a general answer rather than a lookup per
 * product: **is every published product reachable, and if not, why not?**
 *
 * Four ways a published product can be invisible, and each is checked separately
 * because the fix differs:
 *
 *   no category        no URL exists and it appears in no listing
 *   duplicate slug     two products, one URL — one of them is unreachable, and
 *                      this is the failure that looks most like "it vanished"
 *   missing from sitemap  it exists but Google is never told about it
 *   404 / redirect     the URL the site advertises does not serve the product
 *
 * Reads only. Compares against a live host so what it reports is what a customer
 * gets, not what a local build would give.
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-catalogue-reachability.ts
 *   pnpm tsx --env-file=.env.local scripts/audit-catalogue-reachability.ts --base http://localhost:3000
 */
import { createClient } from "@sanity/client";

const baseArg = (() => {
  const i = process.argv.indexOf("--base");
  return i > -1 ? process.argv[i + 1] : undefined;
})();
const BASE = (baseArg ?? "https://www.kaikuhome.com").replace(/\/$/, "");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

interface Row {
  id: string;
  title: string;
  slug: string | null;
  category: string | null;
  price: number | null;
}

const QUERY = /* groq */ `
*[_type == "product" && !(_id in path("drafts.**"))]{
  "id": _id, title,
  "slug": slug.current,
  "category": category->slug.current,
  price
} | order(title asc)`;

const CONCURRENCY = 8;

async function main() {
  const products = await client.fetch<Row[]>(QUERY);
  console.log(
    `\n${products.length} published products · checking against ${BASE}\n`,
  );

  /* ---------------------------------------------------------------- structure -- */

  const noCategory = products.filter((p) => !p.category);
  const noSlug = products.filter((p) => !p.slug);

  const bySlug = new Map<string, Row[]>();
  for (const p of products) {
    if (!p.slug) continue;
    bySlug.set(p.slug, [...(bySlug.get(p.slug) ?? []), p]);
  }
  const duplicateSlugs = [...bySlug.entries()].filter(
    ([, rows]) => rows.length > 1,
  );

  /* ------------------------------------------------------------------ sitemap -- */

  const sitemapRes = await fetch(`${BASE}/sitemap.xml`);
  const xml = sitemapRes.ok ? await sitemapRes.text() : "";
  const sitemapPaths = new Set(
    [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
      try {
        return new URL(m[1]!).pathname.replace(/\/$/, "");
      } catch {
        return m[1]!;
      }
    }),
  );

  const routable = products.filter((p) => p.slug && p.category);
  const missingFromSitemap = routable.filter(
    (p) => !sitemapPaths.has(`/shop/${p.category}/${p.slug}`),
  );

  /* ------------------------------------------------------------------- fetch -- */

  const broken: { row: Row; status: number }[] = [];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (cursor < routable.length) {
        const row = routable[cursor++]!;
        const url = `${BASE}/shop/${row.category}/${row.slug}`;
        try {
          const res = await fetch(url, { redirect: "manual" });
          if (res.status !== 200) broken.push({ row, status: res.status });
        } catch {
          broken.push({ row, status: 0 });
        }
        process.stdout.write(".");
      }
    }),
  );
  console.log("\n");

  /* ------------------------------------------------------------------ report -- */

  const section = (label: string, lines: string[]) => {
    console.log(`${label}: ${lines.length}`);
    for (const line of lines.slice(0, 20)) console.log(`   ${line}`);
    if (lines.length > 20) console.log(`   … and ${lines.length - 20} more`);
    console.log();
  };

  section(
    "Published but no category — no URL, in no listing",
    noCategory.map((p) => p.title),
  );
  section(
    "Published but no slug",
    noSlug.map((p) => p.title),
  );
  section(
    "Duplicate slugs — two products sharing one URL, so one is unreachable",
    duplicateSlugs.map(
      ([slug, rows]) =>
        `${slug}\n        ${rows.map((r) => r.title).join("\n        ")}`,
    ),
  );
  section(
    "Missing from the sitemap",
    missingFromSitemap.map((p) => `/shop/${p.category}/${p.slug}`),
  );
  section(
    "URL does not return 200",
    broken.map(
      ({ row, status }) => `${status}  /shop/${row.category}/${row.slug}`,
    ),
  );

  const unreachable = new Set([
    ...noCategory.map((p) => p.id),
    ...noSlug.map((p) => p.id),
    ...duplicateSlugs.flatMap(([, rows]) => rows.slice(1).map((r) => r.id)),
    ...broken.map(({ row }) => row.id),
  ]);

  console.log(
    `${products.length - unreachable.size} of ${products.length} published products are reachable on ${BASE}.\n`,
  );
  if (unreachable.size === 0)
    console.log(
      "Nothing published is missing from the site. A product you cannot find is\n" +
        "therefore still a draft — check scripts/publish-ready-drafts.ts, which lists\n" +
        "every unpublished draft and what each one is missing.\n",
    );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
