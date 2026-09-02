/**
 * 45 published products embed their old keyword-stuffed title inside FAQ
 * answers, pipe character and all:
 *
 *   "The Abberley White Bedside Table | Luxury 2 Drawer Bedside Table
 *    weighs 16kg."
 *
 * A pipe mid-sentence is visibly broken to a customer, and it was broken
 * before scripts/fix-stuffed-titles.ts ran — the FAQ generator interpolated
 * the whole title field into prose without stripping the SEO segment.
 * Cleaning the titles made the mismatch worse, since the page heading and the
 * FAQ text now disagree.
 *
 * Replacement is by exact literal string, taken from the before/after pairs
 * that fix-stuffed-titles.ts recorded in its change-log. That is deliberate.
 * A first attempt matched the segment with a pattern
 * (/\|\s*(Luxury|...)\b[^|.]*​/) and it destroyed real content, because
 * `[^|.]*` runs to the first period and the surrounding prose contains
 * decimals: "weighs 23.6kg" came out as ".6kg", and an entire dimensions
 * sentence was swallowed. Caught on the dry run, which is the whole reason
 * these scripts default to one.
 *
 * A literal replacement of a known string cannot overrun.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-stuffed-titles-in-faqs.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-stuffed-titles-in-faqs.ts --apply
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

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

const LOG = "docs/change-log/2026-09-02-fix-stuffed-titles.json";

interface Faq {
  _key?: string;
  question?: string;
  answer?: string;
}
interface Product {
  _id: string;
  faqs: Faq[];
}

/** Drops a trailing " | Kaiku" so we hold the name as the FAQ prose uses it. */
function withoutBrand(title: string): string {
  const parts = title.split("|").map((p) => p.trim());
  return parts.length > 1 ? parts.slice(0, -1).join(" | ") : title;
}

function firstSegment(title: string): string {
  return (title.split("|")[0] ?? title).trim();
}

async function main() {
  const log = JSON.parse(readFileSync(LOG, "utf8")) as {
    fixed: { id: string; before: string; after: string }[];
  };

  // id -> { stuffed name as it appears in prose, clean name }
  const names = new Map<string, { stuffed: string; clean: string }>();
  for (const f of log.fixed) {
    names.set(f.id, {
      stuffed: withoutBrand(f.before),
      clean: firstSegment(f.before),
    });
  }
  console.log(`Known stuffed names from the title fix: ${names.size}`);

  const docs: Product[] = await client.fetch(
    `*[_type == "product" && !(_id in path("drafts.**")) && defined(faqs) && _id in $ids]{_id, faqs}`,
    { ids: [...names.keys()] },
  );

  const results: {
    id: string;
    changes: { before: string; after: string }[];
  }[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const doc of docs) {
    const name = names.get(doc._id);
    if (!name) continue;

    const changes: { before: string; after: string }[] = [];
    const newFaqs = (doc.faqs || []).map((faq) => {
      const next: Faq = { ...faq };
      for (const field of ["question", "answer"] as const) {
        const value = faq[field];
        if (typeof value !== "string") continue;
        if (!value.includes(name.stuffed)) continue;
        const after = value.split(name.stuffed).join(name.clean);
        changes.push({ before: value, after });
        next[field] = after;
      }
      return next;
    });

    if (changes.length === 0) continue;
    results.push({ id: doc._id, changes });
    if (apply) {
      transaction.patch(doc._id, (p) => p.set({ faqs: newFaqs }));
      queued += 1;
    }
  }

  const totalChanges = results.reduce((n, r) => n + r.changes.length, 0);
  console.log(
    `Products affected: ${results.length} (${totalChanges} FAQ fields)`,
  );
  for (const r of results.slice(0, 5)) {
    console.log(`\n${r.id}`);
    for (const c of r.changes.slice(0, 2)) {
      console.log(`  "${c.before}"`);
      console.log(`  -> "${c.after}"`);
    }
  }
  if (results.length > 5) console.log(`\n… and ${results.length - 5} more.`);

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-fix-stuffed-titles-in-faqs.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
