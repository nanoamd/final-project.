/**
 * Normalises `deliveryLeadTime` across the catalogue.
 *
 * The product page renders the field verbatim — "Delivered in {value}" — and
 * the field held 14 distinct spellings across 41 products, several of them
 * broken:
 *
 *   "4-6"                  → renders as "Delivered in 4-6". Weeks? Days?
 *   "4-6 weeks4"           → a stray keystroke, shown to customers
 *   "2-4 week dispatch"    → "Delivered in 2-4 week dispatch"
 *   "2-5 days shipping time"
 *   "2-4 weeks " / "2-4 weeks"   → same lead time, two values
 *   "3–4 weeks" / "3-4 weeks"    → en dash and hyphen, both in use
 *
 * A shopper deciding whether a sauna arrives before summer reads this line, so
 * it has to be a sentence. Ranges use an en dash, which is what a range takes
 * and what most of the catalogue already used.
 *
 * A bare range with no unit is never guessed at — see BARE_RANGES. Anything
 * unrecognised is reported and left alone rather than mangled.
 *
 * Dry run by default. Add --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/normalise-lead-times.ts
 */
import { pathToFileURL } from "node:url";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

/**
 * Unit-less ranges, resolved by hand rather than by rule. Both values belong to
 * SaunaPlunge saunas whose siblings in the same range say "4-6 weeks", which is
 * where the unit comes from — not from an assumption that bare numbers mean
 * weeks. A bare range not listed here is left untouched and reported.
 */
const BARE_RANGES: Record<string, string> = { "4–6": "weeks" };

const UNIT = /\b(day|days|week|weeks|month|months)\b/i;

/** Trailing noise that turns the sentence into a fragment. */
const SUFFIX_NOISE: [RegExp, string][] = [
  // "4-6 weeks4" — a keystroke that landed after the unit.
  [/\b(day|days|week|weeks|month|months)\s*\d+$/i, "$1"],
  // "2-4 week dispatch" → the dispatch is what the lead time describes.
  [/\b(week|weeks|day|days|month|months)\s+dispatch$/i, "$1"],
  // "2-5 days shipping time" → same.
  [/\b(week|weeks|day|days|month|months)\s+shipping\s+time$/i, "$1"],
];

export function normaliseLeadTime(
  raw: string,
): { value: string } | { skip: string } {
  let out = raw.replace(/\s+/g, " ").trim();
  if (!out) return { skip: "empty" };

  for (const [pattern, replacement] of SUFFIX_NOISE)
    out = out.replace(pattern, replacement);

  // An en dash for the range, whichever dash was typed.
  out = out.replace(/(\d)\s*[-–—]\s*(\d)/g, "$1–$2");
  out = out.replace(/\s+/g, " ").trim();

  if (!UNIT.test(out)) {
    const unit = BARE_RANGES[out];
    if (!unit) return { skip: `no unit, and "${out}" is not a known range` };
    out = `${out} ${unit}`;
  }

  // Plural where the range demands it: "1–2 week" reads as a typo.
  out = out.replace(
    /\b(\d+–\d+)\s+(day|week|month)\b/i,
    (_m, range: string, unit: string) => `${range} ${unit.toLowerCase()}s`,
  );
  return { value: out };
}

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

async function main() {
  const client = makeClient();
  // Drafts included: several are unpublished copies of live products, and
  // publishing one would put the old spelling straight back on the site.
  const products = await client.fetch<
    { _id: string; title: string; deliveryLeadTime: string }[]
  >(
    `*[_type == "product" && defined(deliveryLeadTime)]{_id, title, deliveryLeadTime} | order(title asc)`,
  );

  const changes: { _id: string; title: string; from: string; to: string }[] =
    [];
  const skipped: { title: string; value: string; why: string }[] = [];

  for (const p of products) {
    const result = normaliseLeadTime(p.deliveryLeadTime);
    if ("skip" in result) {
      skipped.push({
        title: p.title,
        value: p.deliveryLeadTime,
        why: result.skip,
      });
      continue;
    }
    if (result.value === p.deliveryLeadTime) continue;
    changes.push({
      _id: p._id,
      title: p.title,
      from: p.deliveryLeadTime,
      to: result.value,
    });
  }

  const before = new Set(products.map((p) => p.deliveryLeadTime));
  const after = new Set(
    products.map((p) => {
      const r = normaliseLeadTime(p.deliveryLeadTime);
      return "skip" in r ? p.deliveryLeadTime : r.value;
    }),
  );

  console.log(
    `\n${products.length} product(s) with a lead time; ` +
      `${before.size} distinct value(s) → ${after.size}.\n`,
  );
  for (const c of changes) {
    console.log(`  ${JSON.stringify(c.from).padEnd(28)} → ${c.to}`);
    console.log(`    ${c.title.slice(0, 70)}`);
  }
  if (skipped.length) {
    console.log(`\n${skipped.length} left alone, needing a decision:`);
    for (const s of skipped)
      console.log(`  ${JSON.stringify(s.value)} — ${s.why}\n    ${s.title}`);
  }
  console.log("");

  if (!changes.length) {
    console.log("Nothing to do.\n");
    return;
  }
  if (!apply) {
    console.log("Dry run — nothing written. Re-run with --apply.\n");
    return;
  }

  for (const c of changes) {
    await client.patch(c._id).set({ deliveryLeadTime: c.to }).commit();
    console.log(`✓ ${c.to.padEnd(14)} ${c.title.slice(0, 60)}`);
  }
  console.log(`\nDone. ${changes.length} lead time(s) normalised.\n`);
}

const runDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (runDirectly) {
  void main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
