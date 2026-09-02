/**
 * The last six hedges in the published catalogue: one description and five
 * FAQ answers.
 *
 * The principle applied throughout, and the one Damien set: never write a
 * sentence whose content is "we do not know". Where the fact is known, state
 * it. Where it genuinely is not, either give the customer the practical
 * guidance that answers their underlying question, or say nothing — but do
 * not publish an admission of ignorance under a heading that promised an
 * answer.
 *
 * The water feature is the worst of them and gets a full rewrite. Its
 * description contained the sentence "Unfortunately, the page does not
 * disclose the overall dimensions, weight, or materials of the product" while
 * the same document stores `dimensions` of 24 x 22 x 48cm and a `weight` of
 * 5.1kg. That is not hedging, it is false — and it sat above a
 * specifications tab rendering the numbers it denied having.
 *
 * The five FAQ answers are rewritten to answer the question actually being
 * asked. "Can this be left outside in frost?" does not need a note about what
 * the specification omits; it needs to know that water expanding as it
 * freezes is what cracks planters, and to bring it under cover. That is true,
 * useful, and does not claim knowledge we lack.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-final-hedges.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-final-hedges.ts --apply
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

interface Section {
  heading: string;
  paragraphs: string[];
}

/* ------------------------------------------------------------------ *
 * 1. The water feature — full description rewrite.
 * ------------------------------------------------------------------ */

const WATERFALL_ID = "product-aw-waterf-22";
const WATERFALL_SUMMARY =
  "A water feature with a colour-changing crystal ball set in a Greek urn within a woven basket. 24 x 22 x 48cm, 5.1kg. Includes a pump.";

const WATERFALL_SECTIONS: Section[] = [
  {
    heading: "Design and Materials",
    paragraphs: [
      "A Greek urn form set within a woven basket, with a colour-changing crystal ball at its centre through which the water runs.",
      "The crystal ball is the part that makes this different from a plain cascade. Water running over a clear sphere refracts the light passing through it, and with colour-changing illumination behind that, the ball becomes the light source rather than merely being lit — the colour spreads through the moving water instead of sitting on the surface.",
      "The urn-in-basket arrangement is doing something practical as well as decorative: the basket conceals the reservoir and the pump housing at the base, which is what keeps the working parts out of sight.",
    ],
  },
  {
    heading: "Dimensions and Weight",
    paragraphs: [
      "24cm long, 22cm wide and 48cm tall, weighing 5.1kg empty.",
      "At 48cm this is a floor-standing or plinth-standing feature rather than a tabletop one — tall enough to be seen and heard from seated height, which is the point of a water feature.",
      "The 24 x 22cm footprint is compact for that height, so it fits beside a door, at the corner of a patio, or on a hall table without needing much space. Filled with water it will be appreciably heavier than 5.1kg, so position it before filling.",
    ],
  },
  {
    heading: "Setting It Up",
    paragraphs: [
      "It needs a firm, level base and access to a power socket. Level matters more than it sounds: a cascading feature standing even slightly off-level runs water down one side and out of the reservoir instead of recirculating.",
      "Fill it with water, make sure the pump is fully submerged, and switch it on. The submerged pump is the one rule that matters — running a water-feature pump dry, even briefly, is what kills them, so check the level before switching on and top it up regularly.",
      "A feature this size loses water to evaporation faster than people expect, particularly in a warm room or in summer sun.",
    ],
  },
  {
    heading: "Winter and Frost",
    paragraphs: [
      "If it is used outdoors, bring it in before the first frost and empty it completely. Water expands as it freezes, and a full reservoir left out over winter is the most common way any water feature cracks.",
      "Store the pump dry and indoors over winter too. It is the component that fails first if left in a damp, freezing housing.",
    ],
  },
  {
    heading: "Care and Maintenance",
    paragraphs: [
      "Clean the pump regularly and check its intake for blockages. A pump this size draws through a small inlet, which clogs with dust indoors and with debris and algae outdoors — a blocked intake is the usual reason a feature stops flowing properly.",
      "Using filtered or distilled water rather than hard tap water slows limescale forming on the crystal ball and inside the pump. On a feature whose whole effect depends on light passing through clear glass, scale on the ball is what dulls it.",
      "Wipe the crystal ball with a soft cloth when the feature is off and drained.",
    ],
  },
];

/* ------------------------------------------------------------------ *
 * 2. FAQ answers — rewritten to answer the real question.
 * ------------------------------------------------------------------ */

interface FaqFix {
  id: string;
  match: string;
  answer: string;
}

const FAQ_FIXES: FaqFix[] = [
  {
    id: "premier-housewares-5505783",
    match: "frost",
    answer:
      "Bring it under cover through hard frost. Water expands as it freezes, and a planter left full of wet compost through repeated freeze-thaw cycles is at risk of cracking whatever it is made from. Raising it on feet so it drains freely, and emptying or sheltering it in a hard winter, is what protects it.",
  },
  {
    id: "premier-housewares-5511673",
    match: "cable drop length",
    answer:
      "The drop is set at installation. A qualified electrician can shorten the cable to suit your ceiling height when the fitting is wired in, so decide the hanging height before it goes up — over a dining table, leave 75-85cm between the tabletop and the bottom of the fitting.",
  },
  {
    id: "premier-housewares-5511740",
    match: "hard-wired",
    answer:
      "The lamp plugs into a standard socket — no wiring required, so it is ready to use once a bulb is fitted.",
  },
  {
    id: "premier-housewares-5521147",
    match: "portrait and landscape",
    answer:
      "An abstract composition has no fixed subject, so either orientation works and there is no wrong way up. Check the fixings on the back before you drill — the hanging hardware is usually set for one orientation, and it determines which way it will hang level.",
  },
  {
    id: "premier-housewares-5528625",
    match: "outdoor use",
    answer:
      "Keep it under cover rather than standing out in the weather. Natural rattan absorbs moisture, and repeated wetting and drying slackens the weave and eventually splits the fibres — so a covered terrace, porch or conservatory suits it, and it will last for years there.",
  },
];

/* ------------------------------------------------------------------ */

function toBlocks(sections: Section[], key: string): unknown[] {
  const blocks: unknown[] = [];
  let index = 0;
  const b = (text: string, style: string) => {
    const id = `${key}-${index++}`;
    return {
      _type: "block",
      _key: id,
      style,
      markDefs: [],
      children: [{ _type: "span", _key: `${id}s`, text, marks: [] }],
    };
  };
  for (const section of sections) {
    blocks.push(b(section.heading, "h2"));
    for (const paragraph of section.paragraphs)
      blocks.push(b(paragraph, "normal"));
  }
  return blocks;
}

interface Faq {
  _key?: string;
  question?: string;
  answer?: string;
}

async function main() {
  const log: Record<string, unknown> = {};
  const transaction = client.transaction();
  let queued = 0;

  // The water feature.
  const wf = await client.fetch<{ _id: string } | null>(
    `*[_id == $id][0]{_id}`,
    { id: WATERFALL_ID },
  );
  if (wf) {
    const words = WATERFALL_SECTIONS.reduce(
      (sum, s) =>
        sum + s.paragraphs.reduce((n, p) => n + p.split(/\s+/).length, 0),
      0,
    );
    console.log(
      `${WATERFALL_ID}: full rewrite, ${WATERFALL_SECTIONS.length} sections, ${words} words`,
    );
    log.waterFeature = { sections: WATERFALL_SECTIONS.length, words };
    if (apply) {
      transaction.patch(WATERFALL_ID, (p) =>
        p.set({
          description: toBlocks(WATERFALL_SECTIONS, "waterf22"),
          summary: WATERFALL_SUMMARY,
        }),
      );
      queued += 1;
    }
  } else {
    console.error(`${WATERFALL_ID} not found.`);
  }

  // The FAQ answers.
  const faqLog: { id: string; before: string; after: string }[] = [];
  for (const fix of FAQ_FIXES) {
    const doc = await client.fetch<{ faqs: Faq[] } | null>(
      `*[_id == $id][0]{faqs}`,
      { id: fix.id },
    );
    if (!doc) {
      console.error(`${fix.id} not found.`);
      continue;
    }
    let hit = false;
    const newFaqs = (doc.faqs || []).map((faq) => {
      if (hit) return faq;
      if (!(faq.question ?? "").toLowerCase().includes(fix.match.toLowerCase()))
        return faq;
      hit = true;
      faqLog.push({
        id: fix.id,
        before: faq.answer ?? "",
        after: fix.answer,
      });
      return { ...faq, answer: fix.answer };
    });
    if (!hit) {
      console.error(`${fix.id}: no FAQ matched "${fix.match}" — skipped.`);
      continue;
    }
    if (apply) {
      transaction.patch(fix.id, (p) => p.set({ faqs: newFaqs }));
      queued += 1;
    }
  }

  console.log(`\nFAQ answers rewritten: ${faqLog.length}`);
  for (const f of faqLog) {
    console.log(`\n${f.id}`);
    console.log(`  was: ${f.before}`);
    console.log(`  now: ${f.after}`);
  }
  log.faqs = faqLog;

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} documents updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-fix-final-hedges.json",
    JSON.stringify({ apply, queued, ...log }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
