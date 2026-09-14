/**
 * Fills `colourTags` and `materialTags` from the product's own name.
 *
 * 649 of 907 products reach the Merchant feed with no `g:color` and 615 with no
 * `g:material`. Neither blocks approval, but both are attributes Google matches
 * a query against: "grey dining table" and "oak sideboard" are how people
 * actually search, and an item that declares neither competes for fewer of them.
 *
 * Nothing here is inferred from a picture or a guess. A tag is written only
 * when the word appears in the product's own title — "Set Of Three Wooden
 * Lanterns — Grey Wood" states its colour and material in its name, and that is
 * the only evidence used. Products whose title says nothing are left alone
 * rather than assigned a plausible-looking default.
 *
 * Existing tags are never overwritten. An editor's judgement, or a value read
 * off a supplier spec, beats a word extracted from a title.
 *
 *   pnpm tsx --env-file=.env.local scripts/backfill-colour-material-tags.ts
 *   pnpm tsx --env-file=.env.local scripts/backfill-colour-material-tags.ts --apply
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

/**
 * Longest first, so "Grey Wash" is read before "Grey" and "Light Grey" before
 * "Grey". The value written is the canonical form on the right.
 */
const COLOURS: [RegExp, string][] = [
  [/\bwhite\s*wash\b|\bwhitewash\b/i, "Whitewash"],
  [/\bgrey\s*wash\b|\bgreywash\b/i, "Greywash"],
  [/\bblue\s*wash\b/i, "Bluewash"],
  [/\bcharcoal\b/i, "Charcoal"],
  [/\bantique\s+brass\b/i, "Brass"],
  [/\brose\s+gold\b/i, "Rose Gold"],
  [/\bgun\s*metal\b/i, "Gunmetal"],
  [/\bblack\b/i, "Black"],
  [/\bwhite\b/i, "White"],
  [/\bgrey\b|\bgray\b/i, "Grey"],
  [/\bcream\b/i, "Cream"],
  [/\bnatural\b/i, "Natural"],
  [/\bbrown\b/i, "Brown"],
  [/\bgold\b/i, "Gold"],
  [/\bsilver\b/i, "Silver"],
  [/\bbronze\b/i, "Bronze"],
  [/\bbrass\b/i, "Brass"],
  [/\bcopper\b/i, "Copper"],
  [/\bgreen\b/i, "Green"],
  [/\bblue\b/i, "Blue"],
  [/\bbeige\b/i, "Beige"],
  [/\btaupe\b/i, "Taupe"],
  [/\bivory\b/i, "Ivory"],
  [/\bsage\b/i, "Sage"],
  [/\bkhaki\b/i, "Khaki"],
  [/\bpink\b/i, "Pink"],
  [/\bred\b/i, "Red"],
  [/\bclear\b/i, "Clear"],
];

const MATERIALS: [RegExp, string][] = [
  [/\bmango\s+wood\b/i, "Mango Wood"],
  [/\bacacia\b/i, "Acacia"],
  [/\brecycled\s+(?:elm|pine|wood)\b|\breclaimed\s+wood\b/i, "Reclaimed Wood"],
  [/\belm\b/i, "Elm"],
  [/\boak\b/i, "Oak"],
  [/\bteak\b/i, "Teak"],
  [/\bwalnut\b/i, "Walnut"],
  [/\bpine\b/i, "Pine"],
  [/\bbirch\b/i, "Birch"],
  [/\bspruce\b/i, "Spruce"],
  [/\bbamboo\b/i, "Bamboo"],
  [/\brattan\b/i, "Rattan"],
  [/\bwicker\b/i, "Wicker"],
  [/\bmarble\b/i, "Marble"],
  [/\bceramic\b/i, "Ceramic"],
  [/\bstoneware\b/i, "Stoneware"],
  [/\bearthenware\b/i, "Earthenware"],
  [/\bporcelain\b/i, "Porcelain"],
  [/\bconcrete\b/i, "Concrete"],
  [/\bglass\b/i, "Glass"],
  [/\bvelvet\b/i, "Velvet"],
  [/\bbouclé\b|\bboucle\b/i, "Bouclé"],
  [/\bchenille\b/i, "Chenille"],
  [/\blinen\b/i, "Linen"],
  [/\bleather\b/i, "Leather"],
  [/\bjute\b/i, "Jute"],
  [/\bsteel\b/i, "Steel"],
  [/\baluminium\b/i, "Aluminium"],
  [/\bmetal\b/i, "Metal"],
  [/\bresin\b/i, "Resin"],
  [/\bstone\b/i, "Stone"],
  [/\bwood\b/i, "Wood"],
];

/** First match wins, so the longest and most specific patterns must come first. */
function firstMatch(title: string, table: [RegExp, string][]): string | null {
  for (const [pattern, value] of table) if (pattern.test(title)) return value;
  return null;
}

interface Row {
  _id: string;
  title: string;
  slug: string | null;
  colourTags: string[] | null;
  materialTags: string[] | null;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type=="product" && !(_id in path("drafts.**")) && defined(slug.current)]{
      _id, title, "slug": slug.current, colourTags, materialTags }`,
  );

  const changes: {
    _id: string;
    slug: string | null;
    title: string;
    colour?: string;
    material?: string;
  }[] = [];

  for (const row of rows) {
    const patch: { colour?: string; material?: string } = {};
    // Never overwrite what is already recorded.
    if (!row.colourTags?.length) {
      const colour = firstMatch(row.title, COLOURS);
      if (colour) patch.colour = colour;
    }
    if (!row.materialTags?.length) {
      const material = firstMatch(row.title, MATERIALS);
      if (material) patch.material = material;
    }
    if (patch.colour || patch.material)
      changes.push({
        _id: row._id,
        slug: row.slug,
        title: row.title.replace(" | Kaiku", ""),
        ...patch,
      });
  }

  const colours = changes.filter((c) => c.colour).length;
  const materials = changes.filter((c) => c.material).length;
  const noColour = rows.filter((r) => !r.colourTags?.length).length;
  const noMaterial = rows.filter((r) => !r.materialTags?.length).length;

  console.log(`\n${rows.length} products.`);
  console.log(
    `  colour:   ${noColour} had none, ${colours} recoverable from the title (${noColour - colours} stay empty)`,
  );
  console.log(
    `  material: ${noMaterial} had none, ${materials} recoverable from the title (${noMaterial - materials} stay empty)`,
  );
  console.log(`\n  ${changes.length} products to patch.\n`);

  for (const c of changes.slice(0, 15))
    console.log(
      `    ${(c.colour ?? "—").padEnd(11)} ${(c.material ?? "—").padEnd(15)} ${c.title.slice(0, 48)}`,
    );
  if (changes.length > 15) console.log(`    … and ${changes.length - 15} more`);

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-14-colour-material-backfill.json",
    `${JSON.stringify({ generatedAt: new Date().toISOString(), changes }, null, 2)}\n`,
  );

  if (!apply) return console.log("\nDry run — re-run with --apply.");

  for (const c of changes) {
    const patch: Record<string, string[]> = {};
    if (c.colour) patch.colourTags = [c.colour];
    if (c.material) patch.materialTags = [c.material];
    await client.patch(c._id).set(patch).commit();
  }
  console.log(`\nPatched ${changes.length} products.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
