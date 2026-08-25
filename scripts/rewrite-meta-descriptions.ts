/**
 * Rewrites meta descriptions so a search result carries a fact.
 *
 * Damien: "improve every single product description to optimize for views".
 * The description a shopper reads before clicking is the meta description, and
 * all 287 published products currently open "Shop the <name> at Kaiku" and
 * close "Premium UK homewares for modern living" — roughly 45 of 160
 * characters spent identically across the catalogue, with no fact in what
 * remains.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-meta-descriptions.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-meta-descriptions.ts --apply
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { buildMetaDescription } from "../src/lib/catalog/meta-description";

const apply = process.argv.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

/** Products where the name and the supplier disagree on the material. */
const DISPUTED = new Set(["hill-decor-16210", "drafts.hill-decor-16210"]);

async function main() {
  const harvested: Record<
    string,
    { material?: string; extra?: Record<string, string> }
  > = existsSync(".audit/harvested-facts.json")
    ? JSON.parse(readFileSync(".audit/harvested-facts.json", "utf8"))
    : {};

  const rows: {
    _id: string;
    title?: string;
    category?: string;
    dimensions?: never;
    weight?: never;
    current?: string;
  }[] = await client.fetch(
    `*[_type == "product"]{
      _id, title, dimensions, weight,
      "category": category->title,
      "current": seo.metaDescription
    }`,
  );

  const changes: { id: string; before: string; after: string }[] = [];
  let unchanged = 0;

  for (const row of rows) {
    const facts = harvested[row._id] ?? {};
    const next = buildMetaDescription({
      title: row.title ?? "",
      category: row.category,
      dimensions: row.dimensions ?? null,
      weight: row.weight ?? null,
      material: facts.material ?? null,
      extra: facts.extra ?? {},
      materialDisputed: DISPUTED.has(row._id),
    });
    if (next === row.current) {
      unchanged++;
      continue;
    }
    changes.push({ id: row._id, before: row.current ?? "(none)", after: next });
  }

  const withFacts = changes.filter((c) => /\d/.test(c.after)).length;

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — meta descriptions\n`);
  console.log(`Products:                ${rows.length}`);
  console.log(`To rewrite:              ${changes.length}`);
  console.log(
    `  published:             ${changes.filter((c) => !c.id.startsWith("drafts.")).length}`,
  );
  console.log(`  carrying a measurement: ${withFacts}`);
  console.log(`Already correct:         ${unchanged}`);
  console.log(
    `Average length:          ${Math.round(changes.reduce((n, c) => n + c.after.length, 0) / Math.max(1, changes.length))} characters`,
  );

  console.log(`\n──── sample ────`);
  for (const change of changes.slice(0, 8)) {
    console.log(`\n  −  ${change.before.slice(0, 150)}`);
    console.log(`  +  ${change.after}`);
  }

  mkdirSync("docs/change-log", { recursive: true });
  const stamp = new Date().toISOString();
  writeFileSync(
    `docs/change-log/${stamp.slice(0, 10)}-meta-descriptions.json`,
    JSON.stringify({ generatedAt: stamp, applied: apply, changes }, null, 2),
  );

  if (!apply) {
    console.log("\nNothing written. Re-run with --apply.");
    return;
  }
  let done = 0;
  for (const change of changes) {
    await client
      .patch(change.id)
      .set({ "seo.metaDescription": change.after })
      .commit();
    if (++done % 50 === 0) console.log(`  written ${done}/${changes.length}`);
  }
  console.log(`\nRewrote ${done} meta descriptions.`);
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
