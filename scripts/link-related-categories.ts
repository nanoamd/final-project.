/**
 * Gives every stocked category some inbound internal links.
 *
 * `scripts/audit-internal-links.ts` reports 16 stocked categories that no other
 * category points at. They are reachable from the navigation, so a crawler can
 * find them, but nothing on the site passes them any link equity — and 20
 * products' worth of Wall Clocks sitting behind a nav-only link is a large part
 * of the answer to "why are half our pages not indexed".
 *
 * The `relatedCategories` field and the block that renders it both already
 * exist. 30 of 46 stocked categories have it filled in; these are the 16 that
 * were missed.
 *
 * Related categories are taken from the same department, because that is a real
 * relationship rather than an invented one — a shopper looking at Mirrors
 * plausibly wants other Decor. **Only stocked categories are ever linked to**,
 * so this can never point a shopper or a crawler at an empty page.
 *
 * Touches category documents only. No product is read or written.
 *
 *   pnpm tsx --env-file=.env.local scripts/link-related-categories.ts
 *   pnpm tsx --env-file=.env.local scripts/link-related-categories.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");
/** Two to four, per the field's own description. Four where there are four. */
const WANTED = 4;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

interface Row {
  _id: string;
  slug: string;
  name: string;
  departments: string[];
  related: number;
  live: number;
}

const QUERY = /* groq */ `*[_type == "category" && !(_id in path("drafts.**"))]{
  _id, "slug": slug.current, "name": title,
  "departments": array::compact([
    department->slug.current,
    ...additionalDepartments[]->slug.current
  ]),
  "related": count(relatedCategories),
  "live": count(*[_type == "product" && references(^._id)
    && !(_id in path("drafts.**")) && defined(price)])
}`;

async function main() {
  const rows: Row[] = await client.fetch(QUERY);
  const stocked = rows.filter((row) => row.live > 0);
  const needing = stocked.filter((row) => !row.related);

  const changes: { row: Row; picks: Row[] }[] = [];
  const unfixable: Row[] = [];

  for (const row of needing) {
    // Same department first, biggest first — a link into a well-stocked
    // category is worth more to a shopper than one into a category of two.
    const siblings = stocked
      .filter(
        (other) =>
          other._id !== row._id &&
          other.departments.some((d) => row.departments.includes(d)),
      )
      .sort((a, b) => b.live - a.live);

    if (siblings.length < 2) {
      // A department with no stocked siblings cannot be linked honestly. Say so
      // rather than reaching across to an unrelated department to fill a quota.
      unfixable.push(row);
      continue;
    }
    changes.push({ row, picks: siblings.slice(0, WANTED) });
  }

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — related category links\n`);
  console.log(`Stocked categories:          ${stocked.length}`);
  console.log(
    `  already linked:            ${stocked.length - needing.length}`,
  );
  console.log(`  to link now:               ${changes.length}`);
  if (unfixable.length)
    console.log(`  no stocked sibling:        ${unfixable.length}`);

  // Second pass: linking out is not the same as being linked to. A category
  // that lists four siblings still collects nothing if none of them lists it
  // back, which left six categories with no inbound link after the first pass.
  // Reciprocity is what actually moves equity.
  const willHaveOutbound = new Map<string, string[]>();
  for (const row of stocked)
    willHaveOutbound.set(row._id, row.related ? ["existing"] : []);
  for (const { row, picks } of changes)
    willHaveOutbound.set(
      row._id,
      picks.map((p) => p._id),
    );

  const linkedTo = new Set<string>();
  for (const { picks } of changes) for (const p of picks) linkedTo.add(p._id);
  // Categories whose existing links we have not read still count as pointing
  // somewhere, so fetch what they point at before deciding who is orphaned.
  const existingLinks: { _id: string; refs: string[] }[] = await client.fetch(
    `*[_type == "category" && !(_id in path("drafts.**")) && count(relatedCategories) > 0]{
       _id, "refs": relatedCategories[]._ref }`,
  );
  for (const entry of existingLinks)
    for (const ref of entry.refs ?? []) linkedTo.add(ref);

  const orphans = stocked.filter((row) => !linkedTo.has(row._id));
  const reciprocal: { host: Row; add: Row }[] = [];
  for (const orphan of orphans) {
    // Add the orphan to the biggest stocked sibling that does not already list
    // it, so the inbound link comes from the strongest page available.
    const host = stocked
      .filter(
        (other) =>
          other._id !== orphan._id &&
          other.departments.some((d) => orphan.departments.includes(d)),
      )
      .sort((a, b) => b.live - a.live)[0];
    if (host) reciprocal.push({ host, add: orphan });
  }

  if (reciprocal.length) {
    console.log(`\nReciprocal links to add: ${reciprocal.length}`);
    for (const { host, add } of reciprocal)
      console.log(`  ${host.name} will also link to ${add.name}`);
  }

  console.log(`\n──── what each will link to ────`);
  for (const { row, picks } of changes)
    console.log(
      `  ${row.name} (${row.live}) → ${picks.map((p) => `${p.name} (${p.live})`).join(", ")}`,
    );

  if (unfixable.length) {
    console.log(`\n──── cannot be linked from their own department ────`);
    for (const row of unfixable)
      console.log(
        `  ${row.name} — department [${row.departments.join(", ") || "none"}] has no other stocked category`,
      );
  }

  mkdirSync("docs/change-log", { recursive: true });
  const stamp = new Date().toISOString();
  writeFileSync(
    `docs/change-log/${stamp.slice(0, 10)}-related-categories.json`,
    JSON.stringify(
      {
        generatedAt: stamp,
        applied: apply,
        changes: changes.map((c) => ({
          slug: c.row.slug,
          name: c.row.name,
          links: c.picks.map((p) => p.slug),
        })),
        unfixable: unfixable.map((r) => r.slug),
      },
      null,
      2,
    ),
  );

  if (!apply) {
    console.log(`\nNothing written. Re-run with --apply.`);
    return;
  }

  let done = 0;
  for (const { row, picks } of changes) {
    await client
      .patch(row._id)
      .set({
        relatedCategories: picks.map((pick) => ({
          _type: "reference",
          _ref: pick._id,
          // Sanity refuses to edit an array whose items have no _key, which is
          // the "Missing keys" warning already showing on some documents.
          _key: `rel-${pick.slug}`.slice(0, 40),
        })),
      })
      .commit();
    done += 1;
  }
  console.log(`\nLinked ${done} categories.`);

  let added = 0;
  for (const { host, add } of reciprocal) {
    const current: { _ref: string }[] =
      (await client.fetch(`*[_id == $id][0].relatedCategories[]{_ref}`, {
        id: host._id,
      })) ?? [];
    if (current.some((item) => item?._ref === add._id)) continue;
    await client
      .patch(host._id)
      .setIfMissing({ relatedCategories: [] })
      .append("relatedCategories", [
        {
          _type: "reference",
          _ref: add._id,
          _key: `rel-${add.slug}`.slice(0, 40),
        },
      ])
      .commit();
    added += 1;
  }
  if (added) console.log(`Added ${added} reciprocal links.`);
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
