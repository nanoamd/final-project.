/**
 * Applies the hand-written Aosom product names.
 *
 * Replaces what the regex simplifier did to this range. That produced names
 * ending on "Home", "Upholstered" and "Post", because it chopped marketplace
 * titles at seventy characters — Damien's verdict, "im not happy with this",
 * was correct and the approach was wrong rather than under-tuned.
 *
 * The names live in scripts/data/aosom-titles.ts, one written per product.
 * This only matches them to documents and writes them.
 *
 * Slugs are never touched, so no URL moves and no ranking is lost.
 *
 *   pnpm tsx --env-file=.env.local scripts/apply-aosom-titles.ts
 *   pnpm tsx --env-file=.env.local scripts/apply-aosom-titles.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { AOSOM_TITLES, AOSOM_TITLES_BY_ID } from "./data/aosom-titles";

const apply = process.argv.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

async function main() {
  const rows: { _id: string; title?: string; slug?: string }[] =
    await client.fetch(
      `*[_type == "product" && supplier->name == "Aosom"]{ _id, title, "slug": slug.current }`,
    );

  const changes: { id: string; slug: string; before: string; after: string }[] =
    [];
  const unmatched: string[] = [];

  for (const row of rows) {
    const slug = row.slug ?? "";
    // An ID-keyed name wins: it exists precisely because that slug is shared
    // with a different product and cannot identify this one.
    const written = AOSOM_TITLES_BY_ID[row._id] ?? AOSOM_TITLES[slug];
    if (!written) {
      unmatched.push(`${slug} — currently "${row.title}"`);
      continue;
    }
    const next = `${written} | Kaiku`;
    if (next === row.title) continue;
    changes.push({
      id: row._id,
      slug,
      before: row.title ?? "",
      after: next,
    });
  }

  // Two products sharing a name is a worse fault than a clumsy one, so it stops
  // the run rather than being reported and written anyway.
  // Two products at one URL is a fault in its own right — one of them cannot
  // be reached at all — so it is reported rather than quietly worked around.
  const bySlug = new Map<string, string[]>();
  for (const row of rows) {
    const list = bySlug.get(row.slug ?? "") ?? [];
    list.push(row._id);
    bySlug.set(row.slug ?? "", list);
  }
  const sharedSlugs = [...bySlug].filter(
    ([, ids]) => new Set(ids.map((id) => id.replace(/^drafts\./, ""))).size > 1,
  );

  const byName = new Map<string, string[]>();
  for (const change of changes) {
    const list = byName.get(change.after) ?? [];
    list.push(change.slug);
    byName.set(change.after, list);
  }
  const collisions = [...byName].filter(([, list]) => list.length > 1);

  console.log(
    `\n${apply ? "APPLYING" : "DRY RUN"} — hand-written Aosom names\n`,
  );
  console.log(`Aosom products:        ${rows.length}`);
  console.log(`Names to write:        ${changes.length}`);
  console.log(
    `  published among them: ${changes.filter((c) => !c.id.startsWith("drafts.")).length}`,
  );
  console.log(
    `Already correct:       ${rows.length - changes.length - unmatched.length}`,
  );
  console.log(`No name written yet:   ${unmatched.length}`);
  unmatched.forEach((u) => console.log(`   ${u.slice(0, 110)}`));

  if (collisions.length) {
    console.log(`\nCOLLISIONS — two products would share a name:`);
    collisions.forEach(([name, slugs]) =>
      console.log(`  "${name}"\n      ${slugs.join("\n      ")}`),
    );
  }

  if (sharedSlugs.length) {
    console.log(
      `\n⚠  ${sharedSlugs.length} slugs are shared by different products — one of each pair has no reachable URL:`,
    );
    for (const [slug, ids] of sharedSlugs)
      console.log(`   ${slug}\n      ${ids.join("\n      ")}`);
    console.log(
      `   Naming them is handled; the shared URL still needs fixing separately.`,
    );
  }

  const longest = [...changes].sort((a, b) => b.after.length - a.after.length);
  console.log(`\nlongest names: ${longest[0]?.after.length ?? 0} characters`);
  console.log(
    `average: ${Math.round(changes.reduce((n, c) => n + c.after.length, 0) / Math.max(1, changes.length))} characters`,
  );

  console.log(`\n──── every change ────`);
  for (const change of changes) {
    console.log(`  −  ${change.before.slice(0, 96)}`);
    console.log(`  +  ${change.after}`);
  }

  mkdirSync("docs/change-log", { recursive: true });
  const stamp = new Date().toISOString();
  writeFileSync(
    `docs/change-log/${stamp.slice(0, 10)}-aosom-titles.json`,
    JSON.stringify({ generatedAt: stamp, applied: apply, changes }, null, 2),
  );

  if (!apply) {
    console.log("\nNothing written. Re-run with --apply.");
    return;
  }
  if (collisions.length) {
    console.error("\nNot applying while two products would share a name.");
    process.exit(1);
  }
  let done = 0;
  for (const change of changes) {
    await client.patch(change.id).set({ title: change.after }).commit();
    if (++done % 25 === 0) console.log(`  written ${done}/${changes.length}`);
  }
  console.log(`\nRenamed ${done} products. No slug was changed.`);
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
