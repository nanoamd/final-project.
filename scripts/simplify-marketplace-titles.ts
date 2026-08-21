/**
 * Turns marketplace keyword-stuffed titles into Kaiku product names.
 *
 * Damien, looking at the lighting grid: "these aosom titles dont match the
 * website at all, they need to be simple, and unbranded just like every other
 * product and have | kaiku at the end".
 *
 * The contrast on that page makes the case on its own:
 *
 *   Led Wall Lamp 2 Pack, 9W Modern Indoor Geometric Mesh Wall Light, Colour
 *   Temperature Adjustable 3000K/4000K/6500K for Bedroom, Living Room,
 *   Hallway, Stairs, Gold Tone
 *
 *   Solenne Table Lamp with Edged Linen Shade | Kaiku
 *
 * **This overrides the standing "do not change product names" rule**, which
 * Damien set and has now directed otherwise for these specific titles. It is
 * scoped to the 105 that are keyword-stuffed; nothing else is touched.
 *
 * **Slugs are never changed.** A published URL that moves costs its search
 * ranking, and there is no reason to move one here — the name a shopper reads
 * and the address they arrive at are separate things.
 *
 * The specifics stripped from a title are not lost: sockets, wattage, colour
 * temperatures and "bulbs not included" belong in the specification table and
 * the FAQs, where somebody looking for them will actually find them.
 *
 *   pnpm tsx --env-file=.env.local scripts/simplify-marketplace-titles.ts
 *   pnpm tsx --env-file=.env.local scripts/simplify-marketplace-titles.ts --apply
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

/** A colour or finish worth keeping, because it distinguishes two variants. */
const FINISH =
  /^(?:black|white|grey|gray|silver|gold|brass|bronze|copper|chrome|cream|ivory|beige|taupe|brown|natural|oak|walnut|teak|green|blue|red|pink|charcoal|anthracite|rattan|wicker)(?:\s+tone)?$/i;

/** A pack size, which changes what you receive and so belongs in the name. */
const PACK = /\b(\d+)\s*(?:pack|pcs?|pieces?|piece set)\b/i;

/**
 * Clauses that exist purely for marketplace search and say nothing a shopper
 * browsing Kaiku needs in a product name.
 */
const NOISE_CLAUSE =
  /^(?:for\b|with built-in|bulbs? not included|easy to (?:assemble|clean)|ideal for|perfect for|suitable for|indoor|outdoor use)/i;

export function simplify(raw: string): string {
  const withoutSuffix = raw
    .replace(/\s*\|\s*Kaiku(?:\s+Tagline)?\s*$/i, "")
    .trim();
  // A thousands separator is not a clause boundary. Splitting naively turned
  // "50,000 BTU Gas Fire Pit Table" into "50".
  const protectedText = withoutSuffix.replace(/(\d),(\d{3})\b/g, "$1\u0000$2");
  const segments = protectedText
    .split(",")
    .map((s) => s.replace(/\u0000/g, ",").trim())
    .filter(Boolean);

  let core = segments[0] ?? withoutSuffix;

  // A trailing finish is the only thing that reliably separates two otherwise
  // identical listings, so it is carried across.
  const last = segments[segments.length - 1];
  const finish =
    segments.length > 1 && last && FINISH.test(last) ? last : undefined;

  // A pack size may sit in a later clause than the core.
  const packMatch = withoutSuffix.match(PACK);
  const hasPackInCore = PACK.test(core);

  // Strip a trailing marketplace clause that survived inside the first segment.
  core = core
    .replace(/\s+with built-in.*$/i, "")
    .replace(
      /\s+for (?:living room|bedroom|hallway|stairs|kitchen|garden|patio).*$/i,
      "",
    )
    .trim();

  // "Led Wall Lamp 2 Pack" reads better as "LED Wall Lamps, Set of 2".
  if (packMatch && hasPackInCore) {
    core = core
      .replace(PACK, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    core = `${core}, Set of ${packMatch[1]}`;
  } else if (packMatch && !hasPackInCore) {
    core = `${core}, Set of ${packMatch[1]}`;
  }

  // A long title with no commas at all — "8-Seater Garden Rattan Furniture
  // Rattan Corner Dining Sofa Set Wicker Conservatory Furniture Lawn Patio
  // Coffee Table Foot Stool w/Cushion-Black". Cut at the first natural
  // boundary past a readable length rather than mid-phrase.
  if (segments.length === 1 && core.length > 70) {
    const cut = core.slice(0, 70).lastIndexOf(" ");
    const head = cut > 24 ? core.slice(0, cut) : core.slice(0, 70);
    // Do not end on a joining word.
    core = head.replace(/\s+(?:with|and|for|w\/|the|a|in|of|to)$/i, "").trim();
  }

  // Common casing fixes so a name does not read as marketplace copy.
  core = core
    .replace(/\bLed\b/g, "LED")
    .replace(/\bUpf\b/gi, "UPF")
    .replace(/\bBtu\b/gi, "BTU")
    .replace(/\bKw\b/g, "kW")
    .replace(/\s{2,}/g, " ")
    .trim();

  const parts = [core];
  if (finish && !new RegExp(`\\b${finish}\\b`, "i").test(core))
    parts.push(finish.replace(/\s+tone$/i, ""));

  return `${parts.join(", ")} | Kaiku`;
}

async function main() {
  const rows: { _id: string; title?: string; slug?: string }[] =
    await client.fetch(
      `*[_type == "product"]{ _id, title, "slug": slug.current }`,
    );

  const changes: { id: string; before: string; after: string }[] = [];
  const flags: string[] = [];

  for (const row of rows) {
    const title = row.title ?? "";
    const bare = title.replace(/\s*\|\s*Kaiku\s*$/i, "");
    // Only the keyword-stuffed ones.
    if (bare.length <= 70 && (bare.match(/,/g) ?? []).length < 2) continue;

    const next = simplify(title);
    if (next === title) continue;

    const core = next.replace(/\s*\|\s*Kaiku\s*$/, "");
    if (core.length < 8) {
      flags.push(`too short after simplifying: "${title}" → "${next}"`);
      continue;
    }
    // "(m) Patio Gazebo" and "m Lean to Pergola" arrived broken: a dimension
    // lost its number somewhere upstream. Renaming would carry the breakage
    // forward under a tidier-looking name, so these need a human.
    if (/^\(?m\)?\s/i.test(core)) {
      flags.push(
        `starts with an orphaned unit, needs naming by hand: "${title.slice(0, 80)}"`,
      );
      continue;
    }
    changes.push({ id: row._id, before: title, after: next });
  }

  // ---- Disambiguate names that would collide --------------------------
  // Three LED wall lamps all reduce to "LED Wall Lamp, Set of 2, Gold",
  // because what separates them — Starry, Spiral, Geometric Mesh — lives in a
  // clause the simplifier discards. Rather than accept the collision or give
  // up, recover the distinguishing words from the original titles.
  const grouped = new Map<string, typeof changes>();
  for (const change of changes) {
    const list = grouped.get(change.after) ?? [];
    list.push(change);
    grouped.set(change.after, list);
  }

  for (const [, group] of grouped) {
    if (group.length < 2) continue;
    // Words that appear in one original but not in all of them.
    const wordSets = group.map(
      (c) =>
        new Set(
          c.before
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter((w) => w.length > 2),
        ),
    );
    group.forEach((change, index) => {
      const mine = wordSets[index]!;
      const others = wordSets.filter((_, i) => i !== index);
      const distinctive = [...mine]
        .filter((word) => others.every((set) => !set.has(word)))
        // "13W" and "5w" distinguish two lamps but do not name them. The
        // shape does: Starry, Spiral, Geometric Mesh.
        .filter((word) => !/^\d/.test(word) && !/^\d+[wk]$/i.test(word));
      if (!distinctive.length) return;
      // Prefer the descriptive word as it was capitalised in the original.
      const original = change.before;
      const picked = distinctive
        .slice(0, 2)
        .map((word) => {
          const match = original.match(new RegExp(`\\b${word}\\w*`, "i"));
          return match ? match[0] : word;
        })
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
      const core = change.after.replace(/\s*\|\s*Kaiku\s*$/, "");
      change.after = `${picked.join(" ")} ${core} | Kaiku`.replace(
        /\s{2,}/g,
        " ",
      );
    });
  }

  // Two products must not end up with the same name.
  const byName = new Map<string, string[]>();
  for (const change of changes) {
    const list = byName.get(change.after) ?? [];
    list.push(change.before);
    byName.set(change.after, list);
  }
  const collisions = [...byName].filter(([, list]) => list.length > 1);

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — marketplace titles\n`);
  console.log(`Titles to simplify: ${changes.length}`);
  console.log(
    `  published among them: ${changes.filter((c) => !c.id.startsWith("drafts.")).length}`,
  );
  console.log(`Flagged, not changed: ${flags.length}`);
  flags.forEach((f) => console.log(`  ${f}`));

  if (collisions.length) {
    console.log(
      `\n──── COLLISIONS: ${collisions.length} names would be shared ────`,
    );
    for (const [name, list] of collisions.slice(0, 10)) {
      console.log(`  "${name}"`);
      list.forEach((original) =>
        console.log(`      ← ${original.slice(0, 90)}`),
      );
    }
    console.log(
      `\nRefusing to apply: two products sharing a name is worse than a long one.`,
    );
  }

  console.log(`\n──── sample ────`);
  for (const change of changes.slice(0, 18)) {
    console.log(`  −  ${change.before.slice(0, 108)}`);
    console.log(`  +  ${change.after}`);
  }

  mkdirSync("docs/change-log", { recursive: true });
  const stamp = new Date().toISOString();
  writeFileSync(
    `docs/change-log/${stamp.slice(0, 10)}-titles.json`,
    JSON.stringify(
      { generatedAt: stamp, applied: apply, changes, flags },
      null,
      2,
    ),
  );

  if (!apply) {
    console.log("\nNothing written. Re-run with --apply.");
    return;
  }
  if (collisions.length) {
    console.error("\nNot applying while names would collide.");
    process.exit(1);
  }
  let done = 0;
  for (const change of changes) {
    // `title` only. The slug is deliberately untouched.
    await client.patch(change.id).set({ title: change.after }).commit();
    if (++done % 25 === 0) console.log(`  patched ${done}/${changes.length}`);
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
