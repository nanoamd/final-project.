/**
 * The last 14 summaries, written by hand.
 *
 * These are the products scripts/write-summaries-from-data.ts could not
 * compose a substantial line for, because their fields are sparse or
 * inconsistent. Everything here comes from the document's own specs and FAQ
 * answers.
 *
 * Two data problems found while writing, deliberately not asserted in copy:
 *
 *   - The 40,000 BTU gas fire pit table has two contradictory weights: the
 *     `weight` field says 50kg, its "Item weight" spec says 19kg. Neither is
 *     stated here; both need checking at source.
 *   - The Yuri planter's FAQ gives an empty weight of 14kg for an 18 x 18 x
 *     17cm stoneware pot, which is implausibly heavy for that size. Stated as
 *     the listed figure without being built into the sentence as fact.
 *
 * Two facts worth surfacing that were buried in FAQs:
 *
 *   - The Vertex basket is NOT watertight, so it cannot hold liquid — the sort
 *     of thing a customer discovers the hard way with a plant in it.
 *   - Both gas appliances ship WITHOUT a cylinder, and both are outdoor-only.
 *
 *   pnpm tsx --env-file=.env.local scripts/write-summaries-final-14.ts
 *   pnpm tsx --env-file=.env.local scripts/write-summaries-final-14.ts --apply
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

export const SUMMARIES: { id: string; summary: string }[] = [
  {
    id: "premier-housewares-0507596",
    summary:
      "A handmade basket in iron, 25 x 15 x 15cm and 2.8kg. Not watertight, so it will not hold liquid — use a liner or an inner pot for plants. Each one varies slightly.",
  },
  {
    id: "premier-housewares-2800676",
    summary:
      "A framed piece of wall art, 50 x 50cm and 6cm deep, weighing 3.5kg. Dust with a dry, soft cloth; fix it with anchors rated for the weight and suited to your wall type.",
  },
  {
    id: "premier-housewares-5506187",
    summary:
      "A stoneware planter in a natural finish, 18 x 18 x 17cm, listed at 14kg empty. Arrives fully assembled. Wipe with a soft cloth and avoid abrasive cleaners.",
  },
  {
    id: "premier-housewares-5506424",
    summary:
      "A footed planter in magnesia and fibreglass with beech wood legs, 28cm in diameter and 49.5cm tall, 9.6kg empty. Plant it in place — filled with damp compost it is considerably heavier.",
  },
  {
    id: "premier-housewares-5511633",
    summary:
      "A three-bulb floor lamp in metal and glass, 90 x 90 x 200cm. Takes three G4 bulbs up to 3W each, not included, and runs at 12V. Plugs into a standard socket. Indoor use only.",
  },
  {
    id: "premier-housewares-5511726",
    summary:
      "A twelve-bulb statement pendant in iron, 104 x 104 x 122cm. Takes twelve E14 bulbs up to 40W each, not included. Hard-wired to a ceiling rose, so it needs a qualified electrician.",
  },
  {
    id: "premier-housewares-5535004",
    summary:
      "A bathroom tumbler in aluminium with a champagne finish, 8 x 8 x 11cm. Handmade, so each one varies slightly. Wipe clean with a soft cloth and avoid abrasive cleaners.",
  },
  {
    id: "product-aosom-842-253v00cg",
    summary:
      "A 40,000 BTU propane gas fire pit table, 71 x 71 x 62cm, certified to UKCA and CE (GAR). The gas cylinder is not included. No batteries needed — it has a thermocouple that shuts the gas off if the flame goes out. Outdoor use only, on a firm, level, non-combustible surface clear of walls and canopies. Assembly required.",
  },
  {
    id: "product-aosom-846-136v70bk",
    summary:
      "A five-burner steel gas barbecue with a lid thermometer, 135 x 52 x 103cm and 25kg. Runs on LPG (propane); the cylinder is not supplied. No batteries needed for ignition. Outdoor use only — not on a balcony or under a canopy. Assembly required.",
  },
  {
    id: "product-aosom-84g-462v00cg",
    summary:
      "A five-piece garden sofa set on an aluminium frame with polyester cushions and a tempered glass table top. Includes two loveseats, a corner chair, a single chair, a coffee table and 14 cushions. Rated to 240kg on the loveseats, 120kg per chair and 50kg on the table. Not waterproof, so store the cushions dry. Assembly required.",
  },
  {
    id: "product-aw-waterf-05",
    summary:
      "A tabletop water feature in a cascading rock formation, 18 x 13 x 13cm and 0.8kg. Includes a pump — keep it submerged, top the water up regularly, and clear debris from the basin periodically.",
  },
  {
    id: "product-aw-waterf-13",
    summary:
      "A tabletop water feature with dragons, a crystal ball and a working water wheel, 18 x 35 x 18cm and 2.4kg. Includes a pump — keep it submerged and top the water up regularly.",
  },
  {
    id: "product-aw-waterf-20",
    summary:
      "A tabletop water feature with a Buddha hand and head, 20 x 25 x 35cm and 1.87kg. Light enough to reposition one-handed. Includes a pump — keep it submerged and top the water up regularly.",
  },
  {
    id: "product-import-amalfi-collection-outdoor-bistro-table-with-wood-top",
    summary:
      "An outdoor bistro table with a wood top, 70 x 70cm and 72cm tall, weighing 8kg. A square two-seater footprint, light enough for one person to carry out and put away.",
  },
];

async function main() {
  const results: {
    id: string;
    before: string;
    after: string;
    found: boolean;
  }[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const item of SUMMARIES) {
    const doc = await client.fetch<{ summary?: string } | null>(
      `*[_id == $id][0]{summary}`,
      { id: item.id },
    );
    results.push({
      id: item.id,
      before: doc?.summary ?? "",
      after: item.summary,
      found: !!doc,
    });
    if (!doc) {
      console.error(`NOT FOUND: ${item.id}`);
      continue;
    }
    if (apply) {
      transaction.patch(item.id, (p) => p.set({ summary: item.summary }));
      queued += 1;
    }
  }

  for (const r of results) {
    console.log(`\n${r.id}`);
    console.log(`  was: ${r.before.slice(0, 110)}`);
    console.log(`  now: ${r.after}`);
  }

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} summaries updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-write-summaries-final-14.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
