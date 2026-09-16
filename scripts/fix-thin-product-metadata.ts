/**
 * The last 102 pages whose title or meta description is the wrong length.
 *
 * Damien: _"I want the titles and descriptions good enough to rank at 1 for
 * every page on the site"_.
 *
 * WHAT TITLES AND DESCRIPTIONS CAN AND CANNOT DO, because the ask assumes more
 * than they deliver. A meta description is not a ranking factor — Google has
 * said so for years, and this site's own data agrees: the coffee table guide
 * has a good title and sits at **position 85**, and the tools sit at 73–80 for
 * the terms they were built for. No rewrite moves a page from 79 to 1. What a
 * title and description do is earn the click once a page already ranks, and
 * that is worth having: it is the difference between 2% and 5% of the same
 * impressions.
 *
 * So this fixes what is actually wrong rather than promising what it cannot
 * do. Across 1,003 indexable pages there are **zero duplicate titles and zero
 * duplicate descriptions**, and every one is hand-written. The remaining
 * defects are all length:
 *
 *   78  descriptions under 70 characters — a snippet is about 155, so these
 *       throw away more than half the space and give no reason to click
 *   19  titles under 30 characters, missing the category term entirely
 *    4  titles over 60, truncated in results
 *    1  description over 160
 *
 * THE SHORT DESCRIPTIONS ARE FACTUALLY FINE AND COMMERCIALLY EMPTY. "A wall
 * clock in grey metal, 49cm across and 1.21kg." is true and tells a searcher
 * nothing that would make them choose it. All 78 carry a supplier `tagline`
 * ("Elevate your space with timeless elegance") and none of it is used here,
 * deliberately — that is the marketing filler this catalogue has spent weeks
 * removing, and putting it in the snippet would undo that.
 *
 * What is appended instead is availability and delivery, which is true, which
 * is what a shopper comparing two results actually weighs, and which does not
 * go stale the way a price does. Prices are deliberately kept out: 410 Hill
 * products were repriced yesterday, and a snippet quoting a price Google
 * cached last month is worse than one quoting none.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-thin-product-metadata.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-thin-product-metadata.ts --apply
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
  perspective: "raw",
});

/** Google truncates a title near here and a description near here. */
const TITLE_MAX = 60;
const TITLE_MIN = 30;
const DESC_MAX = 160;
const DESC_MIN = 70;

interface Row {
  _id: string;
  slug: string;
  title: string;
  catName: string | null;
  catSlug: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  width: number | null;
  height: number | null;
  unit: string | null;
  stockStatus: string | null;
  leadTime: string | null;
}

/**
 * The clause appended to a description that is too short.
 *
 * Availability and delivery, in that order, because that is the order a
 * shopper comparing two results reads them in. "Free UK delivery" is already
 * the site-wide claim on the cart, the product summary and the delivery tab,
 * so this is not a new promise being invented for a snippet.
 */
function tail(row: Row): string {
  const inStock = (row.stockStatus ?? "").toLowerCase().includes("in stock");
  const lead = (row.leadTime ?? "").trim();
  if (inStock && lead) return ` In stock, free UK delivery in ${lead}.`;
  if (inStock) return " In stock now, with free UK delivery.";
  if (lead) return ` Free UK delivery in ${lead}.`;
  return " Free UK delivery.";
}

/**
 * The category as a searcher would type it, from the slug rather than the title.
 *
 * Category titles are generic on purpose — they nest under a department, so
 * bathroom-accessories is titled "Accessories" and bathroom-storage is
 * "Storage". Correct in a breadcrumb and useless in a title tag: nobody
 * searches "accessories". The slug carries the full term, so
 * `bathroom-accessories` becomes "Bathroom Accessories" and `wall-clocks`
 * becomes "Wall Clocks".
 */
function categoryTerm(slug: string | null): string | null {
  if (!slug) return null;
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** A title too short is one missing its category. That is the term people search. */
function widenTitle(row: Row): string | null {
  const current = row.metaTitle ?? "";
  const term = categoryTerm(row.catSlug);
  if (!term) return null;
  if (current.includes(term)) return null;
  const widened = current.replace(/\s*\|\s*Kaiku\s*$/, ` | ${term} | Kaiku`);
  if (widened === current || widened.length > TITLE_MAX) return null;
  return widened;
}

/**
 * A title too long loses its tail in the result, and the tail is where the
 * category and the brand live. Dropping the middle qualifier keeps both.
 */
function shortenTitle(row: Row): string | null {
  const current = row.metaTitle ?? "";
  const parts = current.split(" | ");
  if (parts.length < 3) return null;
  // Keep the first segment and the brand; the category in the middle is what
  // goes, because a truncated title loses "| Kaiku" and that is worse.
  const shortened = [parts[0], parts[parts.length - 1]].join(" | ");
  return shortened.length <= TITLE_MAX && shortened !== current
    ? shortened
    : null;
}

function trimDescription(text: string): string {
  if (text.length <= DESC_MAX) return text;
  // Cut at the last sentence that fits, rather than mid-word with an ellipsis.
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
  let out = "";
  for (const s of sentences) {
    if ((out + s).trim().length > DESC_MAX) break;
    out += s;
  }
  return (out.trim() || text.slice(0, DESC_MAX - 1).trim()).replace(
    /[,;:]$/,
    "",
  );
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type=="product" && !(_id in path("drafts.**")) && (
        length(seo.metaDescription) < ${DESC_MIN}
        || length(seo.metaDescription) > ${DESC_MAX}
        || length(seo.metaTitle) < ${TITLE_MIN}
        || length(seo.metaTitle) > ${TITLE_MAX}
      )]{
      _id, "slug": slug.current, title,
      "catName": category->title,
      "catSlug": category->slug.current,
      "metaTitle": seo.metaTitle,
      "metaDescription": seo.metaDescription,
      "width": dimensions.width, "height": dimensions.height,
      "unit": dimensions.unit,
      stockStatus,
      "leadTime": deliveryLeadTime
    }`,
  );

  const changes: Record<string, unknown>[] = [];
  const skipped: Record<string, unknown>[] = [];

  for (const row of rows) {
    const set: Record<string, string> = {};
    const notes: string[] = [];

    const desc = row.metaDescription ?? "";
    if (desc.length < DESC_MIN) {
      const widened = `${desc.replace(/\s+$/, "")}${tail(row)}`;
      if (widened.length <= DESC_MAX && widened.length >= DESC_MIN) {
        set.metaDescription = widened;
        notes.push(`description ${desc.length} → ${widened.length}`);
      }
    } else if (desc.length > DESC_MAX) {
      const trimmed = trimDescription(desc);
      if (trimmed.length >= DESC_MIN && trimmed.length <= DESC_MAX) {
        set.metaDescription = trimmed;
        notes.push(`description ${desc.length} → ${trimmed.length}`);
      }
    }

    const titleLen = (row.metaTitle ?? "").length;
    if (titleLen < TITLE_MIN) {
      const widened = widenTitle(row);
      if (widened) {
        set.metaTitle = widened;
        notes.push(`title ${titleLen} → ${widened.length}`);
      }
    } else if (titleLen > TITLE_MAX) {
      const shortened = shortenTitle(row);
      if (shortened) {
        set.metaTitle = shortened;
        notes.push(`title ${titleLen} → ${shortened.length}`);
      }
    }

    if (Object.keys(set).length) {
      changes.push({
        _id: row._id,
        slug: row.slug,
        notes,
        titleWas: row.metaTitle,
        titleNow: set.metaTitle ?? row.metaTitle,
        descWas: row.metaDescription,
        descNow: set.metaDescription ?? row.metaDescription,
        set,
      });
    } else {
      skipped.push({
        slug: row.slug,
        titleLen,
        descLen: desc.length,
        reason:
          titleLen > TITLE_MAX
            ? "title has no middle segment to drop — the product name alone is over 60"
            : "no safe rewrite from the data on the product",
      });
    }
  }

  console.log(`\n${rows.length} products with a length defect.\n`);
  console.log(`  rewritten: ${changes.length}`);
  console.log(`  left alone: ${skipped.length}\n`);

  for (const c of changes.slice(0, 8)) {
    console.log(`  ${c.slug as string}`);
    if ((c.set as Record<string, string>).metaTitle)
      console.log(
        `    title  "${c.titleWas as string}"\n        →  "${c.titleNow as string}"`,
      );
    if ((c.set as Record<string, string>).metaDescription)
      console.log(
        `    desc   "${c.descWas as string}"\n        →  "${c.descNow as string}"`,
      );
    console.log("");
  }

  if (skipped.length) {
    console.log(`  Left alone — ${skipped.length}:\n`);
    for (const s of skipped.slice(0, 8))
      console.log(
        `    ${s.slug as string}  (title ${s.titleLen as number}, desc ${s.descLen as number}) — ${s.reason as string}`,
      );
    console.log("");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-16-thin-metadata.json",
    `${JSON.stringify({ generatedAt: new Date().toISOString(), changes, skipped }, null, 2)}\n`,
  );

  if (!apply) return console.log("Dry run — re-run with --apply.");
  for (const c of changes) {
    const set = c.set as Record<string, string>;
    const patch: Record<string, string> = {};
    if (set.metaTitle) patch["seo.metaTitle"] = set.metaTitle;
    if (set.metaDescription) patch["seo.metaDescription"] = set.metaDescription;
    await client
      .patch(c._id as string)
      .set(patch)
      .commit();
  }
  console.log(`\nRewrote metadata on ${changes.length} products.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
