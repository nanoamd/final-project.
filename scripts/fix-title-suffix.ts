/**
 * Ensures every product title ends in " | Kaiku".
 *
 * Damien, on the Honna Small White Silver Ceramic Planter: "doesnt end | kaiku,
 * fix it for all products". It is a standing rule from the original brief —
 * "EVERY SINGLE TITLE MUST HAVE ' | kaiku' AT THE END" — and titles are written
 * to serve as `<title>` tags, so the brand belongs on the end of them.
 *
 * Appending is safe for shoppers because `productDisplayName()` strips the
 * suffix again for the `<h1>`, the reviews panel and the structured data. The
 * brand shows in the browser tab and in Google's results, not on the page.
 *
 * **This only ever appends.** The standing constraint is that product names are
 * not to be changed, so nothing else about the title is touched — not the
 * wording, not the capitalisation, not a supplier name sitting in the middle of
 * it. Titles carrying a supplier are reported separately rather than edited,
 * because removing one is a change to the name and that is Damien's call.
 *
 * The slug is deliberately not touched. The Studio's slug rule once regenerated
 * three slugs to "-or-kaiku" from the pipe in the title, two of them on live
 * URLs, so this writes the title field alone.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-title-suffix.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-title-suffix.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const SUFFIX = " | Kaiku";

/** Already branded, in any of the forms the catalogue actually contains. */
const ALREADY_BRANDED = /\s*[|\-–—]\s*Kaiku(\s+Home)?\s*$/i;

/**
 * The "| Kaiku Tagline" template bug, and a doubled suffix from a copy-paste.
 *
 * Both are wrong in a way appending cannot fix, so they are repaired rather
 * than skipped: the trailing junk comes off and one clean suffix goes on.
 */
const BROKEN_SUFFIX = /\s*\|\s*Kaiku\s+Tagline\s*$/i;
const DOUBLED_SUFFIX = /(\s*\|\s*Kaiku\s*){2,}$/i;

/** Suppliers whose names have been found sitting inside product titles. */
const SUPPLIERS = [
  "Ancient Wisdom",
  "Premier Housewares",
  "Hill Interiors",
  "D.I. Designs",
  "Aosom",
  "HOMCOM",
  "Outsunny",
  "Viva Rugs",
];

interface Row {
  _id: string;
  title?: string | null;
}

async function main() {
  const rows: Row[] = await client.fetch(
    `*[_type == "product"]{ _id, title } | order(title asc)`,
  );

  const fixes: { id: string; from: string; to: string; why: string }[] = [];
  const supplierInTitle: { id: string; title: string; supplier: string }[] = [];
  let alreadyFine = 0;
  let noTitle = 0;

  for (const row of rows) {
    const title = row.title?.trim();
    if (!title) {
      noTitle += 1;
      continue;
    }

    for (const supplier of SUPPLIERS)
      if (new RegExp(`(?<![a-z])${supplier}(?![a-z])`, "i").test(title))
        supplierInTitle.push({ id: row._id, title, supplier });

    if (DOUBLED_SUFFIX.test(title)) {
      fixes.push({
        id: row._id,
        from: title,
        to: title.replace(DOUBLED_SUFFIX, "") + SUFFIX,
        why: "suffix repeated",
      });
      continue;
    }
    if (BROKEN_SUFFIX.test(title)) {
      fixes.push({
        id: row._id,
        from: title,
        to: title.replace(BROKEN_SUFFIX, "") + SUFFIX,
        why: '"Kaiku Tagline" template bug',
      });
      continue;
    }
    if (ALREADY_BRANDED.test(title)) {
      alreadyFine += 1;
      continue;
    }
    fixes.push({
      id: row._id,
      from: title,
      to: title + SUFFIX,
      why: "no suffix",
    });
  }

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — title suffixes\n`);
  console.log(`Products:               ${rows.length}`);
  console.log(`Already correct:        ${alreadyFine}`);
  console.log(`To fix:                 ${fixes.length}`);
  console.log(
    `  published:            ${fixes.filter((f) => !f.id.startsWith("drafts.")).length}`,
  );
  console.log(
    `  drafts:               ${fixes.filter((f) => f.id.startsWith("drafts.")).length}`,
  );
  if (noTitle) console.log(`No title at all:        ${noTitle}`);

  const byReason = new Map<string, number>();
  for (const fix of fixes)
    byReason.set(fix.why, (byReason.get(fix.why) ?? 0) + 1);
  for (const [why, count] of byReason)
    console.log(`  ${String(count).padStart(5)}  ${why}`);

  console.log(`\n──── sample ────`);
  for (const fix of fixes.slice(0, 12))
    console.log(
      `  ${fix.id.startsWith("drafts.") ? "draft" : "LIVE "}  ${fix.from}\n         → ${fix.to}`,
    );

  if (supplierInTitle.length) {
    console.log(
      `\n──── ${supplierInTitle.length} titles carry a supplier name — NOT changed here ────`,
    );
    console.log(
      `Removing one is a change to the product name, so it is Damien's call.`,
    );
    for (const item of supplierInTitle.slice(0, 12))
      console.log(`  [${item.supplier}]  ${item.title.slice(0, 78)}`);
  }

  mkdirSync("docs/change-log", { recursive: true });
  const stamp = new Date().toISOString();
  writeFileSync(
    `docs/change-log/${stamp.slice(0, 10)}-title-suffix.json`,
    JSON.stringify(
      { generatedAt: stamp, applied: apply, fixes, supplierInTitle },
      null,
      2,
    ),
  );

  if (!apply) {
    console.log(`\nNothing written. Re-run with --apply.`);
    return;
  }
  let done = 0;
  for (const fix of fixes) {
    // Title only. The slug is left exactly as it is.
    await client.patch(fix.id).set({ title: fix.to }).commit();
    if (++done % 100 === 0) console.log(`  fixed ${done}/${fixes.length}`);
  }
  console.log(`\nFixed ${done} titles.`);
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
