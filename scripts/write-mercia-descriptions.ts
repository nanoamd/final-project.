/**
 * Descriptions and FAQs for the three Mercia outdoor kitchen products.
 *
 * Damien: "you can write the descriptions and faqs??" — yes, and this matches
 * the register of the originals recovered from history rather than the short
 * spec summaries I wrongly replaced them with. That voice, from the Himalayan
 * Salt BBQ Plate:
 *
 *   [h3] Designed for Authentic Outdoor Cooking
 *   [normal] Elevate your outdoor cooking experience with the Himalayan Salt BBQ
 *            Cooking Plate, a premium natural cooking surface crafted from
 *            genuine Himalayan rock salt...
 *
 * So: `h3` headings that are benefit-led rather than field names, second person,
 * short stacked paragraphs, and facts woven into the prose instead of listed
 * beside it. Long — these are £800–£1,100 considered purchases and the page has
 * to do the work a showroom would.
 *
 * Every fact comes from Mercia's own product pages. Where something is not
 * published — the Ultimate Trent's exact dimensions — the copy says what it does
 * know and does not invent a number. There is deliberately no Delivery &
 * Returns section: that is what put stale £2.79–£14.50 carriage on 200+ pages,
 * and the buy box renders the real terms already.
 *
 *   pnpm tsx --env-file=.env.local scripts/write-mercia-descriptions.ts
 *   pnpm tsx --env-file=.env.local scripts/write-mercia-descriptions.ts --apply
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

/** A section: a benefit-led heading and the paragraphs beneath it. */
type Section = [heading: string, ...paragraphs: string[]];

interface Copy {
  id: string;
  sections: Section[];
  faqs: [question: string, answer: string][];
}

const COPY: Copy[] = [
  {
    id: "mercia-trent-outdoor-kitchen",
    sections: [
      [
        "Built for Cooking Outdoors Properly",
        "The Trent Outdoor Kitchen turns a patio into somewhere you can actually cook, rather than somewhere you carry a plate to and from the house. Built as a corner run in pressure-treated European softwood with a stainless steel worktop made to fit its contours, it gives you preparation space, storage and a permanent home for the barbecue in one piece.",
        "It is the difference between grilling and cooking. There is room to lay out raw food on one side and finished plates on the other, somewhere to keep the tongs, and a surface you can wipe down when you are done — the three things a barbecue on its own never has.",
      ],
      [
        "A Stainless Steel Top, Made to Measure",
        "The worktop is custom-made stainless steel, cut to follow the contours of the kitchen rather than dropped on as a flat rectangle. That matters more than it sounds: it means no awkward gaps at the corner where crumbs and rainwater collect, and it means the whole run reads as one surface.",
        "Stainless steel is the right choice outdoors for the same reason it is in professional kitchens. It wipes clean in seconds, it does not stain from marinade or wine, and it will not soften or split the way a timber worktop does after a few British winters.",
      ],
      [
        "Storage Where You Need It, Not Where It Fits",
        "The layout is thought through rather than generic. A double cupboard takes charcoal and logs — the bulky, dirty things you want out of sight and out of the rain. A single cupboard holds condiments and glasses at hand height. A corner shelving unit takes crockery and utensils, and an additional shelving unit holds tools and the cooking essentials you reach for mid-cook.",
        "The result is that everything for an evening's cooking lives outside with the kitchen. No trips indoors for a serving dish, no bag of charcoal going soft in a shed.",
      ],
      [
        "A Wind-Guard Trim That Earns Its Place",
        "A trim runs around the rear perimeter, which is a small detail that changes how usable the kitchen is on an ordinary British evening. It shelters the working surface from the wind that would otherwise scatter herbs, lift napkins and blow heat sideways off a grill.",
      ],
      [
        "Pressure-Treated Timber and a Fifteen-Year Guarantee",
        "The timber is sustainably sourced, slow-grown European softwood. Slow-grown matters: tighter growth rings mean a denser, more stable board that resists twisting and splitting far better than fast-grown timber.",
        "It arrives pressure treated, with preservative driven into the wood under pressure rather than brushed onto the surface, and carries a fifteen-year anti-rot guarantee. Mercia recommend an annual treatment to keep that guarantee alive — one afternoon a year with a brush, which is a fair trade for fifteen years of cover.",
      ],
      [
        "Modular, So It Can Grow With You",
        "The Trent is designed as a modular system. Individual matching units can be added later, so the kitchen you buy now is a starting point rather than a fixed decision — useful if you are not yet sure how much of the patio you want to give over to it, or if a pizza oven is on the list for next year.",
      ],
      [
        "Dimensions and Planning the Space",
        "The kitchen measures 201cm wide by 204cm deep, standing 84cm tall. Being a corner unit, both of those figures are the outside edges of the L rather than a single run — worth marking out on the paving with chalk or tape before you commit, because a corner piece occupies a space differently from a straight one.",
        "At 84cm the worktop sits just below a standard indoor kitchen counter, which most people find comfortable for outdoor work where you are standing over heat and reaching across.",
      ],
      [
        "Assembly and Everyday Care",
        "It is supplied as a DIY kit for self-assembly. Allow proper time and a second pair of hands for the larger panels — this is a substantial piece of timber furniture, not a flat-pack side table.",
        "In use it asks very little: wipe the stainless steel down after cooking, keep the cupboards closed when it rains, and give the timber its annual treatment. Left to look after itself it will still last; treated once a year, it stays looking like the day it went in.",
      ],
    ],
    faqs: [
      [
        "What are the dimensions of the Trent Outdoor Kitchen?",
        "201cm wide by 204cm deep, standing 84cm tall. It is a corner unit, so both those figures are the outer edges of the L rather than one straight run — mark it out on the ground before ordering.",
      ],
      [
        "What is the worktop made from?",
        "Custom-made stainless steel, cut to follow the contours of the kitchen rather than sitting on top as a flat rectangle. It wipes clean, will not stain from marinade or wine, and does not weather the way a timber top does.",
      ],
      [
        "How much storage is there?",
        "Four separate areas: a double cupboard for charcoal and logs, a single cupboard for condiments and glasses, a corner shelving unit for crockery and utensils, and an additional shelving unit for tools and cooking essentials.",
      ],
      [
        "Is the timber treated, and what does the guarantee cover?",
        "It is pressure treated — preservative driven into the wood under pressure rather than brushed on — and carries a fifteen-year anti-rot guarantee. Mercia recommend treating it annually to keep that cover in place.",
      ],
      [
        "Can I add to it later?",
        "Yes. The Trent is a modular system and individual matching units can be added, so you can start with this configuration and extend it.",
      ],
      [
        "Does it come assembled?",
        "No, it is supplied as a DIY kit. Allow a good block of time and a second pair of hands for the larger panels.",
      ],
      [
        "How high is the worktop compared with an indoor kitchen?",
        "84cm, which is a little below a standard indoor counter. Most people find that comfortable outdoors, where you are standing over heat and reaching across the surface.",
      ],
      [
        "What is the wind-guard trim for?",
        "It runs around the rear perimeter and shelters the working surface from wind — the difference between herbs staying on the board and ending up across the patio.",
      ],
      [
        "How do I look after it?",
        "Wipe the stainless steel after cooking, keep the cupboards shut in the rain, and treat the timber once a year. The annual treatment is also what keeps the fifteen-year guarantee valid.",
      ],
    ],
  },
  {
    id: "mercia-ultimate-trent-outdoor-kitchen",
    sections: [
      [
        "The Outdoor Kitchen Without the Compromise",
        "The Ultimate Trent is the full version of Mercia's outdoor kitchen — a longer run of worktop and more storage than the standard Trent, in the same pressure-treated European softwood with the same custom stainless steel top.",
        "If you cook outdoors for more than two people, this is the one that stops the space running out. The extra length is where the difference is felt: room for the barbecue and a preparation area and somewhere to put finished food down, all at once, without moving anything.",
      ],
      [
        "Custom Stainless Steel, Cut to the Contours",
        "The worktop is made to fit rather than supplied as a flat sheet, following the shape of the kitchen so the corner reads as one continuous surface with no gaps to trap crumbs or standing water.",
        "It is the correct material for the job. Stainless steel wipes down in seconds, shrugs off marinade, wine and citrus, and will not split or soften after a few winters outdoors the way a timber worktop will.",
      ],
      [
        "Storage for the Way People Actually Cook",
        "A double cupboard takes charcoal and logs, keeping the bulky and the dirty out of the weather. A single cupboard puts condiments and glasses at hand height. A corner shelving unit holds crockery and utensils, and a further shelving unit takes tools and cooking essentials.",
        "Everything an evening needs lives outside with the kitchen, which is the whole point — no trips indoors mid-cook, and no bag of charcoal going damp in a shed.",
      ],
      [
        "Built for British Weather",
        "The timber is sustainably sourced, slow-grown European softwood. Slow growth means tighter rings, and tighter rings mean a denser board that resists twisting and splitting.",
        "It comes pressure treated, with preservative forced into the wood rather than painted on, and carries a fifteen-year anti-rot guarantee with annual treatment recommended. A wind-guard trim runs around the rear perimeter to shelter the working surface.",
      ],
      [
        "Still Modular",
        "Even at this size the Ultimate Trent remains a modular system, so individual matching units can be added later. Buying the larger configuration now does not close off extending it further.",
      ],
      [
        "Assembly, or Someone Else's Afternoon",
        "It is supplied as a DIY kit, and professional installation is available if you would rather not spend the day on it. Given the size, that option is worth pricing — this is a large amount of timber and the panels are not a one-person job.",
      ],
      [
        "Care and What the Guarantee Asks",
        "Wipe the steel after cooking, keep the cupboards closed in the rain, and treat the timber once a year. That annual treatment is not just cosmetic: it is the condition on which the fifteen-year anti-rot guarantee rests.",
      ],
    ],
    faqs: [
      [
        "How is the Ultimate Trent different from the standard Trent?",
        "It is the larger configuration — a longer run of worktop and more storage — in the same pressure-treated softwood with the same custom stainless steel top. The difference is usable space rather than specification.",
      ],
      [
        "What are the exact dimensions?",
        "Mercia publish a downloadable technical specification for this model rather than listing the figures on the page. Ask us before ordering and we will confirm them, because a corner run of this size wants marking out on the ground first.",
      ],
      [
        "What is the worktop made from?",
        "Custom-made stainless steel, cut to the contours of the kitchen so the corner is one continuous surface with no gaps.",
      ],
      [
        "How much storage does it have?",
        "A double cupboard for charcoal and logs, a single cupboard for condiments and glasses, a corner shelving unit for crockery and utensils, and a further shelving unit for tools and essentials.",
      ],
      [
        "Is it treated, and what is the guarantee?",
        "Pressure treated, with preservative driven into the timber under pressure, and a fifteen-year anti-rot guarantee. Annual treatment is recommended and is the condition of the cover.",
      ],
      [
        "Can I have it installed?",
        "Yes. It is supplied as a DIY kit, and professional installation is available. At this size it is worth pricing that up.",
      ],
      [
        "Can I extend it later?",
        "Yes, it stays a modular system — individual matching units can be added even to the larger configuration.",
      ],
      [
        "What does the wind-guard trim do?",
        "It runs around the rear perimeter and shelters the working surface from wind, which on an ordinary British evening is the difference between a usable kitchen and a frustrating one.",
      ],
    ],
  },
  {
    id: "mercia-pressure-treated-bbq-table",
    sections: [
      [
        "The Surface Every Barbecue Is Missing",
        "A barbecue on its own gives you heat and nowhere to work. The Pressure Treated BBQ Table is the answer to that — a large central tabletop with two open shelves beneath it and two fold-up side panels, built in pressure-treated timber to live outdoors permanently.",
        "It is the piece that turns cooking outside from a relay to and from the kitchen into something you can actually stand and do. Raw on one side, cooked on the other, tools within reach, and a surface that does not mind being wiped down.",
      ],
      [
        "Two Fold-Up Wings, for When You Need Them",
        "The two side panels fold up when you are cooking and drop down when you are not. That is the detail that makes it work on a normal patio: full preparation space during the cook, and a compact footprint the rest of the time.",
        "Folded down it tucks against a wall or a fence. Raised, you have room to plate up without shuffling bowls around.",
      ],
      [
        "Strong Enough for a Pizza Oven",
        "The central top is built to take real weight — Mercia rate it for pizza ovens and cooking equipment, not just plates. If a countertop pizza oven is on your list, this is a stand that will hold one safely rather than a garden table you would rather not risk.",
      ],
      [
        "Shelves You Can Reach From Any Side",
        "Two solid shelves sit below the top, and both are open and accessible from every angle rather than boxed in. Drinks, plates, a bag of charcoal, a stack of boards — everything is visible and reachable without crouching to feel around inside a cupboard.",
      ],
      [
        "Pressure Treated, With a Guarantee That Asks Something of You",
        "The timber is pressure treated against decay, with preservative driven into the wood under pressure rather than brushed over the surface.",
        "It carries a fifteen-year anti-rot guarantee, and this one comes with a real condition worth reading before you buy: the guarantee requires a waterproof topcoat applied within fourteen days of installation, and again annually. Miss that first fortnight and the cover is gone. Plan the topcoat as part of the build, not as something to get round to.",
      ],
      [
        "Assembly and Delivery",
        "Two people are needed to build it, and the instructions are straightforward. Delivery is kerbside, so arrange help to move it to where it is going — that is not a job to discover on the day.",
      ],
    ],
    faqs: [
      [
        "What is the BBQ table made from?",
        "Pressure-treated timber, with the preservative driven into the wood under pressure rather than brushed onto the surface.",
      ],
      [
        "Can it take a pizza oven?",
        "Yes. Mercia rate the central top for pizza ovens and cooking equipment, which is why it works as a stand rather than just a serving table.",
      ],
      [
        "What are the fold-up side panels for?",
        "Extra preparation and serving space while you cook, folding away afterwards so the table takes up less room on the patio.",
      ],
      [
        "How much storage is there?",
        "Two solid shelves under the main top, both open and reachable from any side rather than enclosed.",
      ],
      [
        "What does the fifteen-year guarantee require?",
        "A waterproof topcoat applied within fourteen days of installation, and again every year. That fortnight matters — miss it and the anti-rot cover no longer applies, so treat the topcoat as part of the build.",
      ],
      [
        "How many people are needed to assemble it?",
        "Two. The instructions are straightforward, but it is not a one-person build.",
      ],
      [
        "How is it delivered?",
        "Kerbside. Arrange help to move it from the kerb to its final position before delivery day.",
      ],
      [
        "Can it stay outside all year?",
        "That is what it is built for, provided the topcoat is kept up annually. The pressure treatment protects against decay; the topcoat is what keeps water off the surface and the guarantee intact.",
      ],
    ],
  },
];

function toBlocks(sections: Section[]) {
  const blocks: unknown[] = [];
  let n = 0;
  for (const [heading, ...paragraphs] of sections) {
    blocks.push({
      _key: `b${n++}`,
      _type: "block",
      style: "h3",
      markDefs: [],
      children: [{ _key: `b${n}s`, _type: "span", marks: [], text: heading }],
    });
    for (const text of paragraphs) {
      blocks.push({
        _key: `b${n++}`,
        _type: "block",
        style: "normal",
        markDefs: [],
        children: [{ _key: `b${n}s`, _type: "span", marks: [], text }],
      });
    }
  }
  return blocks;
}

async function main() {
  const results: Record<string, unknown>[] = [];

  for (const item of COPY) {
    const description = toBlocks(item.sections);
    const faqs = item.faqs.map(([question, answer], i) => ({
      _key: `f${i}`,
      _type: "faqEntry",
      question,
      answer,
    }));
    const chars = item.sections.flatMap(([, ...p]) => p).join(" ").length;

    results.push({
      id: item.id,
      sections: item.sections.length,
      blocks: description.length,
      chars,
      faqs: faqs.length,
    });
    console.log(
      `${item.id}\n   ${item.sections.length} sections, ${description.length} blocks, ${chars} chars of prose, ${faqs.length} FAQs`,
    );

    if (!apply) continue;
    // Written to the draft, since these products are not published yet and the
    // price is still Damien's to set.
    await client.patch(`drafts.${item.id}`).set({ description, faqs }).commit();
    console.log(`   written to drafts.${item.id}`);
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-03-mercia-descriptions.json",
    JSON.stringify({ apply, results }, null, 2),
  );
  if (!apply) console.log("\nDry run — re-run with --apply.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
