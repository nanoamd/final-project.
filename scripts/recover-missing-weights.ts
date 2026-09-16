/**
 * Recovers the product weights that are already written down but not stored.
 *
 * 557 of 908 products have no `weight`, and eBay calculates postage from it.
 * Without one the shipping on a listing is a guess, which is how a 30% margin
 * quietly becomes 10%. Hill's carriage is banded by weight too, so the same
 * blank distorts the margin model.
 *
 * The number is usually already in the copy — "weighing 3.5kg", or a spec row
 * labelled Weight. This reads it back out rather than asking a supplier for
 * data we were already given.
 *
 * THREE TIERS, AND ONLY TWO ARE APPLIED.
 *
 *   HIGH    A spec row whose label is Weight, or prose saying "weighs 4.2kg".
 *           The sentence states it IS the weight, so there is nothing to infer.
 *   MEDIUM  Exactly one weight-shaped figure anywhere in the copy, inside a
 *           plausible range. One candidate cannot be confused with another.
 *   LOW     Several different figures, or one outside the range. **Not
 *           applied.** A mirror's "33 kg" is as likely to be a wall fixing's
 *           load rating as the mirror's own weight, and a wrong weight prices
 *           postage wrong on every future order rather than failing loudly.
 *
 * The range is 0.05kg to 200kg. Below that is packaging; above it, nothing in
 * this catalogue except a sauna, and those are quoted rather than posted.
 *
 *   pnpm tsx --env-file=.env.local scripts/recover-missing-weights.ts
 *   pnpm tsx --env-file=.env.local scripts/recover-missing-weights.ts --apply
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
});

const MIN_KG = 0.05;
const MAX_KG = 200;

interface Block {
  _type?: string;
  children?: { text?: string }[];
}
interface Row {
  _id: string;
  slug: string;
  weight: number | null;
  summary: string | null;
  description: Block[] | null;
  specs: { label?: string; value?: string }[] | null;
}

const blocksToText = (b: Block[] | null) =>
  (b ?? [])
    .filter((x) => x._type === "block")
    .map((x) => (x.children ?? []).map((c) => c.text ?? "").join(""))
    .join(" ");

/** Parse "4.2kg" / "850 g" / "1.8 kilograms" into kilograms. */
function toKg(value: string, unit: string): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  const kg = /^(g|gram)/i.test(unit) ? n / 1000 : n;
  return kg >= MIN_KG && kg <= MAX_KG ? Number(kg.toFixed(3)) : null;
}

const ANY = /(\d+(?:[.,]\d+)?)\s*(kilograms?|kgs?|grams?|g)\b/gi;
/** Prose that states the figure IS the product's weight. */
const STATED =
  /\b(?:weigh(?:s|ing|t(?:\s*[:of]{1,3})?)|weighs in at)\s*(?:approx(?:\.|imately)?\s*)?(\d+(?:[.,]\d+)?)\s*(kilograms?|kgs?|grams?|g)\b/i;

interface Found {
  kg: number;
  tier: "HIGH" | "MEDIUM" | "LOW";
  from: string;
}

function findWeight(r: Row): Found | null {
  // HIGH — a spec row that says Weight.
  for (const s of r.specs ?? []) {
    if (!/weight/i.test(s.label ?? "")) continue;
    const m = ANY.exec(s.value ?? "");
    ANY.lastIndex = 0;
    if (m) {
      const kg = toKg(m[1]!.replace(",", "."), m[2]!);
      if (kg)
        return { kg, tier: "HIGH", from: `spec "${s.label}: ${s.value}"` };
    }
  }

  const text = `${r.summary ?? ""} ${blocksToText(r.description)}`;

  // HIGH — prose that names it as the weight.
  const stated = text.match(STATED);
  if (stated) {
    const kg = toKg(stated[1]!.replace(",", "."), stated[2]!);
    if (kg) return { kg, tier: "HIGH", from: `"${stated[0].trim()}"` };
  }

  // MEDIUM — exactly one plausible candidate in the whole copy.
  const all = [...text.matchAll(ANY)]
    .map((m) => toKg(m[1]!.replace(",", "."), m[2]!))
    .filter((v): v is number => v !== null);
  const distinct = [...new Set(all)];
  if (distinct.length === 1)
    return { kg: distinct[0]!, tier: "MEDIUM", from: `single figure in copy` };
  if (distinct.length > 1)
    return {
      kg: distinct[0]!,
      tier: "LOW",
      from: `${distinct.length} different figures: ${distinct.slice(0, 4).join(", ")}`,
    };
  return null;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type=="product" && !(_id in path("drafts.**"))]{
       _id, "slug": slug.current, "weight": weight.value, summary, description, specs }`,
  );
  const missing = rows.filter((r) => r.weight == null);
  console.log(`\n${rows.length} products, ${missing.length} with no weight.\n`);

  const tiers = {
    HIGH: [] as (Row & Found)[],
    MEDIUM: [] as (Row & Found)[],
    LOW: [] as (Row & Found)[],
  };
  let none = 0;
  for (const r of missing) {
    const f = findWeight(r);
    if (!f) {
      none++;
      continue;
    }
    tiers[f.tier].push({ ...r, ...f });
  }

  console.log(
    `  HIGH   ${String(tiers.HIGH.length).padStart(4)}  stated as the weight — will apply`,
  );
  console.log(
    `  MEDIUM ${String(tiers.MEDIUM.length).padStart(4)}  one plausible figure — will apply`,
  );
  console.log(
    `  LOW    ${String(tiers.LOW.length).padStart(4)}  ambiguous — left alone`,
  );
  console.log(
    `  none   ${String(none).padStart(4)}  no figure in the copy at all\n`,
  );

  const willApply = [...tiers.HIGH, ...tiers.MEDIUM];
  console.log("SAMPLE\n");
  for (const r of willApply.slice(0, 10))
    console.log(
      `  ${String(r.kg).padStart(7)}kg  ${r.tier.padEnd(7)} ${r.slug.slice(0, 38).padEnd(40)} ${r.from.slice(0, 40)}`,
    );
  if (tiers.LOW.length) {
    console.log("\nLEFT ALONE — ambiguous:\n");
    for (const r of tiers.LOW.slice(0, 8))
      console.log(`  ${r.slug.slice(0, 40).padEnd(42)} ${r.from}`);
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-17-recovered-weights.json",
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        applied: willApply.map((r) => ({
          slug: r.slug,
          kg: r.kg,
          tier: r.tier,
          from: r.from,
        })),
        ambiguous: tiers.LOW.map((r) => ({ slug: r.slug, from: r.from })),
      },
      null,
      2,
    )}\n`,
  );

  if (!apply)
    return console.log(
      `\nDry run — would set ${willApply.length} weights. Re-run with --apply.\n`,
    );
  let done = 0;
  for (const r of willApply) {
    await client
      .patch(r._id)
      .set({ weight: { value: r.kg, unit: "kg" } })
      .commit();
    if (++done % 100 === 0) console.log(`  ${done}/${willApply.length}`);
  }
  console.log(`\nSet ${done} weights.\n`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
