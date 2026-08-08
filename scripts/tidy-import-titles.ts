/**
 * Repairs product titles that arrived truncated from the --images import.
 *
 * The importer takes a product's title from its filename, which is what "Save
 * Image As" gives you. macOS caps a filename at 255 bytes but the browser
 * truncates long page titles well before that, so 26 of 33 imported titles
 * stopped dead at 99-100 characters, mid-word: "…for Bedroom Living Room,
 * Industrial St", "…Modern Table Lamp with Solid Woo".
 *
 * The missing text only ever existed on the supplier's own pages, so it cannot
 * be recovered. What can be done is cut each title back to its last complete
 * clause, which reads as a deliberate name rather than a broken one. Some
 * keywords are lost; a product card that ends mid-word costs more.
 *
 * Only touches drafts created by the importer (`drafts.product-import-*`), and
 * only titles long enough to have been truncated. The published catalogue is
 * never modified — its names are as intended.
 *
 * Dry run by default. Add --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/tidy-import-titles.ts
 */
import { pathToFileURL } from "node:url";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

/**
 * Built inside a function, not at module scope: the title rule below is
 * unit-tested, and importing this file to test it must not demand a write token
 * or exit the process.
 */
function makeClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) {
    console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
    process.exit(1);
  }
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
    token,
    useCdn: false,
  });
}

/**
 * The browser cuts a saved filename at 99-100 characters. Every truncated
 * title in the Aosom import measured exactly 99 or 100; the intact ones ran 57
 * to 87. Nothing shorter is guessed at.
 *
 * 99 rather than a rounder 95 so the script is idempotent: tidied titles come
 * out at 97 or less, so a second run finds nothing to do. At 95 it would keep
 * biting a clause off the six longest names every time it ran.
 */
const TRUNCATED_AT = 99;

/** Where a clause ends, best first: a comma beats a dash beats a preposition. */
const CLAUSE_BREAKS = [", ", " – ", " — ", " - ", " | "];
const PHRASE_BREAKS = [" with ", " & ", " w/ "];

/**
 * A title must not end on a word that was leading somewhere. Cutting
 * "…Pathway Light & Decorative Lighting with Auto" at a space leaves "with",
 * which reads worse than the truncation it replaced.
 *
 * The word has to follow whitespace, not any separator: "Automatic-on" is one
 * compound word and stripping its "on" leaves the meaningless "Automatic".
 */
const DANGLING =
  /[\s,;&/–-]*\s(with|and|for|in|to|of|the|a|an|plus|w|by|on|at)[\s,;&/–-]*$/i;

/** Short enough that the cut has thrown away the actual product. */
const TOO_SHORT = 45;

function lastBreak(title: string, breaks: string[]): number {
  return breaks.reduce((best, b) => Math.max(best, title.lastIndexOf(b)), -1);
}

export function tidyTitle(title: string): string {
  let out: string;
  const clause = lastBreak(title, CLAUSE_BREAKS);
  const phrase = lastBreak(title, PHRASE_BREAKS);

  if (clause >= TOO_SHORT) out = title.slice(0, clause);
  else if (phrase >= TOO_SHORT) out = title.slice(0, phrase);
  // Nothing to cut at but a space. Better a whole word than half of one.
  else out = title.slice(0, title.lastIndexOf(" "));

  // Repeat: stripping "and" can expose a trailing "with".
  let previous = "";
  while (out !== previous) {
    previous = out;
    out = out.replace(DANGLING, "").replace(/[\s,;&/–-]+$/, "");
  }
  return out;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/\|.*$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);

async function main() {
  const client = makeClient();
  try {
    await client.fetch<number>(`count(*[_type=="category"])`);
  } catch (err) {
    console.error(
      `Nothing was written — Sanity rejected the write token (${(err as Error).message}).\n` +
        "Create a new one at https://sanity.io/manage → API → Tokens (Editor),\n" +
        "then put it in .env.local as SANITY_API_WRITE_TOKEN=<paste>.\n",
    );
    process.exit(1);
  }

  const drafts = await client.fetch<
    { _id: string; title: string; slug: string | null }[]
  >(
    `*[_id match "drafts.product-import-*"]{_id, title, "slug": slug.current} | order(title asc)`,
  );

  // Slugs already in use anywhere, so a shortened title cannot collide with a
  // published product or with a sibling in this same batch.
  const taken = new Set(
    await client.fetch<string[]>(
      `*[_type == "product" && defined(slug.current)].slug.current`,
    ),
  );

  const changes: { _id: string; from: string; to: string; slug: string }[] = [];
  for (const d of drafts) {
    if (d.title.length < TRUNCATED_AT) continue;
    const to = tidyTitle(d.title);
    if (!to || to === d.title) continue;

    // These drafts have never been published, so the slug has never been a
    // public URL and there is nothing to redirect. Regenerate it rather than
    // leave "…-industrial-st" in the address bar forever.
    let slug = slugify(to);
    if (d.slug) taken.delete(d.slug);
    let n = 2;
    while (taken.has(slug)) slug = `${slugify(to)}-${n++}`;
    taken.add(slug);

    changes.push({ _id: d._id, from: d.title, to, slug });
  }

  console.log(
    `\n${drafts.length} imported draft(s); ${changes.length} title(s) truncated at ${TRUNCATED_AT}+ characters.\n`,
  );
  for (const c of changes) {
    console.log(`  was:  ${c.from}`);
    console.log(`  now:  ${c.to}`);
    console.log(`  url:  /shop/…/${c.slug}\n`);
  }

  if (!changes.length) {
    console.log("Nothing to do.\n");
    return;
  }
  if (!apply) {
    console.log("Dry run — nothing written. Re-run with --apply.\n");
    return;
  }

  for (const c of changes) {
    await client
      .patch(c._id)
      .set({ title: c.to, slug: { _type: "slug", current: c.slug } })
      .commit();
    console.log(`✓ ${c.to.slice(0, 66)}`);
  }
  console.log(
    `\nDone. ${changes.length} title(s) tidied. They are still drafts with no\n` +
      "price — nothing is public until you set prices and publish.\n",
  );
}

// Only when run as a command. Importing this file to unit-test tidyTitle must
// not talk to Sanity, and must not exit the test runner.
const runDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (runDirectly) {
  void main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
