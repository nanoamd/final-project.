/**
 * Products whose name claims one material and whose supplier records another.
 *
 * Found while gathering facts to rewrite the worst descriptions: the "Glass
 * Candle Holder" is listed by Hill Interiors with `Material: stone`. One of
 * those is wrong, and a rewrite cannot proceed on either until somebody
 * decides which — writing "crafted from glass" or "crafted from stone" would
 * be picking a side at random and presenting it as fact.
 *
 * Read-only. This reports; it never edits a name or a material.
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-material-contradictions.ts
 */
import { existsSync, readFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

/**
 * Materials that a product name asserts, and the words that would contradict
 * them. Only pairs that genuinely cannot both be true are listed — "wood" and
 * "oak" agree, "glass" and "stone" do not.
 */
const INCOMPATIBLE: Record<string, string[]> = {
  glass: ["stone", "ceramic", "wood", "metal", "resin", "plastic"],
  // Stone and ceramic are not a contradiction: stoneware is a ceramic, and
  // the trade uses "stone" for the look as often as the substance.
  ceramic: ["glass", "wood", "metal"],
  wood: ["glass", "ceramic", "metal"],
  wooden: ["glass", "ceramic", "metal"],
  metal: ["glass", "ceramic", "wood", "resin"],
  stone: ["glass", "wood", "metal"],
  ceramics: ["glass", "wood", "metal"],
  teak: ["glass", "ceramic", "metal"],
  oak: ["glass", "ceramic", "metal"],
  rattan: ["glass", "ceramic", "metal", "stone"],
  bamboo: ["glass", "ceramic", "metal", "stone"],
  marble: ["wood", "plastic"],
};

/**
 * Words that name the same material family. A supplier writing "Iron 40%" is
 * not contradicting a name that says "Metal Frame", and treating it as one
 * produced four false reports.
 */
const FAMILIES: Record<string, string[]> = {
  metal: [
    "iron",
    "steel",
    "aluminium",
    "aluminum",
    "brass",
    "chrome",
    "nickel",
    "zinc",
    "pewter",
  ],
  glass: ["mirror", "mirrored", "crystal"],
  wood: [
    "mdf",
    "pine",
    "oak",
    "teak",
    "mango",
    "acacia",
    "elm",
    "rubberwood",
    "timber",
  ],
  ceramic: ["porcelain", "stoneware", "earthenware", "clay"],
  stone: ["marble", "granite", "slate", "concrete"],
};

/** wooden/wood, ceramics/ceramic — the same material, different word ending. */
function stem(word: string): string {
  return word.replace(/(?:en|s)$/, "");
}

/**
 * Whether the supplier's material list already contains the material the name
 * claims. "Wooden Wall Clock" against "metal, wood" agrees — the clock is
 * partly wood, and the name picked the part a shopper cares about.
 */
function agrees(claimed: string, supplierMaterial: string): boolean {
  const wanted = stem(claimed);
  const family = [wanted, ...(FAMILIES[wanted] ?? [])];
  return supplierMaterial
    .toLowerCase()
    .split(/[,/&]|\band\b/)
    .map((part) => stem(part.replace(/\d+%?/g, "").trim()))
    .some((part) =>
      family.some((word) => part === word || part.includes(word)),
    );
}

async function main() {
  if (!existsSync(".audit/harvested-facts.json")) {
    console.error("Run scripts/harvest-supplier-facts.ts first.");
    process.exit(1);
  }
  const harvested: Record<string, { material?: string; title?: string }> =
    JSON.parse(readFileSync(".audit/harvested-facts.json", "utf8"));

  const rows: { _id: string; title?: string; supplier?: string }[] =
    await client.fetch(
      `*[_type == "product"]{ _id, title, "supplier": supplier->name }`,
    );

  const clashes: {
    published: boolean;
    title: string;
    claims: string;
    supplierSays: string;
  }[] = [];

  for (const row of rows) {
    const facts = harvested[row._id];
    const supplierMaterial = (facts?.material ?? "").toLowerCase();
    if (!supplierMaterial) continue;
    const name = (row.title ?? "").toLowerCase();

    // "Stone Effect", "Marble Style", "Oak Look" describe an appearance, not a
    // substance, so they cannot contradict the material they imitate.
    if (/\b(?:effect|style|look|finish|inspired)\b/.test(name)) continue;

    for (const [claimed, conflicts] of Object.entries(INCOMPATIBLE)) {
      if (!new RegExp(`\\b${claimed}\\b`).test(name)) continue;
      // "Tealight On Stand With Glass Votive" names a component, not the body.
      // The stand is metal and the votive is glass, and both are true, so the
      // supplier's single material cannot contradict it.
      if (new RegExp(`\\bwith\\b[^,]*\\b${claimed}\\b`).test(name)) continue;
      // A supplier listing several materials that include the claimed one
      // agrees with the name — "metal, mirrored glass" is not a contradiction
      // of "Metal Wall Mirror".
      if (agrees(claimed, supplierMaterial)) continue;
      const hit = conflicts.find((word) =>
        new RegExp(`\\b${word}\\b`).test(supplierMaterial),
      );
      // A name may legitimately mention both — "Mirror and Wood Frame" is
      // glass and wood — so only flag when the name never mentions the
      // supplier's material at all.
      if (!hit) continue;
      if (new RegExp(`\\b${hit}\\b`).test(name)) continue;
      clashes.push({
        published: !row._id.startsWith("drafts."),
        title: row.title ?? "",
        claims: claimed,
        supplierSays: facts!.material!,
      });
      break;
    }
  }

  console.log(
    `\nProducts whose name and supplier disagree on the material: ${clashes.length}`,
  );
  console.log(`  published: ${clashes.filter((c) => c.published).length}\n`);
  for (const clash of clashes) {
    console.log(
      `  [${clash.published ? "PUBLISHED" : "draft"}] ${clash.title.slice(0, 56)}`,
    );
    console.log(
      `      name says "${clash.claims}", supplier says "${clash.supplierSays}"`,
    );
  }
  if (clashes.length)
    console.log(`\nNeither is safe to write into copy until one is confirmed.`);
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
