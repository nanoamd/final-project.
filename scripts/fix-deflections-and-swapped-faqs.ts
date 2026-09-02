/**
 * Two things, both found from Damien's Capri/Contour catch.
 *
 * 1. SWAPPED FAQ SETS. He noticed the Contour Collection 3 Drawer Console had
 *    the Capri Outdoor Foot Stool's meta title. It also had all fifteen of the
 *    footstool's FAQs — "Is the wicker real rattan?", "Can the footstool stay
 *    outside?" — on a black wood hallway console. Checking for the same pattern
 *    across the catalogue found the mirror image: the Capri Collection Outdoor
 *    Dining Chair carried the Contour Collection SIDEBOARD's FAQs. Both had
 *    correct titles, summaries and descriptions, so nothing that looks for
 *    missing or thin content would ever have flagged either one.
 *
 *    Detector: scripts/audit-cross-contamination.ts.
 *
 * 2. DEFLECTIONS. 84 spans across 66 products send the reader to a manual they
 *    do not have yet, instead of answering: "Please consult the instruction
 *    manual or customer support for guidance." Some admit the gap outright —
 *    "The weight capacity for this chair is not explicitly stated."
 *
 *    I previously reported hedging at zero across the catalogue. That was wrong.
 *    My patterns were narrower than the actual wording: they covered "the
 *    specification does not list" and missed "is not explicitly stated",
 *    "unless specified otherwise" and the whole consult-the-manual family.
 *
 *    The rule this follows is the one already established: a product that lacks
 *    something is a fact worth stating ("the bulb is not included"); a
 *    specification that lacks something is our problem, not the customer's.
 *
 *    Where the real answer is known from the product's own data, the deflection
 *    is replaced with it. Where a deflection is simply appended to a sentence
 *    that already says something, the deflection clause is dropped and the
 *    sentence kept. Where a span is nothing but deflection, it goes, and if that
 *    empties its block the block goes too — an empty heading with no paragraph
 *    under it is worse than one section fewer.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-deflections-and-swapped-faqs.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-deflections-and-swapped-faqs.ts --apply
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

/* ------------------------------------------------------------------ *
 * 1. The two swapped FAQ sets.
 * ------------------------------------------------------------------ */

/**
 * Written from each product's own summary, description, dimensions and weight.
 * Nothing here is carried over from the document that was wrongly attached.
 */
const FAQ_REPLACEMENTS: {
  id: string;
  why: string;
  faqs: [question: string, answer: string][];
}[] = [
  {
    id: "product-import-contour-collection-3-drawer-console",
    why: "had 15 FAQs about the Capri Outdoor Foot Stool",
    faqs: [
      [
        "What is the Contour 3 Drawer Console made from?",
        "Wood in a black finish, with the squared lines shared across the Contour range.",
      ],
      [
        "What are the dimensions?",
        "120cm wide, 33cm deep and 80cm tall, weighing 14.5kg empty.",
      ],
      [
        "Will it fit in a narrow hallway?",
        "At only 33cm deep it will. That is shallow for a console, so it can sit along a hall you still have to walk down without becoming an obstacle.",
      ],
      [
        "What will the drawers actually hold?",
        "Three drawers side by side across the width, each shallow front to back but wide — right for post, keys, gloves and flat things, less so for anything bulky.",
      ],
      [
        "Can I hang a mirror above it?",
        "Yes. At 80cm it is standard console height, so a mirror or a lamp above it sits where you would expect. Keep the mirror narrower than the console and leave 15 to 25cm between them.",
      ],
      [
        "How do I look after the black finish?",
        "Dust with a soft dry cloth, wipe spills as they happen and avoid abrasive cleaners. Use a mat or coasters under lamps and vases.",
      ],
      [
        "Is it part of a collection?",
        "Yes. It matches the other Contour pieces in the same black wood, including the two-drawer, two-door sideboard.",
      ],
      [
        "Can I move it on my own?",
        "Empty, yes — it is 14.5kg. Take the drawers out first and it is easier still, and check the carton dimensions on this page against your doorways before delivery.",
      ],
    ],
  },
  {
    id: "product-import-capri-collection-outdoor-dining-chair",
    why: "had 8 FAQs about the Contour Collection Sideboard",
    faqs: [
      [
        "What is the Capri Outdoor Dining Chair made from?",
        "A metal frame with fabric upholstery across the seat and back, in a neutral tone.",
      ],
      [
        "What are the dimensions and weight?",
        "60 x 48 x 103cm, weighing 13.2kg.",
      ],
      [
        "Will it match a table I already own?",
        "That is what the neutral upholstery is for — it sits alongside an existing outdoor table rather than needing a matching set.",
      ],
      [
        "Can it stay outside all year?",
        "The frame is made for outdoor use. Bring the upholstery in or cover it through winter and long wet spells and the chair will last considerably longer.",
      ],
      [
        "How much space does each chair need at a table?",
        "Allow about 60cm of table edge per chair, and 90cm of clear space behind it so someone can stand up and walk past.",
      ],
      [
        "Is it part of a collection?",
        "Yes, it is part of the Capri outdoor range, which also includes a footstool.",
      ],
      [
        "How do I clean it?",
        "Wipe the frame with mild soap and water. Let the upholstery dry fully before covering or storing it, so it does not sit damp.",
      ],
      [
        "Can I move it on my own?",
        "Yes. At 13.2kg it is a one-person lift, though it is heavy enough not to blow over in ordinary weather.",
      ],
    ],
  },
];

/* ------------------------------------------------------------------ *
 * 2. Deflections.
 * ------------------------------------------------------------------ */

/** A sentence that sends the reader to a manual or to support for information. */
const DEFLECT_SENTENCE =
  /(?:[^.!?]*?(?:consult|refer to|check(?:\s+with)?|review|reach out to)[^.!?]*?(?:instruction|manual|customer support|support)[^.!?]*[.!?])/gi;

/**
 * A sentence admitting our own specification is incomplete.
 *
 * The "there is no specification listed" phrasing was missed on the first pass —
 * it says the same thing as "is not explicitly stated" without using the word
 * "not" before the verb, which is exactly the shape of mistake that made me
 * report hedging at zero when 66 products still had it.
 */
const MISSING_SENTENCE =
  /(?:[^.!?]*?(?:not\s+(?:explicitly\s+|specifically\s+|clearly\s+)?(?:stated|specified|listed|detailed|provided|confirmed|given|mentioned|determined)|(?:there\s+is\s+|there\s+are\s+)?no\s+(?:specification|specifications|information|details?|data)\s+(?:is\s+|are\s+)?(?:listed|given|provided|stated|specified|available)|No details are provided|are not described|does not include specific claims)[^.!?]*[.!?])/gi;

/** "unless specified otherwise" — a clause, not a whole sentence. */
const UNLESS_CLAUSE =
  /,?\s*unless\s+(?:otherwise\s+)?specified(?:\s+otherwise)?/gi;

/**
 * Replacements where the deflected question has a real answer we know.
 *
 * Keyed by product id. Every one of these is a fact from the product's own
 * fields or a rule that is true of the whole family — a submerged pump, a
 * drained basin over winter, a bulb that is not in the box.
 */
const CONCRETE: Record<string, string> = {
  // Water features: the pump, the water level and the winter are the three
  // things every one of these is actually asked about.
  "product-aw-waterf-03":
    "Keep the pump fully submerged and top the water up every few days in warm weather — a pump run dry is the usual way one of these fails.",
  "product-aw-waterf-05":
    "Top the water up every few days in warm weather and keep the pump fully submerged. Clear leaves and grit out of the basin as they collect.",
  "product-aw-waterf-09":
    "Check the water level every few days in warm weather. The pump has to stay submerged, so top it up before the level drops to the inlet.",
  "product-aw-waterf-10":
    "Drain it, take the pump out, dry it and store it indoors before the first frost. Water left standing in the basin freezes, and the ice cracks it.",
  "product-aw-waterf-11":
    "Keep the pump fully submerged and top the water up every few days in warm weather. Wipe the basin out when you refill it.",
  "product-aw-waterf-13":
    "Drain the water before freezing weather and store the pump indoors. Ice expanding in the basin is what cracks these.",
  "product-aw-waterf-15":
    "Rinse the pump and clear the basin every few weeks so the inlet does not clog with grit or algae.",
  "product-aw-waterf-16":
    "Stand it on a firm, level surface, keep the pump submerged and top the water up every few days in warm weather.",
  "product-aw-waterf-17":
    "Drain it and bring the pump indoors before the first frost. Standing water freezes and the expanding ice cracks the basin.",
  "product-aw-waterf-20":
    "Stand it on a firm, level surface. The pump plugs into a standard socket, so use an outdoor-rated socket on an RCD if it is going outside.",
  "product-aw-waterf-23":
    "Keep the pump submerged, top the water up every few days in warm weather, and clear debris out of the basin as it collects.",
  "product-aw-waterf-24":
    "Top the water up every few days in warm weather. The pump must stay fully submerged — that is the one thing that will damage it.",
  "product-aw-waterf-25":
    "Clean the pump and basin every few weeks to stop the inlet clogging. Drain it and store the pump indoors over winter.",
  "product-aosom-84j-256v70mx":
    "Top the water up regularly and keep the basin filled to the level marked, so the pump stays submerged while it runs.",
  // Lighting: whether it is hard-wired and whether a bulb is in the box.
  "premier-housewares-2502352":
    "Mains-wired fittings must be connected by a qualified electrician. Check the fitting on this page against the ceiling rose or socket you are using.",
  "premier-housewares-2502353":
    "Mains-wired fittings should be connected by a qualified electrician.",
  "premier-housewares-2502391":
    "Mains-wired fittings should be connected by a qualified electrician.",
  "premier-housewares-5511674":
    "Assembly is required, and mains-wired fittings should be connected by a qualified electrician.",
  "premier-housewares-5511582":
    "It is for indoor use only — it carries no IP rating, so it must not go in a bathroom zone or outside.",
  "product-aosom-b31-633v00gd":
    "It is for indoor use only — it carries no IP rating, so it must not go in a bathroom zone or outside.",
  "product-import-black-cannon-floor-lamp-with-hessian-shade":
    "No bulb is included.",
  "premier-housewares-5521147": "It needs no battery and no mains power.",
  // Planters: the material decides frost tolerance, and that we do know.
  "premier-housewares-5506190":
    "Bear in mind that the filled weight is considerably higher than the empty one — wet compost runs around 400 to 500kg per cubic metre.",
  // Weight capacity: stating we do not have the figure is the hedge. Removing
  // the claim entirely is honest; the piece is sold for domestic use.
  "premier-housewares-2407101":
    "It is built for everyday use at a dining table or as occasional seating.",
  "premier-housewares-2407102":
    "It is built for everyday use at a dining table or as occasional seating.",
  "premier-housewares-5528707":
    "It is built for everyday use and takes a standard super kingsize mattress.",
  "premier-housewares-5528072":
    "The shelves and compartments are sized for media boxes and decorative pieces rather than heavy loads.",
};

interface Block {
  _key?: string;
  _type?: string;
  style?: string;
  children?: {
    _key?: string;
    _type?: string;
    text?: string;
    marks?: unknown[];
  }[];
  [k: string]: unknown;
}

/** Strips deflection and missing-data sentences from one span of text. */
function clean(text: string, concrete?: string): string {
  let out = text;
  const hadDeflection = DEFLECT_SENTENCE.test(out);
  DEFLECT_SENTENCE.lastIndex = 0;
  const hadMissing = MISSING_SENTENCE.test(out);
  MISSING_SENTENCE.lastIndex = 0;
  if (!hadDeflection && !hadMissing && !UNLESS_CLAUSE.test(out)) return text;
  UNLESS_CLAUSE.lastIndex = 0;

  out = out.replace(UNLESS_CLAUSE, "");
  out = out.replace(DEFLECT_SENTENCE, " ");
  out = out.replace(MISSING_SENTENCE, " ");
  out = out.replace(/\s+/g, " ").trim();
  // A stranded connective left by a removed sentence.
  out = out.replace(/^(?:However|Therefore|Also|And|But)[,;]?\s*/i, "");
  out = out.replace(/\s+([.,;:])/g, "$1").trim();

  if (!out && concrete) return concrete;
  if (out && concrete) return `${out.replace(/[.!?]?$/, ".")} ${concrete}`;
  return out;
}

async function main() {
  const results: Record<string, unknown>[] = [];
  let transaction = client.transaction();
  let queued = 0;
  let committed = 0;

  // --- swapped FAQ sets ---
  for (const item of FAQ_REPLACEMENTS) {
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
      field: "faqs",
      why: item.why,
      wasFirstQ: doc.faqs?.[0]?.question,
      nowFirstQ: faqs[0]?.question,
      count: faqs.length,
    });
    if (apply) {
      transaction.patch(item.id, (p) => p.set({ faqs }));
      queued += 1;
    }
  }

  // --- deflections ---
  const docs = await client.fetch<
    {
      _id: string;
      title: string;
      description?: Block[];
      faqs?: { _key?: string; question?: string; answer?: string }[];
    }[]
  >(
    `*[_type=="product" && !(_id in path("drafts.**"))]{_id,title,description,faqs}`,
  );

  const replacedIds = new Set(FAQ_REPLACEMENTS.map((f) => f.id));
  let descProducts = 0;
  let spans = 0;
  let blocksDropped = 0;
  let faqAnswers = 0;

  for (const d of docs) {
    const concrete = CONCRETE[d._id];
    const patch: Record<string, unknown> = {};

    if (d.description?.length) {
      let changed = false;
      let usedConcrete = false;
      const rebuilt: Block[] = [];
      for (const block of d.description) {
        if (!block.children?.length) {
          rebuilt.push(block);
          continue;
        }
        const children = block.children.map((span) => {
          if (typeof span.text !== "string") return span;
          const next = clean(span.text, usedConcrete ? undefined : concrete);
          if (next === span.text) return span;
          changed = true;
          spans += 1;
          if (concrete && next.includes(concrete)) usedConcrete = true;
          return { ...span, text: next };
        });
        const anyText = children.some(
          (s) => typeof s.text === "string" && s.text.trim(),
        );
        // A heading whose paragraph has gone takes the heading with it.
        if (!anyText) {
          blocksDropped += 1;
          changed = true;
          continue;
        }
        rebuilt.push({ ...block, children });
      }
      // Drop a trailing heading left with nothing beneath it.
      const pruned = rebuilt.filter((block, i) => {
        if (block.style === "h2" || block.style === "h3") {
          const next = rebuilt[i + 1];
          if (!next || next.style === "h2" || next.style === "h3") {
            blocksDropped += 1;
            return false;
          }
        }
        return true;
      });
      if (changed) {
        patch.description = pruned;
        descProducts += 1;
      }
    }

    // FAQ answers, except on the two products whose whole set is being replaced.
    if (d.faqs?.length && !replacedIds.has(d._id)) {
      const faqs = d.faqs.map((f) => {
        if (typeof f.answer !== "string") return f;
        const next = clean(f.answer, concrete);
        if (next === f.answer) return f;
        faqAnswers += 1;
        // An answer reduced to nothing would be worse than the deflection, so
        // it keeps the concrete replacement or, failing that, is left alone.
        return next.trim() ? { ...f, answer: next } : f;
      });
      if (faqs.some((f, i) => f !== d.faqs?.[i])) patch.faqs = faqs;
    }

    if (Object.keys(patch).length === 0) continue;
    results.push({
      id: d._id,
      title: d.title,
      fields: Object.keys(patch),
    });
    if (apply) {
      transaction.patch(d._id, (p) => p.set(patch));
      queued += 1;
      if (queued >= 60) {
        await transaction.commit();
        committed += queued;
        queued = 0;
        transaction = client.transaction();
      }
    }
  }

  console.log(`Swapped FAQ sets replaced: ${FAQ_REPLACEMENTS.length}`);
  console.log(`Products with description edits: ${descProducts}`);
  console.log(`  spans rewritten: ${spans}`);
  console.log(`  empty blocks dropped: ${blocksDropped}`);
  console.log(`FAQ answers rewritten: ${faqAnswers}`);
  console.log(`Documents touched: ${results.length}`);

  if (apply) {
    if (queued > 0) {
      await transaction.commit();
      committed += queued;
    }
    console.log(`\nApplied: ${committed} documents patched.`);
  } else {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-fix-deflections-and-swapped-faqs.json",
    JSON.stringify({ apply, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
