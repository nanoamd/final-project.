/**
 * Three published summaries that hedged in the customer's face.
 *
 * The summary sits above the description on the product page, so it is the
 * first thing read — and these three ended on the admission rather than the
 * fact:
 *
 *   "While specific assembly details and additional items like cushions and
 *    covers are not listed, this coffee table is ready to enhance your garden
 *    decor."
 *
 * Every replacement below is built only from that product's own recorded
 * facts (`dimensions`, `specs`, and the plain statements in its existing
 * description), in the house voice: plain, contracted, each fact carrying its
 * consequence, no superlatives.
 *
 * Note on the third one — the solar lamp post: its summary was flagged for
 * "as no electrical contracting is required", which was a FALSE POSITIVE in
 * `GUESSES_FROM_ABSENCE` (a positive selling point, not reasoning from an
 * absence). That pattern is now fixed in `admissions.ts` with a regression
 * test. Its summary is rewritten anyway, because it was still marketing fluff
 * ("Enjoy hassle-free installation", "benefit from…").
 *
 * Also worth recording, found while reading these: the same lamp post has
 * `weight.value` of 0.185 kg while its own specs say 1.6 kg. 0.185 kg is
 * impossible for a 160 cm post, so the weight field is wrong. Left alone here
 * rather than guessed at — it needs the supplier's real figure, and this
 * script is about copy.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-hedging-summaries.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-hedging-summaries.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { isAdmission, sentencesOf } from "@/lib/catalog/admissions";

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

const SUMMARIES: { id: string; title: string; summary: string }[] = [
  {
    id: "premier-housewares-2406731",
    title: "Mataram Natural Rattan Rectangular Coffee Table",
    // Facts: dimensions 80 x 50 x 45cm; specs Material Rattan; 1 carton,
    // cart weight 4.5kg; description states assembly required and that no
    // cushions or cover are included, and to keep it out of wet weather.
    summary:
      "A rectangular coffee table woven from natural rattan, 80 × 50 × 45cm (W×D×H). It needs assembling when it arrives and ships in one carton. No cushions or cover are included. Rattan doesn't take sustained damp well, so we'd keep it somewhere sheltered and bring it in over winter.",
  },
  {
    id: "premier-housewares-5528057",
    title: "Batu Set Of 2 Natural Rattan Side Tables",
    // Facts: dimensions 60 x 60 x 49cm; specs Materials "Rattan, Metal",
    // 1 carton, cart weight 8.5kg; description states handwoven rattan on a
    // black metal cross frame, assembly required, keep dry when not in use.
    summary:
      "A pair of side tables with handwoven natural rattan tops on black metal cross frames, each 60 × 60 × 49cm (W×D×H). They need assembling and ship together in one carton. Rattan doesn't take sustained damp well, so these are best in a sheltered spot and brought in over winter.",
  },
  {
    id: "product-aosom-b30-068v00bk",
    title: "Solar Lamp Post Light with Planter, Black",
    // Facts from specs: 33L x 33W x 160H cm; ABS/aluminium; 50 lumen; 3200K
    // warm; planter 33 x 33 x 28.5cm; IP44; CE/RoHS; lithium battery, 4.5V;
    // description states dusk-to-dawn sensor and no electrical work needed.
    summary:
      "A 160cm solar lamp post in black ABS and aluminium, with a 33cm square planter built into the base. One warm LED puts out 50 lumens at 3200K, and a dusk-to-dawn sensor turns it on at sunset and off again at sunrise. There's no wiring to run, so it only needs a spot that gets enough sun to charge. Rated IP44 for outdoor use.",
  },
];

async function main() {
  const results: {
    id: string;
    title: string;
    before: string | null;
    after: string;
    stillHedges: boolean;
  }[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const entry of SUMMARIES) {
    const doc = await client.fetch<{ summary: string | null } | null>(
      `*[_id == $id][0]{summary}`,
      { id: entry.id },
    );
    if (!doc) {
      console.error(`NOT FOUND: ${entry.id}`);
      continue;
    }

    // Refuse to write a replacement that trips the same detector.
    const stillHedges = sentencesOf(entry.summary).some(isAdmission);
    results.push({
      id: entry.id,
      title: entry.title,
      before: doc.summary,
      after: entry.summary,
      stillHedges,
    });
    if (stillHedges) {
      console.error(
        `REFUSING ${entry.id} — replacement still reads as a hedge.`,
      );
      continue;
    }
    if (apply) {
      transaction.patch(entry.id, (p) => p.set({ summary: entry.summary }));
      queued += 1;
    }
  }

  for (const r of results) {
    console.log(`\n=== ${r.id} — ${r.title} ===`);
    console.log(`  before: ${r.before}`);
    console.log(`  after:  ${r.after}`);
    console.log(`  clean:  ${!r.stillHedges}`);
  }

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} summaries updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-01-fix-hedging-summaries.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
