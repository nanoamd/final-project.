/**
 * The five products left with two or three FAQs.
 *
 * Two of them — the Buddha Hand & Head water feature and the Amalfi bistro
 * table — had an identical pair ("What are the exact dimensions?", "How heavy
 * is it, and can I move it on my own?"), which is what made them show up as a
 * shared FAQ set in the contamination audit alongside the genuine Capri/Contour
 * swap. Not contamination: a stub pair applied to both, answering nothing a
 * shopper actually asks.
 *
 * Written from each product's own dimensions, weight, materials and description.
 * Existing questions are kept where they were real; the new ones are added.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-thin-faq-sets.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-thin-faq-sets.ts --apply
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

const SETS: { id: string; faqs: [q: string, a: string][] }[] = [
  {
    id: "product-aw-waterf-20",
    faqs: [
      [
        "What are the dimensions and weight?",
        "20 x 25 x 35cm and 1.87kg — light enough to reposition one-handed.",
      ],
      [
        "Is a pump included?",
        "Yes. Keep it fully submerged whenever it is running; a pump run dry is the usual way one of these fails.",
      ],
      [
        "How often do I need to top the water up?",
        "Every few days in warm weather. Evaporation is faster than people expect, and once the level drops below the pump inlet the pump is running dry.",
      ],
      [
        "Can it go outside?",
        "Yes, on a firm level surface. The pump plugs into a standard socket, so use an outdoor-rated socket on an RCD if it is going out.",
      ],
      [
        "What do I do with it in winter?",
        "Drain it, take the pump out, dry it and store it indoors. Water left in the basin freezes, and the expanding ice cracks it.",
      ],
      [
        "How do I clean it?",
        "Clear debris out of the basin as it collects and rinse the pump every few weeks so the inlet does not clog.",
      ],
    ],
  },
  {
    id: "product-import-amalfi-collection-outdoor-bistro-table-with-wood-top",
    faqs: [
      [
        "What are the dimensions and weight?",
        "70 x 70cm and 72cm tall, weighing 8kg — a square two-seater footprint at standard dining height.",
      ],
      [
        "How many people does it seat?",
        "Two comfortably. Allow about 60cm of table edge per person and 90cm of clear space behind each chair to stand up and walk past.",
      ],
      [
        "Can I move it on my own?",
        "Yes. At 8kg one person can carry it out in the morning and put it away in the evening, which is the point of a table this size.",
      ],
      [
        "Can it stay outside all year?",
        "The frame is made for outdoor use. It will last considerably longer under cover through winter and long wet spells, and any cushions should be stored dry.",
      ],
      [
        "How do I look after the wood top?",
        "Wipe it down with mild soap and water and let it dry. Avoid abrasive cleaners, and stand hot pans on a mat rather than directly on the timber.",
      ],
      [
        "Does it need assembling?",
        "Yes. Check the carton dimensions on this page against your access before delivery.",
      ],
    ],
  },
  {
    id: "product-aw-waterf-09",
    faqs: [
      [
        "Is a pump included?",
        "Yes. It must stay fully submerged whenever the feature is running.",
      ],
      [
        "How often do I top the water up?",
        "Check the level every few days in warm weather and top it up before it drops to the pump inlet.",
      ],
      [
        "Can it go outside?",
        "Yes, on a firm level surface. Use an outdoor-rated socket on an RCD if the pump is plugged in outdoors.",
      ],
      [
        "What do I do with it over winter?",
        "Drain it, remove the pump, dry it and store it indoors. Standing water freezes and cracks the basin.",
      ],
      [
        "How do I keep it clean?",
        "Clear leaves and grit out of the basin as they collect, and rinse the pump every few weeks.",
      ],
    ],
  },
  {
    id: "premier-housewares-2450049",
    faqs: [
      [
        "What are the dimensions?",
        "130cm wide, 120cm deep and 205cm tall — a double-width seat on a full-height frame, so it needs real floor space and headroom.",
      ],
      [
        "How many people does it seat?",
        "Two. It is a double hanging chair rather than a single, which is what the 130cm width is for.",
      ],
      [
        "What is it made from?",
        "PE rattan over an iron frame, with polyester cushions.",
      ],
      [
        "Can it go outside?",
        "Yes. PE rattan and the iron frame are made for outdoor use; bring the polyester cushions in or store them dry when it is not in use.",
      ],
      [
        "Do I need to hang it from anything?",
        "No. It comes on its own freestanding frame, so it needs no ceiling or beam fixing — just a firm, level surface with clearance to swing.",
      ],
      [
        "How much clearance does it need?",
        "Allow room to swing without touching a wall or a fence, and 205cm of height above the ground it stands on.",
      ],
      [
        "How do I clean it?",
        "Mild soap and water on a soft cloth for the weave. Avoid abrasive cleaners, and let the cushions dry fully before storing them.",
      ],
      [
        "Are cushions included?",
        "Yes, grey cushions are supplied with the chair.",
      ],
    ],
  },
  {
    id: "premier-housewares-5528057",
    faqs: [
      [
        "What are the dimensions?",
        "Each table is 60 x 60cm and 49cm tall. They ship together in one carton.",
      ],
      [
        "Do the two tables nest or stand separately?",
        "They are a set of two and work either way: together as a pair beside a chair, or separated to serve two seats.",
      ],
      [
        "How do I clean natural rattan?",
        "Dust it or vacuum it with a brush attachment rather than washing it. Soaking the weave is what loosens it over time.",
      ],
      [
        "Can they go outside?",
        "Natural rattan is an indoor material. It will take a covered porch or conservatory, but sustained damp will loosen the weave.",
      ],
    ],
  },
];

async function main() {
  const results: Record<string, unknown>[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const item of SETS) {
    const doc = await client.fetch<{
      title: string;
      faqs?: { question?: string }[];
    } | null>(`*[_id == $id][0]{title,faqs}`, { id: item.id });
    if (!doc) {
      console.error(`NOT FOUND: ${item.id}`);
      continue;
    }
    const faqs = item.faqs.map(([question, answer], i) => ({
      _key: `f${i}`,
      _type: "faqEntry",
      question,
      answer,
    }));
    results.push({
      id: item.id,
      title: doc.title,
      was: doc.faqs?.length ?? 0,
      now: faqs.length,
      wasQuestions: doc.faqs?.map((f) => f.question),
    });
    if (apply) {
      transaction.patch(item.id, (p) => p.set({ faqs }));
      queued += 1;
    }
  }

  for (const r of results) console.log(JSON.stringify(r).slice(0, 220));
  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} documents patched.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-fix-thin-faq-sets.json",
    JSON.stringify({ apply, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
