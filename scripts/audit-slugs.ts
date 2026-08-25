/**
 * Checks every URL the site generates from a Sanity slug, and repairs the broken ones.
 *
 * A slug is the URL. It is the one piece of on-page SEO that cannot be edited later
 * without cost, because changing it moves the page and every link and every ranking
 * that pointed at the old address has to be redirected across. So it is worth
 * auditing once, properly, rather than noticing a bad one at a time.
 *
 * **Two live products were found with a slug that is not a slug at all.**
 *
 *   - `product-aw-acshop-07` had `slug = "Reclaimed Teak Dining Table 180cm | Kaiku"` —
 *     the whole title, spaces and pipe included, so the URL was
 *     `/shop/…/Reclaimed%20Teak%20Dining%20Table%20180cm%20%7C%20Kaiku`
 *   - `product-import-large-small-rectangular-gesso-lamp` had
 *     `slug = "Soft ambient lighting with timeless sculptural elegance."` — the
 *     marketing excerpt, ending in a full stop
 *
 * Both were in the sitemap, so both were handed to Google in that state. A URL full of
 * `%20`s is not a ranking signal in itself, but it is unreadable in a search result, it
 * breaks when pasted into anything that does not encode it, and it looks like machine
 * output rather than a page somebody wrote — which is the whole battle on a four-month-old
 * domain. It is a plausible contributor to "Discovered – currently not indexed".
 *
 * **The naming convention it repairs to** is the one the catalogue already follows:
 * slugify the first segment of the title, before the first `|`. So
 * `"Small Rectangular Gesso Table Lamp | Luxury Designer Lighting | Kaiku"` becomes
 * `small-rectangular-gesso-table-lamp`, which sits alongside the existing
 * `large-ribbed-gesso-table-lamp` and `large-round-gesso-table-lamp`.
 *
 * The old addresses are redirected — see RENAMED_PRODUCT_URLS in
 * src/lib/seo/retired-urls.ts. Renaming a slug without a redirect is how a site loses
 * pages it already had.
 *
 * Checks applied to every document type that owns a route:
 *
 *   - missing entirely (the page cannot be reached)
 *   - characters outside `a-z 0-9 -` (uppercase, spaces, punctuation, `%` encoding)
 *   - leading, trailing or doubled hyphens
 *   - longer than 72 characters, which is where Google starts truncating the URL
 *   - duplicated within a type, which makes one of the two unreachable
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-slugs.ts
 *   pnpm tsx --env-file=.env.local scripts/audit-slugs.ts --apply
 */
import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const token = process.env.SANITY_API_WRITE_TOKEN;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

/** Where Google starts truncating a URL in the result snippet. */
const MAX_SLUG_LENGTH = 72;

const WELL_FORMED = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * The catalogue's convention: the first title segment only.
 *
 * Product titles are three fields glued together — the name, a keyword phrase and
 * `| Kaiku` — and only the name belongs in the URL. Taking the whole title would
 * produce `chilworth-grey-bedside-table-luxury-1-drawer-bedside-table-kaiku`, which is
 * both keyword-stuffed and over the truncation limit.
 */
function slugFromTitle(title: string): string {
  return title
    .split("|")[0]!
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, "");
}

interface Row {
  _id: string;
  slug: string | null;
  title: string | null;
}

interface Problem {
  row: Row;
  type: string;
  reason: string;
  /** What it should be, when that can be derived from the title with confidence. */
  suggestion: string | null;
}

/**
 * The types whose slug becomes a URL, plus `brand`.
 *
 * `brand` has no public route today, so its slug is not a URL — but the field is
 * `validation: required` in the schema, which means a brand without one shows as a
 * validation error in the Studio and blocks whoever is editing it. Worth catching in
 * the same pass, and worth filling from the name, since a brand route is the obvious
 * place a "SaunaPlunge" search lands later.
 */
const ROUTED_TYPES = [
  "product",
  "category",
  "department",
  "collection",
  "post",
  "buyingGuide",
  "page",
  "brand",
] as const;

function inspect(rows: Row[], type: string): Problem[] {
  const problems: Problem[] = [];
  const seen = new Map<string, string>();

  for (const row of rows) {
    const slug = row.slug ?? "";
    const suggestion = row.title ? slugFromTitle(row.title) : null;

    if (!slug) {
      problems.push({
        row,
        type,
        reason: "no slug — the document has no URL",
        suggestion,
      });
      continue;
    }
    if (!WELL_FORMED.test(slug)) {
      problems.push({
        row,
        type,
        // Spelling out what is wrong, because "malformed" does not tell you
        // whether it is an uppercase letter or a full stop.
        reason: `not URL-safe: ${describeOffenders(slug)}`,
        suggestion: suggestion && suggestion !== slug ? suggestion : null,
      });
      continue;
    }
    if (slug.length > MAX_SLUG_LENGTH) {
      problems.push({
        row,
        type,
        reason: `${slug.length} characters — Google truncates past ${MAX_SLUG_LENGTH}`,
        // Not auto-fixable: shortening a working URL costs a redirect and gains
        // very little, so this is reported for a human to weigh.
        suggestion: null,
      });
      continue;
    }

    const duplicate = seen.get(slug);
    if (duplicate) {
      problems.push({
        row,
        type,
        reason: `duplicate slug — also on ${duplicate}, so one of the two is unreachable`,
        suggestion: null,
      });
      continue;
    }
    seen.set(slug, row._id);
  }

  return problems;
}

function describeOffenders(slug: string): string {
  const notes: string[] = [];
  if (/[A-Z]/.test(slug)) notes.push("uppercase letters");
  if (/\s/.test(slug)) notes.push("spaces");
  if (/[|]/.test(slug)) notes.push("a pipe");
  if (/[.]/.test(slug)) notes.push("a full stop");
  if (/[^a-zA-Z0-9\s.|-]/.test(slug)) notes.push("other punctuation");
  if (/^-|-$/.test(slug)) notes.push("a leading or trailing hyphen");
  if (/--/.test(slug)) notes.push("a doubled hyphen");
  return notes.length ? notes.join(", ") : "characters outside a-z0-9-";
}

async function main() {
  console.log(`\n${apply ? "APPLYING" : "DRY RUN"}\n`);

  const allProblems: Problem[] = [];
  let checked = 0;

  for (const type of ROUTED_TYPES) {
    // Drafts are excluded: an unpublished document has no URL, and the imported
    // drafts have not been through a naming pass yet.
    const rows = await client.fetch<Row[]>(
      // `brand` and `author` name their headline field `name`, everything else uses
      // `title`, so coalesce rather than special-casing.
      `*[_type == $type && !(_id in path("drafts.**"))]{
        _id, "slug": slug.current, "title": coalesce(title, name)
      } | order(coalesce(title, name) asc)`,
      { type },
    );
    checked += rows.length;
    const problems = inspect(rows, type);
    allProblems.push(...problems);
    console.log(
      `  ${String(rows.length).padStart(4)} ${type.padEnd(12)} ${
        problems.length ? `${problems.length} problem(s)` : "clean"
      }`,
    );
  }

  console.log(
    `\n${checked} published documents with a routed slug · ${allProblems.length} problem(s)\n`,
  );

  const fixable = allProblems.filter((p) => p.suggestion);

  for (const problem of allProblems) {
    console.log(`  ${problem.type} ${problem.row._id}`);
    console.log(`     title: ${problem.row.title ?? "(untitled)"}`);
    console.log(`      slug: ${JSON.stringify(problem.row.slug)}`);
    console.log(`       why: ${problem.reason}`);
    if (problem.suggestion) console.log(`       fix: ${problem.suggestion}`);
    console.log();
  }

  if (!fixable.length) {
    console.log("Nothing to repair automatically.\n");
    return;
  }

  if (!apply) {
    console.log(
      `${fixable.length} can be repaired from the title. Re-run with --apply.\n` +
        `Remember to add the old paths to RENAMED_PRODUCT_URLS first — a slug change\n` +
        `without a redirect throws away whatever the old URL had earned.\n`,
    );
    return;
  }

  if (!token) {
    console.error("SANITY_API_WRITE_TOKEN is not set — cannot apply.");
    process.exit(1);
  }

  for (const problem of fixable) {
    // The draft is patched alongside the published document when it carries the
    // same broken slug. Otherwise the repair is a landmine: whoever publishes the
    // draft next — and 15 products have unpublished image edits waiting — silently
    // restores the bad URL and undoes the redirect.
    const ids = [problem.row._id, `drafts.${problem.row._id}`];
    for (const id of ids) {
      const current = await client.fetch<string | null>(
        `*[_id == $id][0].slug.current`,
        { id },
      );
      if (current === null || current === problem.suggestion) continue;
      await client
        .patch(id)
        .set({ slug: { _type: "slug", current: problem.suggestion! } })
        .commit();
      console.log(`  fixed  ${id} → ${problem.suggestion}`);
    }
  }

  console.log(`\nRepaired ${fixable.length} slug(s).\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
