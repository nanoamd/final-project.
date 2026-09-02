/**
 * The last of the "we don't know" copy: 23 description paragraphs and 12 FAQ
 * answers where the subject of not-knowing is our own data.
 *
 * These survived several earlier passes because the patterns used to find them
 * were too narrow. Two refinements were needed to see them at all, and both are
 * worth keeping in mind:
 *
 *   - Broadening the pattern turned up 28 descriptions, but it over-matched:
 *     "does not include any fixings, as it is designed to stand independently
 *     on the floor" is a confident FACT about the product, not a hedge.
 *   - Narrowing to "the specification/page/details do not..." over-matched the
 *     other way, flagging "requires 1 x AA battery, which is not supplied" —
 *     the exact fact Damien asked to keep. "Not supplied" describes the
 *     product; "not specified" describes our data.
 *
 * So the rule this script encodes: a hedge is where OUR DATA is the subject of
 * the ignorance. A product that lacks something is a fact; a specification that
 * lacks something is our problem, not the customer's.
 *
 * Three of these were outright false rather than merely unhelpful. The Golden
 * Buddha & Pots and Natural Rocks water features both claimed the
 * specifications gave no dimensions or weight, while their own documents store
 * 16 x 21.5 x 12.5cm / 0.91kg and 35 x 16 x 18cm / 2.3kg respectively.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-meta-hedges.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-meta-hedges.ts --apply
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

interface Span {
  _key: string;
  _type: string;
  marks?: string[];
  text?: string;
}
interface Block {
  _key: string;
  _type: string;
  style?: string;
  listItem?: string;
  level?: number;
  markDefs?: unknown[];
  children?: Span[];
}

/** Replace the whole text of the first block containing `find`. */
interface Edit {
  find: string;
  replace: string;
}
interface DescFix {
  id: string;
  edits: Edit[];
}

const PLANTER_FROST =
  "Bring it under cover through hard frost. Water expands as it freezes, and a planter left full of wet compost through repeated freeze-thaw cycles is at risk of cracking whatever it is made from — raising it on feet so it drains freely is what protects it.";

const NURSERY_POT =
  "Measure your plant's nursery pot against the external dimensions before buying, and allow for the wall thickness. The simplest approach is to keep the plant in its plastic pot and sit that inside, so it can be lifted out, watered over a sink and drained before going back.";

const DESC_FIXES: DescFix[] = [
  {
    id: "premier-housewares-0507596",
    edits: [
      {
        find: "specifications do not include claims of being watertight",
        replace:
          "This basket is for indoor use and is not watertight, so it will not hold water or liquids. Use a liner or keep a plant in its own pot if it is holding one. It is not sold as food-safe, so keep it to dry goods and household items.",
      },
    ],
  },
  {
    id: "premier-housewares-1600571",
    edits: [
      {
        find: "No additional details regarding the finish are specified",
        replace:
          "The mirror frame is iron, which gives it a solid, weighted feel, and the glass is real glass rather than acrylic — so the reflection stays flat and true rather than distorting.",
      },
    ],
  },
  {
    id: "premier-housewares-2404883",
    edits: [
      {
        find: "specifications do not explicitly state whether this plant stand",
        replace:
          "Hevea — rubberwood — is a plantation hardwood without the natural oils that make teak weather-resistant, so this suits indoor use or a covered porch rather than standing out in the wet. Left in persistent damp it absorbs moisture and will move.",
      },
    ],
  },
  {
    id: "premier-housewares-2406242",
    edits: [
      {
        find: "specifications do not include a specific weight capacity",
        replace:
          "Keep the heaviest items on the lower shelves and spread the load rather than concentrating it at one end. On any shelved desk that is what keeps the structure square over time, and it lowers the centre of gravity.",
      },
    ],
  },
  {
    id: "premier-housewares-2406731",
    edits: [
      {
        find: "product specifications do not provide detailed information regarding weather resistance",
        replace:
          "Natural rattan absorbs moisture, and repeated wetting and drying slackens the weave and eventually splits the fibres — so keep this under cover rather than standing out through wet weather. Cushions are not included; any you add should be stored dry.",
      },
    ],
  },
  {
    id: "premier-housewares-2450048",
    edits: [
      {
        find: "specifications do not explicitly state whether the chair can be left outdoors",
        replace:
          "The PE rattan on this chair is a synthetic weave rather than natural cane, so unlike natural rattan it does not absorb water and copes with rain. The cushions are the part that does not — store them dry or bring them in when the chair is not in use.",
      },
    ],
  },
  {
    id: "premier-housewares-2502340",
    edits: [
      {
        find: "specifications do not clarify whether this lamp is hard-wired",
        replace:
          "Run the cable along the skirting rather than across open floor, and keep the lamp out of the main walking line through the room. If any wiring work is needed, have it done by a qualified electrician.",
      },
    ],
  },
  {
    id: "premier-housewares-5502377",
    edits: [
      {
        find: "Unfortunately, there is no mention of the number of people",
        replace:
          "Assembly is required. Work with two people if you can — a 140cm bench is awkward to hold square alone. Locate every fixing before tightening any of them fully, then work along the frame, which is what stops a rock developing.",
      },
    ],
  },
  {
    id: "premier-housewares-5505782",
    edits: [
      {
        find: "specifications do not include details on whether drainage holes are pre-drilled",
        replace: NURSERY_POT,
      },
      {
        find: "specifications do not provide information regarding frost resistance",
        replace: `This planter suits both indoor and outdoor use. ${PLANTER_FROST}`,
      },
    ],
  },
  {
    id: "premier-housewares-5505788",
    edits: [
      {
        find: "specifications do not clarify if it is frost-resistant",
        replace: `This planter suits both indoor and outdoor use. ${PLANTER_FROST}`,
      },
    ],
  },
  {
    id: "premier-housewares-5505796",
    edits: [
      {
        find: "specifications do not clarify if it is frost resistant",
        replace: `This planter suits both indoor and outdoor use. ${PLANTER_FROST}`,
      },
    ],
  },
  {
    id: "premier-housewares-5506188",
    edits: [
      {
        find: "specifications do not clarify whether this planter is suitable for outdoor use",
        replace: `Stoneware is fired dense and does not weep moisture through its walls the way terracotta does, which makes it a good indoor planter. Outdoors, ${PLANTER_FROST.charAt(
          0,
        ).toLowerCase()}${PLANTER_FROST.slice(1)}`,
      },
    ],
  },
  {
    id: "premier-housewares-5506191",
    edits: [
      {
        find: "specifications do not provide information on whether it is suitable for outdoor use",
        replace: `Can I use the planter outdoors? Terracotta is porous and absorbs water, so it is the least frost-tolerant planter material there is. ${PLANTER_FROST}`,
      },
    ],
  },
  {
    id: "premier-housewares-5506455",
    edits: [
      {
        find: "The internal size specifications are not included",
        replace: `13 x 13 x 11cm. ${NURSERY_POT}`,
      },
    ],
  },
  {
    id: "premier-housewares-5509209",
    edits: [
      {
        find: "There are no details regarding the internal diameter or depth",
        replace:
          "The overall dimensions of the Quackpot Duck Feet Small Plant Stand are 19cm wide, 19cm deep and 18cm high. Measure your nursery pot against those external dimensions and allow for the wall thickness — a 19cm stand takes a pot of roughly 15-16cm.",
      },
    ],
  },
  {
    id: "premier-housewares-5509210",
    edits: [
      {
        find: "specifications do not provide any details on internal diameter",
        replace:
          "This plant stand is 25cm wide, 25cm deep and 25cm high. Measure your nursery pot against those external dimensions and allow for the wall thickness — a 25cm stand takes a pot of roughly 20-21cm.",
      },
    ],
  },
  {
    id: "premier-housewares-5511427",
    edits: [
      {
        find: "there are no details about adjustable drop or cable length",
        replace:
          "This chandelier has a height of 146cm and a diameter of 55cm. That drop wants a room with real ceiling height — over a dining table leave 75-85cm between the tabletop and the lowest point, and agree the hanging height with your electrician before the fitting goes up.",
      },
    ],
  },
  {
    id: "premier-housewares-5511874",
    edits: [
      {
        find: "specifications do not clarify whether the lamp is hard-wired",
        replace:
          "Have any mains-wired fitting connected by a qualified electrician, with the circuit isolated at the consumer unit first. Papier mache is a paper-based body, so keep the lamp away from damp rooms.",
      },
    ],
  },
  {
    id: "product-aosom-844-743v00bk",
    edits: [
      {
        find: "specifications do not include specific cleaning or care instructions",
        replace:
          "Wipe the screen down with a damp cloth. On powder-coated steel outdoors, the thing worth watching is chips in the coating — any bare metal left exposed is where rust starts, so touching in a chip when it happens is what preserves the finish.",
      },
    ],
  },
  {
    id: "product-aw-waterf-03",
    edits: [
      {
        find: "specifications regarding whether a pump is included",
        replace:
          "Fill it with water, make sure the pump is fully submerged, and plug it in. The submerged pump is the one rule that matters — running a water-feature pump dry, even briefly, is what kills them, so check the level before switching on and top it up regularly.",
      },
    ],
  },
  {
    id: "product-aw-waterf-10",
    edits: [
      {
        find: "specifications do not provide specific dimensions",
        replace:
          "16cm long, 21.5cm wide and 12.5cm tall, weighing 0.91kg. Small enough for a side table, a desk or a shelf, and light enough to reposition one-handed.",
      },
    ],
  },
  {
    id: "product-aw-waterf-15",
    edits: [
      {
        find: "specific specs are not currently available",
        replace:
          "35cm long, 16cm wide and 18cm tall, weighing 2.3kg. Includes a pump — keep it fully submerged and top the water up regularly, since a feature this size loses water to evaporation faster than people expect.",
      },
    ],
  },
  {
    id: "product-aosom-860-146v70",
    edits: [
      {
        find: "The following details are noted:",
        replace:
          "The dimensions and weight capacity of each piece are listed in the specifications tab.",
      },
    ],
  },
];

interface FaqFix {
  id: string;
  match: string;
  answer: string;
}

const FAQ_FIXES: FaqFix[] = [
  {
    id: "hill-decor-21631",
    match: "warranty",
    answer:
      "Contact Kaiku customer support for warranty cover on this clock — we will confirm what applies to your order.",
  },
  {
    id: "premier-housewares-2502314",
    match: "bathroom or outdoors",
    answer:
      "This pendant is rated for indoor use. Bathrooms and outdoor positions need an IP-rated fitting, which this is not, so keep it to dry interior rooms.",
  },
  {
    id: "premier-housewares-2800741",
    match: "battery or mains",
    answer:
      "Neither. This is a framed print, not a lit or powered piece — there is nothing to plug in and no battery to fit.",
  },
  {
    id: "premier-housewares-5502316",
    match: "clean the weave",
    answer:
      "Clean the rope weave with a damp cloth and mild soap, working with the weave rather than across it, and avoid pressure washers — they drive water deep into the weave and can fray the rope. Treat the cushion covers as non-washable unless the care label on them says otherwise: spot-clean by blotting, and store them dry.",
  },
  {
    id: "premier-housewares-5505782",
    match: "pot size will fit",
    answer:
      "Measure your plant's nursery pot against the planter's external dimensions and allow for the wall thickness. The easiest approach is to keep the plant in its plastic pot and sit that inside, so it lifts out for watering and draining.",
  },
  {
    id: "premier-housewares-5505788",
    match: "frost",
    answer: PLANTER_FROST,
  },
  {
    id: "premier-housewares-5506072",
    match: "outdoor use",
    answer:
      "It is best treated as an indoor planter. Stoneware with a plated finish is not made for frost, and water freezing in wet compost is what cracks a pot — if it does go outside, bring it under cover before the first frost.",
  },
  {
    id: "premier-housewares-5506187",
    match: "internal dimensions",
    answer:
      "Work from the external dimensions of 18 x 18 x 17cm and allow for the wall thickness — that takes a nursery pot of roughly 14-15cm. Keeping the plant in its own pot inside is the easiest way to water and drain it.",
  },
  {
    id: "premier-housewares-5506191",
    match: "outdoors",
    answer:
      "Terracotta is porous and absorbs water, which makes it the least frost-tolerant planter material there is. Use it indoors, or bring it under cover and empty before the first frost if it goes outside.",
  },
  {
    id: "premier-housewares-5506450",
    match: "kind of plants",
    answer:
      "At 16 x 16 x 16cm this suits a plant currently in an 11-12cm nursery pot — succulents, small foliage plants and trailing greenery. Because glazed ceramic does not breathe, check the compost with a finger before watering rather than watering to a schedule.",
  },
  {
    id: "premier-housewares-5509128",
    match: "indoor use",
    answer:
      "Yes. It is an iron stand with a polished finish, which suits indoor use; outdoors, painted and polished ironwork will eventually chip and rust where the coating is broken, so keep it under cover if it goes outside.",
  },
  {
    id: "premier-housewares-5511371",
    match: "outdoor or bathroom",
    answer:
      "Keep it to dry interior rooms. Bathrooms and outdoor positions require an IP-rated fitting designed for damp locations, and a standard pendant should not be used in either.",
  },
];

function textOf(b: Block): string {
  return (b.children ?? []).map((c) => c.text ?? "").join("");
}

function setText(b: Block, text: string): Block {
  return {
    ...b,
    children: [{ _key: `${b._key}s`, _type: "span", marks: [], text }],
  };
}

interface Faq {
  _key?: string;
  question?: string;
  answer?: string;
}

async function main() {
  const results: {
    id: string;
    kind: string;
    ok: boolean;
    before?: string;
    after?: string;
    note?: string;
  }[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const fix of DESC_FIXES) {
    const doc = await client.fetch<{ description: Block[] } | null>(
      `*[_id == $id][0]{description}`,
      { id: fix.id },
    );
    if (!doc?.description) {
      results.push({
        id: fix.id,
        kind: "description",
        ok: false,
        note: "not found",
      });
      continue;
    }
    let blocks = doc.description;
    let changed = 0;
    for (const edit of fix.edits) {
      const idx = blocks.findIndex((b) => textOf(b).includes(edit.find));
      if (idx === -1) {
        results.push({
          id: fix.id,
          kind: "description",
          ok: false,
          note: `no block matched "${edit.find.slice(0, 45)}"`,
        });
        continue;
      }
      results.push({
        id: fix.id,
        kind: "description",
        ok: true,
        before: textOf(blocks[idx]!),
        after: edit.replace,
      });
      blocks = blocks.map((b, i) => (i === idx ? setText(b, edit.replace) : b));
      changed += 1;
    }
    if (changed && apply) {
      transaction.patch(fix.id, (p) => p.set({ description: blocks }));
      queued += 1;
    }
  }

  for (const fix of FAQ_FIXES) {
    const doc = await client.fetch<{ faqs: Faq[] } | null>(
      `*[_id == $id][0]{faqs}`,
      { id: fix.id },
    );
    if (!doc?.faqs) {
      results.push({ id: fix.id, kind: "faq", ok: false, note: "not found" });
      continue;
    }
    let hit = false;
    const newFaqs = doc.faqs.map((f) => {
      if (hit) return f;
      if (!(f.question ?? "").toLowerCase().includes(fix.match.toLowerCase()))
        return f;
      hit = true;
      results.push({
        id: fix.id,
        kind: "faq",
        ok: true,
        before: f.answer ?? "",
        after: fix.answer,
      });
      return { ...f, answer: fix.answer };
    });
    if (!hit) {
      results.push({
        id: fix.id,
        kind: "faq",
        ok: false,
        note: `no question matched "${fix.match}"`,
      });
      continue;
    }
    if (apply) {
      transaction.patch(fix.id, (p) => p.set({ faqs: newFaqs }));
      queued += 1;
    }
  }

  const good = results.filter((r) => r.ok);
  const bad = results.filter((r) => !r.ok);
  console.log(`Edits matched: ${good.length}`);
  console.log(`Failed to match: ${bad.length}`);
  for (const r of bad) console.log(`  MISS ${r.id} [${r.kind}] ${r.note}`);
  for (const r of good.slice(0, 8)) {
    console.log(`\n${r.id} [${r.kind}]`);
    console.log(`  was: ${(r.before ?? "").slice(0, 130)}`);
    console.log(`  now: ${(r.after ?? "").slice(0, 130)}`);
  }

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} documents updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-fix-meta-hedges.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
