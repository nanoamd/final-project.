/**
 * What every indexable page actually puts in its `<title>` and meta
 * description, measured rather than assumed.
 *
 * Damien: "can you make sure the entire site is optimized for seo keywords,
 * length, titles etc."
 *
 * This measures the **effective** values — what a searcher sees — not the raw
 * fields. `buildMetadata` resolves `seo.metaTitle ?? <derived>` and
 * `seo.metaDescription ?? summary`, so auditing the `seo` group alone would
 * report almost everything as empty while the pages themselves are fine.
 *
 * The thresholds are Google's rendering limits, not style preferences:
 *
 *   Title        truncated past roughly 60 characters. Under about 30 wastes
 *                the strongest ranking and click-through surface on the page.
 *   Description  truncated past roughly 160. Under about 70 usually means
 *                Google writes its own snippet from the page body instead,
 *                which is a lost opportunity rather than an error.
 *
 * Duplicates are reported separately and matter more than length: two pages
 * with the same title compete with each other, and Google frequently drops one
 * from the index entirely — which is one documented cause of the
 * "Duplicate without user-selected canonical" row in Search Console.
 *
 * Read-only.
 *   pnpm tsx --env-file=.env.local scripts/audit-seo-metadata.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const TITLE_MAX = 60;
const TITLE_MIN = 30;
const DESC_MAX = 160;
const DESC_MIN = 70;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

interface Page {
  kind: string;
  path: string;
  title: string;
  description: string;
  /** True when the title/description came from the seo group rather than derived. */
  titleOverridden: boolean;
  descriptionOverridden: boolean;
}

function effective(
  override: string | null | undefined,
  derived: string | null | undefined,
): { value: string; overridden: boolean } {
  const clean = override && override.trim() ? override.trim() : null;
  return {
    value: clean ?? (derived ?? "").trim(),
    overridden: Boolean(clean),
  };
}

async function collect(): Promise<Page[]> {
  const pages: Page[] = [];

  const products = await client.fetch<
    {
      slug: string;
      name: string;
      category: string | null;
      summary: string | null;
      categoryName: string | null;
      metaTitle: string | null;
      metaDescription: string | null;
    }[]
  >(`*[_type=="product" && !(_id in path("drafts.**")) && defined(slug.current)]{
      "slug": slug.current, "name": title, "category": category->slug.current,
      "categoryName": category->title, summary,
      "metaTitle": seo.metaTitle, "metaDescription": seo.metaDescription }`);

  for (const p of products) {
    const title = effective(p.metaTitle, p.name);
    // Mirrors the product page's own fallback chain exactly.
    const fallback = `Shop the ${p.name}${p.categoryName ? ` — part of our ${p.categoryName} range` : ""} at Kaiku Home.`;
    const description = effective(p.metaDescription, p.summary || fallback);
    pages.push({
      kind: "product",
      path: `/shop/${p.category ?? "?"}/${p.slug}`,
      title: title.value,
      description: description.value,
      titleOverridden: title.overridden,
      descriptionOverridden: description.overridden,
    });
  }

  const categories = await client.fetch<
    {
      slug: string;
      name: string;
      description: string | null;
      metaTitle: string | null;
      metaDescription: string | null;
    }[]
  >(`*[_type=="category" && defined(slug.current)]{
      "slug": slug.current, "name": title, description,
      "metaTitle": seo.metaTitle, "metaDescription": seo.metaDescription }`);

  for (const c of categories) {
    const title = effective(c.metaTitle, c.name);
    const description = effective(c.metaDescription, c.description);
    pages.push({
      kind: "category",
      path: `/shop/${c.slug}`,
      title: title.value,
      description: description.value,
      titleOverridden: title.overridden,
      descriptionOverridden: description.overridden,
    });
  }

  for (const [type, prefix] of [
    ["buyingGuide", "/learn"],
    ["post", "/journal"],
  ] as const) {
    const docs = await client.fetch<
      {
        slug: string;
        name: string;
        excerpt: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
      }[]
    >(
      `*[_type==$type && !(_id in path("drafts.**")) && defined(slug.current)]{
        "slug": slug.current, "name": title,
        "excerpt": coalesce(excerpt, standfirst, summary),
        "metaTitle": seo.metaTitle, "metaDescription": seo.metaDescription }`,
      { type },
    );
    for (const d of docs) {
      const title = effective(d.metaTitle, d.name);
      const description = effective(d.metaDescription, d.excerpt);
      pages.push({
        kind: type,
        path: `${prefix}/${d.slug}`,
        title: title.value,
        description: description.value,
        titleOverridden: title.overridden,
        descriptionOverridden: description.overridden,
      });
    }
  }

  return pages;
}

async function main() {
  const pages = await collect();
  const byKind = new Map<string, Page[]>();
  for (const p of pages) {
    byKind.set(p.kind, [...(byKind.get(p.kind) ?? []), p]);
  }

  console.log(`\n${pages.length} indexable pages.\n`);

  const report = (label: string, list: Page[]) => {
    const titleLens = list.map((p) => p.title.length);
    const descLens = list.map((p) => p.description.length);
    const mean = (n: number[]) =>
      n.length ? (n.reduce((a, b) => a + b, 0) / n.length).toFixed(0) : "–";
    console.log(`${label} (${list.length})`);
    console.log(
      `  title        mean ${mean(titleLens)}  ` +
        `over ${TITLE_MAX}: ${titleLens.filter((n) => n > TITLE_MAX).length}  ` +
        `under ${TITLE_MIN}: ${titleLens.filter((n) => n < TITLE_MIN).length}  ` +
        `empty: ${titleLens.filter((n) => n === 0).length}  ` +
        `hand-written: ${list.filter((p) => p.titleOverridden).length}`,
    );
    console.log(
      `  description  mean ${mean(descLens)}  ` +
        `over ${DESC_MAX}: ${descLens.filter((n) => n > DESC_MAX).length}  ` +
        `under ${DESC_MIN}: ${descLens.filter((n) => n < DESC_MIN).length}  ` +
        `empty: ${descLens.filter((n) => n === 0).length}  ` +
        `hand-written: ${list.filter((p) => p.descriptionOverridden).length}`,
    );
  };

  for (const [kind, list] of byKind) report(kind, list);

  // Duplicates — worth more than any length finding.
  const dupes = (field: "title" | "description") => {
    const seen = new Map<string, string[]>();
    for (const p of pages) {
      if (!p[field]) continue;
      const key = p[field].toLowerCase();
      seen.set(key, [...(seen.get(key) ?? []), p.path]);
    }
    return [...seen.entries()].filter(([, paths]) => paths.length > 1);
  };

  const dupeTitles = dupes("title");
  const dupeDescriptions = dupes("description");
  console.log(
    `\nDuplicate titles: ${dupeTitles.length} groups covering ${dupeTitles.reduce((n, [, p]) => n + p.length, 0)} pages`,
  );
  for (const [value, paths] of dupeTitles.slice(0, 8)) {
    console.log(`  ${paths.length}x  "${value.slice(0, 60)}"`);
    console.log(`       ${paths.slice(0, 3).join("  ")}`);
  }
  console.log(
    `\nDuplicate descriptions: ${dupeDescriptions.length} groups covering ${dupeDescriptions.reduce((n, [, p]) => n + p.length, 0)} pages`,
  );
  for (const [value, paths] of dupeDescriptions.slice(0, 8)) {
    console.log(`  ${paths.length}x  "${value.slice(0, 70)}"`);
    console.log(`       ${paths.slice(0, 3).join("  ")}`);
  }

  const longestTitles = [...pages]
    .sort((a, b) => b.title.length - a.title.length)
    .slice(0, 8);
  console.log(`\nLongest titles (truncated in results past ~${TITLE_MAX}):`);
  for (const p of longestTitles) {
    console.log(
      `  ${String(p.title.length).padStart(4)}  ${p.title.slice(0, 90)}`,
    );
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-12-seo-metadata-audit.json",
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        thresholds: { TITLE_MAX, TITLE_MIN, DESC_MAX, DESC_MIN },
        total: pages.length,
        duplicateTitles: dupeTitles,
        duplicateDescriptions: dupeDescriptions,
        pages,
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    "\nFull data: docs/change-log/2026-09-12-seo-metadata-audit.json",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
