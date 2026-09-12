/**
 * Writes `seo.metaTitle` for the products Google truncates.
 *
 * 118 product titles run past the ~60 characters Google renders, including the
 * page with the most impressions on the site — the SaunaPlunge Yorkshire Cabin,
 * where the word being cut off is "Sauna".
 *
 * Only `seo.metaTitle` is written. No product is renamed and "| Kaiku" always
 * survives, both of which are standing constraints. The logic and its reasoning
 * live in `src/lib/catalog/meta-title.ts` with its own tests; this is the part
 * that reads the catalogue and writes the field.
 *
 * A product whose `metaTitle` has been set by hand is left alone: an editor's
 * judgement beats a rule, and there is no way to tell a good hand-written title
 * from a generated one after the fact.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-meta-titles.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-meta-titles.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { META_TITLE_MAX, shortenMetaTitle } from "@/lib/catalog/meta-title";

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
  perspective: "raw",
});

interface Row {
  _id: string;
  title: string;
  slug: string | null;
  metaTitle: string | null;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type=="product" && !(_id in path("drafts.**")) && defined(slug.current)]{
      _id, title, "slug": slug.current, "metaTitle": seo.metaTitle }`,
  );

  const changes: {
    _id: string;
    slug: string | null;
    before: string;
    after: string;
    beforeLength: number;
    afterLength: number;
    steps: string[];
    truncated: boolean;
  }[] = [];

  let alreadyFine = 0;
  const unsafe: { slug: string | null; title: string }[] = [];

  for (const row of rows) {
    // The effective title is the override where one exists, exactly as
    // buildMetadata resolves it.
    const effective = row.metaTitle?.trim() || row.title;
    if (!effective || effective.length <= META_TITLE_MAX) {
      alreadyFine += 1;
      continue;
    }

    const result = shortenMetaTitle(effective);
    if (result.unsafe) {
      unsafe.push({ slug: row.slug, title: effective });
      continue;
    }
    if (result.value === effective || !result.value) continue;

    changes.push({
      _id: row._id,
      slug: row.slug,
      before: effective,
      after: result.value,
      beforeLength: effective.length,
      afterLength: result.value.length,
      steps: result.steps,
      truncated: result.truncated,
    });
  }

  const truncated = changes.filter((c) => c.truncated);
  const stillOver = changes.filter((c) => c.afterLength > META_TITLE_MAX);

  console.log(
    `\n${rows.length} products, ${alreadyFine} already within ${META_TITLE_MAX}.`,
  );
  console.log(`${changes.length} to shorten.`);
  console.log(
    `  needed the last-resort truncation: ${truncated.length}` +
      `   still over after everything: ${stillOver.length}`,
  );
  console.log(
    `  left alone as unsafe to shorten: ${unsafe.length}` +
      (unsafe.length ? "  (listed below)" : ""),
  );

  const stepCounts = new Map<string, number>();
  for (const change of changes) {
    for (const step of change.steps) {
      const key = step.startsWith("drop-leading") ? "drop-leading" : step;
      stepCounts.set(key, (stepCounts.get(key) ?? 0) + 1);
    }
  }
  console.log("\nReductions used:");
  for (const [step, count] of [...stepCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${String(count).padStart(4)}  ${step}`);
  }

  console.log("\nLongest 20, before and after:");
  for (const change of [...changes]
    .sort((a, b) => b.beforeLength - a.beforeLength)
    .slice(0, 20)) {
    console.log(
      `  ${change.beforeLength} -> ${change.afterLength}  [${change.steps.join(",")}]`,
    );
    console.log(`     ${change.before}`);
    console.log(`     ${change.after}`);
  }

  if (truncated.length) {
    console.log("\nEvery title that needed truncating, for eyes-on review:");
    for (const change of truncated) {
      console.log(`     ${change.before}`);
      console.log(`  -> ${change.after}`);
    }
  }

  if (unsafe.length) {
    console.log("\nNo safe shortening — left for a human:");
    for (const u of unsafe) console.log(`  ${u.title}`);
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-12-meta-titles.json",
    `${JSON.stringify({ generatedAt: new Date().toISOString(), changes, unsafe }, null, 2)}\n`,
  );

  if (!apply) {
    console.log("\nDry run — re-run with --apply.");
    return;
  }

  for (const change of changes) {
    await client
      .patch(change._id)
      .set({ "seo.metaTitle": change.after })
      .commit();
  }
  console.log(`\nApplied ${changes.length} metaTitles.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
