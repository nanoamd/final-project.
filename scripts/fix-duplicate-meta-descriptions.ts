/**
 * Four pages sharing two meta descriptions.
 *
 * Two pages with the same description compete with each other, and Google
 * routinely folds one away — which is one documented cause of the "Duplicate
 * without user-selected canonical" row in Search Console.
 *
 * Only `seo.metaDescription` is written. The products' own `summary` — what
 * the page shows a reader — is left alone, because the duplication is a search
 * problem rather than a page problem.
 *
 * The two pairs are not the same case:
 *
 *   **Cassini tri-fold LED mirrors** genuinely differ — white at £44, black at
 *   £49 — so the descriptions differ by the thing that actually differs. Both
 *   keep the same feature list because both really do have three panels, a
 *   touch sensor, wide magnification and an adjustable base; implying one has
 *   a feature the other lacks would fix the duplication by lying.
 *
 *   **Mistora and Silvra hand-painted canvases** record *nothing* that
 *   differs: same £74, same wood frame, same 80 x 80 x 3cm, same 2.6kg, no
 *   colour tags, no specs. So these are distinguished by name only, which is
 *   honest but thin. A hand-painted canvas ought to be described by its
 *   picture, and that needs somebody who can see it — flagged rather than
 *   invented.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-duplicate-meta-descriptions.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-duplicate-meta-descriptions.ts --apply
 */
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

const DESC_MAX = 160;

const DESCRIPTIONS: Record<string, string> = {
  "cassini-tri-fold-white-led-table-mirror":
    "The Cassini tri-fold vanity mirror in white — three LED panels, touch sensor, wide magnification and an adjustable base. 18 x 6 x 28cm, 4xAAA or USB.",
  "cassini-tri-fold-black-led-table-mirror":
    "The Cassini tri-fold vanity mirror in black — three LED panels, touch sensor, wide magnification and an adjustable base. 18 x 6 x 28cm, 4xAAA or USB.",
  "mistora-hand-painted-canvas-in-frame":
    "The Mistora: a hand-painted canvas in a wood frame, 80 x 80 x 3cm and 2.6kg. One of a pair with the Silvra, sold separately.",
  "silvra-hand-painted-canvas-in-frame":
    "The Silvra: a hand-painted canvas in a wood frame, 80 x 80 x 3cm and 2.6kg. One of a pair with the Mistora, sold separately.",
};

async function main() {
  const tooLong = Object.entries(DESCRIPTIONS).filter(
    ([, text]) => text.length > DESC_MAX,
  );
  if (tooLong.length) {
    console.error("Over the limit:");
    for (const [slug, text] of tooLong)
      console.error(`  [${text.length}] ${slug}`);
    process.exit(1);
  }

  const values = Object.values(DESCRIPTIONS);
  if (new Set(values).size !== values.length) {
    console.error("Two of these rewrites are identical — that is the bug.");
    process.exit(1);
  }

  const rows = await client.fetch<
    { _id: string; slug: string; summary: string | null; draft: boolean }[]
  >(
    `*[_type=="product" && slug.current in $slugs]{
      _id, "slug": slug.current, summary, "draft": _id in path("drafts.**") }`,
    { slugs: Object.keys(DESCRIPTIONS) },
  );

  const missing = Object.keys(DESCRIPTIONS).filter(
    (slug) => !rows.some((row) => row.slug === slug),
  );
  if (missing.length) {
    console.error(`No such product: ${missing.join(", ")}`);
    process.exit(1);
  }

  console.log(`\n${rows.length} documents.\n`);
  for (const row of rows) {
    console.log(`  ${row.slug}${row.draft ? " (draft)" : ""}`);
    console.log(`    was: ${row.summary ?? "(none)"}`);
    console.log(`    now: ${DESCRIPTIONS[row.slug]!}\n`);
  }

  if (!apply) {
    console.log("Dry run — re-run with --apply.");
    return;
  }

  for (const row of rows) {
    await client
      .patch(row._id)
      .set({ "seo.metaDescription": DESCRIPTIONS[row.slug]! })
      .commit();
  }
  console.log(`Applied ${rows.length} descriptions.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
