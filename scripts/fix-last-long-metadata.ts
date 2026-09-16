/**
 * The last nine pages whose title or description is still the wrong length.
 *
 * `fix-thin-product-metadata.ts` cleared 96 of 105 by rule. These nine are
 * what a rule could not do safely: six product titles where the product NAME
 * itself is over 60 characters, two guide titles a single character over, and
 * one description at 391.
 *
 * So they are written out by hand, one at a time, which is the right amount of
 * effort for nine pages and the wrong amount for ninety-six.
 *
 * THE PRODUCT NAME IS NOT TOUCHED. "Do not change product names, or strip the
 * `| Kaiku` suffix" is a standing constraint, and it is about `title` — the
 * <h1>, the structured data, the name a customer sees. `seo.metaTitle` is a
 * separate field whose whole job is fitting in a search result, and it has
 * always differed from the product name on this site. Each rewrite below keeps
 * every word that identifies the piece and drops only the descriptive padding
 * that Google was truncating anyway.
 *
 * One of them also fixes a data artefact: "2.75m\9ft" carries a stray
 * backslash from whatever produced it, and it was being rendered to searchers.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-last-long-metadata.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-last-long-metadata.ts --apply
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

const TITLE_MAX = 60;
const DESC_MAX = 160;
const DESC_MIN = 70;

interface Fix {
  type: "product" | "buyingGuide";
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  why: string;
}

const FIXES: Fix[] = [
  {
    type: "product",
    slug: "goa-black-rattan-effect-double-hanging-chair-with-grey-cushions",
    metaTitle: "Goa Rattan Double Hanging Chair, Grey Cushions | Kaiku",
    why: '"Effect" and "Black" dropped — the cushions colour is the one a shopper filters on',
  },
  {
    type: "product",
    slug: "carta-black-and-white-stripe-papier-mache-domed-pendant-light",
    metaTitle: "Carta Striped Papier Mâché Domed Pendant Light | Kaiku",
    why: '"Black and White" becomes "Striped" — same meaning, 11 characters',
  },
  {
    type: "product",
    slug: "carta-taupe-etched-linear-design-papier-mache-domed-table-lamp",
    metaTitle: "Carta Taupe Etched Papier Mâché Table Lamp | Kaiku",
    why: '"Linear Design" and "Domed" are shape detail the photograph carries',
  },
  {
    type: "product",
    slug: "torcino-mango-wood-carved-design-marble-top-three-door-sideboard",
    metaTitle: "Torcino Mango Wood Marble-Top 3 Door Sideboard | Kaiku",
    why: '"Carved Design" dropped; "Three" to "3", which is how sideboards are searched',
  },
  {
    type: "product",
    slug: "50-000-btu-gas-fire-pit-table-with-cover-and-glass-screen-dark-grey",
    metaTitle: "50,000 BTU Fire Pit Table, Cover & Glass Screen | Kaiku",
    why: "Colour dropped — BTU and the screen are what the search is for",
  },
  {
    type: "product",
    slug: "2-75m-9ft-plug-in-led-8-sequence-warm-white-cluster-string",
    metaTitle: "2.75m Plug-In LED Warm White Cluster String Lights | Kaiku",
    why: 'Drops the "\\9ft" artefact, which was a stray backslash shown to searchers',
  },
  {
    type: "buyingGuide",
    slug: "bedside-table-height-guide",
    metaTitle: "What Height Should a Bedside Table Be? | Kaiku",
    why: '"| Sizing Guide" was the segment pushing it over, and the question already says it',
  },
  {
    type: "buyingGuide",
    slug: "chandelier-vs-pendant-light",
    metaTitle: "Chandelier or Pendant Light: How Much Clearance? | Kaiku",
    why: "Reads as the question it answers rather than as a category label",
  },
  {
    type: "product",
    slug: "ultimate-trent-outdoor-kitchen",
    metaDescription:
      "The larger Trent outdoor kitchen in pressure-treated softwood, with a stainless steel top, double and single cupboards and a corner shelving unit.",
    why: "391 characters cut to the first thing a buyer needs — what it is and what is in it",
  },
];

async function main() {
  let failed = false;
  for (const fix of FIXES) {
    if (fix.metaTitle && fix.metaTitle.length > TITLE_MAX) {
      console.error(`${fix.slug}: new title is ${fix.metaTitle.length} chars.`);
      failed = true;
    }
    if (
      fix.metaDescription &&
      (fix.metaDescription.length > DESC_MAX ||
        fix.metaDescription.length < DESC_MIN)
    ) {
      console.error(
        `${fix.slug}: new description is ${fix.metaDescription.length} chars.`,
      );
      failed = true;
    }
  }
  if (failed) process.exit(1);

  const found = await client.fetch<
    { _id: string; slug: string; type: string }[]
  >(
    `*[_type in ["product","buyingGuide"] && !(_id in path("drafts.**")) && slug.current in $slugs]{
      _id, "slug": slug.current, "type": _type }`,
    { slugs: FIXES.map((f) => f.slug) },
  );
  const bySlug = new Map(found.map((f) => [f.slug, f]));
  const missing = FIXES.filter((f) => !bySlug.has(f.slug));
  if (missing.length) {
    console.error(
      `These do not exist:\n  ${missing.map((m) => m.slug).join("\n  ")}`,
    );
    process.exit(1);
  }
  const wrongType = FIXES.filter((f) => bySlug.get(f.slug)!.type !== f.type);
  if (wrongType.length) {
    console.error(
      `Type mismatch: ${wrongType.map((w) => `${w.slug} is ${bySlug.get(w.slug)!.type}, expected ${w.type}`).join("; ")}`,
    );
    process.exit(1);
  }

  console.log(`\n${FIXES.length} hand-written fixes.\n`);
  for (const fix of FIXES) {
    console.log(`  ${fix.slug}`);
    if (fix.metaTitle)
      console.log(`    title (${fix.metaTitle.length})  ${fix.metaTitle}`);
    if (fix.metaDescription)
      console.log(
        `    desc  (${fix.metaDescription.length})  ${fix.metaDescription}`,
      );
    console.log(`    ${fix.why}\n`);
  }

  if (!apply) return console.log("Dry run — re-run with --apply.");
  for (const fix of FIXES) {
    const patch: Record<string, string> = {};
    if (fix.metaTitle) patch["seo.metaTitle"] = fix.metaTitle;
    if (fix.metaDescription) patch["seo.metaDescription"] = fix.metaDescription;
    await client.patch(bySlug.get(fix.slug)!._id).set(patch).commit();
  }
  console.log(`Applied ${FIXES.length}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
