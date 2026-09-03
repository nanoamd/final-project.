/**
 * The first two buying guides from the roadmap — Dining Tables and Beds,
 * both currently at zero guides despite real product ranges (66 and 20
 * products, up to £2,459 and £1,270). Both pair with a brand-new tool built
 * in the same pass: the indoor dining-table calculator
 * (scripts/../src/app/(site)/tools/dining-table-size-calculator) and the
 * bed-size calculator (.../tools/bed-size-calculator) — Damien: "include
 * relevant tools embedded into the buying guide page and if theres any
 * relevant tool you can make, make it."
 *
 * Structure matches the existing, working guides exactly (checked against
 * where-to-hang-a-wall-clock rather than invented): a direct-answer opening,
 * a reference table, the embedded calculator right after it, numbered rules
 * as h2 sections, a worked table against real stock, a recap, and 5 FAQs.
 *
 * The "measured against real stock" tables use products actually in the
 * catalogue — their real dimensions, not invented ones — with seat counts
 * and storage types read off each product's own data or title where it says
 * so directly ("...with 6 Chairs Set").
 *
 *   pnpm tsx --env-file=.env.local scripts/create-buying-guides-batch1.ts
 *   pnpm tsx --env-file=.env.local scripts/create-buying-guides-batch1.ts --apply
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
  perspective: "raw",
});

const AUTHOR_ID = "author-kaiku-editorial";

function block(prefix: string, index: number, text: string, style = "normal") {
  return {
    _key: `${prefix}${index}`,
    _type: "block",
    style,
    markDefs: [],
    children: [{ _key: `${prefix}${index}s`, _type: "span", marks: [], text }],
  };
}

function table(
  prefix: string,
  index: number,
  caption: string,
  headers: string[],
  rows: string[][],
) {
  return {
    _key: `${prefix}${index}`,
    _type: "guideTable",
    caption,
    headers,
    rows: rows.map((cells, i) => ({
      _key: `${prefix}${index}r${i}`,
      _type: "guideTableRow",
      cells,
    })),
  };
}

function tool(
  prefix: string,
  index: number,
  toolName: string,
  caption: string,
) {
  return {
    _key: `${prefix}${index}`,
    _type: "guideTool",
    tool: toolName,
    caption,
  };
}

interface GuideSpec {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  categoryId: string;
  relatedProductIds: string[];
  seo: { title: string; description: string };
  body: unknown[];
  faqs: [question: string, answer: string][];
}

const DINING_TABLE_PRODUCT_IDS = [
  "premier-housewares-5529011", // Azalea Round White Marble, 80cm
  "premier-housewares-5528865", // Imperia Ceramic Round, 100cm
  "premier-housewares-2404029", // Vermont White Wash Round + 4 chairs, 120cm
  "premier-housewares-5528699", // Parkside Dark Oak Round, 152cm
  "premier-housewares-5528866", // Imperia Ceramic Rectangular, 150x90
  "premier-housewares-2405942", // Weston Marble Effect + 6 chairs, 160x88
  "premier-housewares-5501654", // Lyon Whitewash, 220x100
  "premier-housewares-5528970", // Saronno Grey Marble, 240x100
];

const BED_PRODUCT_IDS = [
  "product-aosom-83d-032v00gy", // 3ft Single Pine Storage Bed
  "premier-housewares-5502120", // Loire White Double
  "premier-housewares-2405848", // Hannah Beige Ottoman Double
  "premier-housewares-5502121", // Loire White King
  "premier-housewares-2405850", // Hannah Grey Ottoman King
  "product-aosom-83d-185v03cg", // 5ft King Hydraulic Storage + LED
  "premier-housewares-5502122", // Loire White Super King
  "premier-housewares-5528707", // Parkside Grey Fabric Super King
];

const GUIDES: GuideSpec[] = [
  {
    id: "guide-dining-table-size-and-shape",
    title: "What size dining table for how many seats?",
    slug: "dining-table-size-and-shape",
    excerpt:
      "Sixty centimetres of edge per seat on a rectangular table, and round tables that scale by diameter rather than a straight per-person count. The seat counts by length and shape, round versus rectangular properly answered, and eight of our own tables measured against real chairs.",
    categoryId: "category-kitchen-furniture",
    relatedProductIds: DINING_TABLE_PRODUCT_IDS,
    seo: {
      title: "What Size Dining Table for How Many Seats? | Kaiku",
      description:
        "60cm of edge per seat on a rectangular table; round tables scale by diameter instead. Seat counts by size, round vs rectangular, and 8 real tables measured.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "A rectangular dining table needs about 60cm of length per seat, plus roughly 90cm of clear floor on every side so a chair can pull out and someone can walk past a seated guest without climbing over them.",
      );
      p(
        "A round table works differently: seating scales with the diameter rather than a straight per-person number, because everyone shares the same edge and there are no corners to lose. What follows is the seat count by length and diameter, the round-versus-rectangular question properly answered, and eight of our own tables measured against real dining chairs rather than a rule of thumb.",
      );
      b.push(
        table(
          "b",
          n,
          "Seats by table length and shape",
          ["Seats", "Rectangular length", "Round diameter"],
          [
            ["2", "90–110cm", "70–80cm"],
            ["4", "120–150cm", "100–120cm"],
            ["6", "150–200cm", "130–150cm"],
            ["8", "220–240cm", "180cm+ — rare; most 8-seaters are rectangular"],
          ],
        ),
      );
      n += 1;
      b.push(
        tool(
          "b",
          n,
          "dining-table-space",
          "Your room, your table, your seat count",
        ),
      );
      n += 1;
      p("Rule one. Sixty centimetres of edge, not width", "h2");
      p(
        "Each seat wants about 60cm of table edge to itself — enough for a place setting without touching elbows with the next chair. Fifty-five centimetres is workable for a family who don't mind sitting close; below 50cm it stops being dinner and starts being a queue.",
      );
      p(
        "Width doesn't add seats on its own. A table that's 100cm wide instead of 90cm doesn't seat more people — it just puts more space between the two facing rows. Extra width earns its keep for serving dishes down the middle, not for headcount.",
      );
      p("Rule two. Rectangular tables lose their corners", "h2");
      p(
        "A published seat count often assumes the full length is usable, and it isn't. The last 20cm at each end of a long side collides with whoever sits at the head of the table, so a 180cm table has roughly 140cm of usable edge per side, not 180cm — two settings a side at 60cm, plus the two ends.",
      );
      p(
        "That's the gap between a table ‘sold as seating eight’ and one that comfortably does. Measure the usable length, not the advertised one, before counting on a seat you might not get.",
      );
      p("Rule three. Round tables scale by circumference, not addition", "h2");
      p(
        "A round table shares its edge among everyone at once, so a jump from 100cm to 120cm can be the difference between four people sitting elbow to elbow and four people with room to spare — it doesn't add a fifth seat the way the same 20cm might on a rectangular table.",
      );
      p(
        "Round tables also rarely go much past 150–160cm in practice. Past that point the middle of the table is too far to reach comfortably, which is why an 8-seat table is almost always rectangular or oval rather than round.",
      );
      p("Rule four. Leave 90cm on every side that isn't a wall", "h2");
      p(
        "A seated diner needs about 90cm of clearance behind their chair so someone can walk past without brushing them — measured from the table edge, not the chair back. Where nobody needs to pass behind a seated guest, such as one long side pushed against a wall, 75cm is workable.",
      );
      p(
        "That 90cm figure is what actually decides whether a table fits a room, more often than the table's own length. A generously sized table with only 60cm to the nearest wall will feel cramped in use even though the tape measure says it fits.",
      );
      p("Round or rectangular, for a small room", "h2");
      p(
        "Round wins in most small or square rooms. It needs less clearance because there are no corners to walk around, everyone can reach the middle without stretching, and it seats the same number in a smaller footprint than the equivalent rectangular table.",
      );
      p(
        "Rectangular wins the moment one long side can sit against a wall — the shape that was a disadvantage in the middle of a room becomes an advantage against a wall, because that side then needs no pull-out clearance at all.",
      );
      p("Eight of our tables, measured against the rules", "h2");
      p(
        "The same arithmetic, run over our own stock. Seat count follows the rules above — length or diameter, minus the corner allowance on rectangular tables — checked where we could against the chair sets sold alongside them.",
      );
      b.push(
        table(
          "b",
          n,
          "Our dining tables, measured",
          ["Table", "Size", "Seats"],
          [
            ["Azalea Round White Marble Top", "80cm round", "2–4"],
            ["Imperia Ceramic Marble Effect Round", "100cm round", "4"],
            [
              "Vermont White Wash Round (sold with 4 chairs)",
              "120cm round",
              "4",
            ],
            ["Parkside Dark Oak Round", "152cm round", "6"],
            ["Imperia Ceramic Marble Effect Rectangular", "150 x 90cm", "6"],
            ["Weston Marble Effect (sold with 6 chairs)", "160 x 88cm", "6"],
            ["Lyon Whitewash", "220 x 100cm", "8"],
            ["Saronno Grey Marble", "240 x 100cm", "8–10"],
          ],
        ),
      );
      n += 1;
      p(
        "Read it the other way round if it helps: measure your room against the clearance rule above, find the table length or diameter that fits, and this table tells you what it will actually seat — not what a generic listing promises.",
      );
      p("The short version", "h2");
      p(
        "Sixty centimetres of edge per seat, minus the corners on a rectangular table. Round tables scale by diameter, not a straight per-person count, and rarely go past 150–160cm. Leave 90cm of clearance on any side someone needs to walk past a seated guest — 75cm where one side sits against a wall. Round suits a small or square room; rectangular wins against a wall.",
      );
      return b;
    })(),
    faqs: [
      [
        "How many people does a 150cm dining table seat?",
        "Six, if it's rectangular — 60cm a side for two settings, plus one at each end, once the last 20cm of each long side is discounted for the corner. A 150cm round table seats the same six with less floor space, because there are no corners to lose.",
      ],
      [
        "What size table do I need for 6 people?",
        "A rectangular table of 150–200cm, or a round table of 130–150cm diameter. The round version fits a smaller room for the same headcount; the rectangular version can go longer if one side sits against a wall.",
      ],
      [
        "Is a round or rectangular table better for a small dining room?",
        "Round, in most cases — no corners to walk around, everyone reaches the middle, and it seats the same number in less floor space. Rectangular wins the moment one long side can sit flush against a wall, since that side then needs no pull-out clearance at all.",
      ],
      [
        "How much space do you need around a dining table?",
        "About 90cm from the table edge to the nearest wall or piece of furniture, so a chair can pull out and someone can walk behind a seated guest. Where nobody needs to pass behind — one side against a wall, say — 75cm is workable.",
      ],
      [
        "Do dining chairs need extra clearance beyond the table's own footprint?",
        "Yes — the 90cm clearance figure is measured from the table edge, not the chair back, precisely because a chair pulled out and someone standing behind it both eat into that space. A table that fits a room on paper can still feel tight if the clearance was only measured to the chair.",
      ],
    ],
  },
  {
    id: "guide-bed-size-and-storage",
    title: "King or super king, and is ottoman storage worth it?",
    slug: "bed-size-and-storage",
    excerpt:
      "UK king is 150 x 200cm, super king 180 x 200cm — the difference is roughly one shoulder's width. The room each size actually needs, what ottoman storage costs you in clearance, and eight of our own beds measured against both.",
    categoryId: "category-beds",
    relatedProductIds: BED_PRODUCT_IDS,
    seo: {
      title: "King or Super King, and Is Ottoman Storage Worth It? | Kaiku",
      description:
        "UK king is 150x200cm, super king 180x200cm — one shoulder's width apart. The room each needs, what ottoman storage costs in clearance, and 8 real beds measured.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "A UK king size bed is 150 x 200cm and wants a wall of at least 210cm to leave 60cm of walking clearance beside it, plus a room depth of around 260cm. A super king is 180 x 200cm and wants 240cm of wall and much the same depth — the extra 30cm of width is roughly one more shoulder's worth of room for two people sharing.",
      );
      p(
        "Ottoman storage changes a different part of the equation. The footprint is identical to a regular frame in the same size — what it needs is clearance in front to lift the lid fully, and a little more height between the mattress and the floor once the storage base underneath is counted.",
      );
      b.push(
        table(
          "b",
          n,
          "UK bed sizes and the room they need",
          ["Size", "Mattress", "Wall needed", "Room depth"],
          [
            ["Single", "90 x 190cm", "150cm", "250cm"],
            ["Double", "135 x 190cm", "195cm", "250cm"],
            ["King", "150 x 200cm", "210cm", "260cm"],
            ["Super King", "180 x 200cm", "240cm", "260cm"],
          ],
        ),
      );
      n += 1;
      b.push(tool("b", n, "bed-size", "Your wall, your room, your size"));
      n += 1;
      p(
        "Rule one. King to super king is one shoulder's width, not a room-size jump",
        "h2",
      );
      p(
        "The step from king to super king adds 30cm of width and nothing to the length. For two people sharing, that's genuinely felt — it's close to the space one more shoulder takes up across the bed, which matters most to anyone who gets disturbed by a partner moving in the night.",
      );
      p(
        "For a single sleeper the extra width mostly goes unused, and the room gives up floor space for a benefit nobody there is claiming. The decision is about the people in the bed, not the size of the room around it.",
      );
      p(
        "Rule two. Sixty centimetres to walk round it, ninety if it's also the way through",
        "h2",
      );
      p(
        "Any side you make the bed from or walk down wants at least 60cm of clear floor — below that you're making the bed side-on rather than standing square to it. If that same side is also the room's main route, the path from the door to a wardrobe, it wants 90cm instead, so someone can pass without brushing the mattress.",
      );
      p(
        "The headboard wall itself needs nothing extra — the bed sits flush against it. Every centimetre of clearance budget goes on the other three sides, mostly the two long sides and the foot of the bed, which is why two rooms of the same floor area can take a very different size of bed depending on their shape.",
      );
      p("Rule three. What ottoman storage actually costs you", "h2");
      p(
        "A gas-lift or hydraulic ottoman base holds several hundred litres under a hinged mattress platform, and the footprint doesn't change — a king ottoman bed takes the same floor space as a king regular frame. What it needs is room in front to lift the lid fully, typically the same 60–90cm this guide already budgets for that side, so a room that fits a regular frame in a given size usually fits the ottoman version too.",
      );
      p(
        "The trade-off is usually height and mechanism rather than footprint: an ottoman base sits a little taller than a divan, and a manual lift needs both hands free where a hydraulic one holds itself open. Check which mechanism a specific bed uses before assuming they're interchangeable.",
      );
      p("Eight of our beds, measured against the rules", "h2");
      p(
        "The same arithmetic, run over our own stock — regular frames and ottoman storage beds side by side, at a spread of sizes.",
      );
      b.push(
        table(
          "b",
          n,
          "Our beds, measured",
          ["Bed", "Size", "Storage"],
          [
            [
              "3ft Single Pine Storage Bed with Drawers",
              "Single",
              "Drawers under the frame",
            ],
            ["Loire White Double Bed", "Double", "None"],
            ["Hannah Beige Ottoman Double Bed", "Double", "Ottoman, gas-lift"],
            ["Loire White Kingsize Bed", "King", "None"],
            ["Hannah Grey Ottoman King Bed", "King", "Ottoman, gas-lift"],
            [
              "5ft King Bed Frame with Hydraulic Storage and LED Lighting",
              "King",
              "Ottoman, hydraulic",
            ],
            ["Loire White Super Kingsize Bed", "Super King", "None"],
            ["Parkside Grey Fabric Super Kingsize Bed", "Super King", "None"],
          ],
        ),
      );
      n += 1;
      p(
        "Read it as a straight comparison: the regular and ottoman versions of the same nominal size take the same wall and room depth from the table above, so the choice between them is genuinely just about whether you want the storage, not about whether the room can take it.",
      );
      p("The short version", "h2");
      p(
        "King is 150 x 200cm, super king 180 x 200cm — 30cm of extra width, no extra length. Leave 60cm to walk round or make the bed from, 90cm if that side is also the way through. Ottoman storage doesn't change the footprint, only the clearance you need in front to open it, which this guide already accounts for.",
      );
      return b;
    })(),
    faqs: [
      [
        "What is the difference between king and super king?",
        "30cm of width — 150cm against 180cm — with the same 200cm length. It's roughly one more shoulder's worth of room across the bed, which matters most for two people sharing and barely at all for someone sleeping alone.",
      ],
      [
        "How much room do you need around a super king bed?",
        "A wall of at least 240cm to leave 60cm of clearance beside the 180cm mattress, and a room depth of around 260cm from that wall — more if the foot of the bed doubles as the way to a door or wardrobe, which pushes the depth to roughly 290cm.",
      ],
      [
        "Does an ottoman bed need a bigger room than a regular bed frame?",
        "Not in width or length — the footprint is the same as a regular frame in the same size. What it needs is clearance in front to lift the lid fully, which is usually the same 60–90cm a regular bed already needs on that side to walk round it.",
      ],
      [
        "Is a super king worth it over a king size?",
        "For two people sharing, generally yes, if the room has the extra 30cm of wall to give it. For someone sleeping alone, the width mostly goes unused and a king makes better use of the same room.",
      ],
      [
        "How much storage does an ottoman bed actually hold?",
        "Several hundred litres in most king and super king ottoman frames — enough for bedding, seasonal clothing or spare pillows that would otherwise need a chest of drawers. The exact volume varies by model, so check the individual product's own specification rather than assuming a standard figure.",
      ],
    ],
  },
];

async function main() {
  const existing = await client.fetch<string[]>(
    `*[_type=="buyingGuide" && slug.current in $slugs].slug.current`,
    { slugs: GUIDES.map((g) => g.slug) },
  );
  if (existing.length)
    console.log(`Already present, skipping: ${existing.join(", ")}`);

  const results: Record<string, unknown>[] = [];

  for (const guide of GUIDES) {
    if (existing.includes(guide.slug)) continue;

    const chars = JSON.stringify(guide.body).length;
    console.log(`\n${guide.title}`);
    console.log(
      `   /learn/${guide.slug}   ${guide.body.length} body blocks, ~${chars} chars   ${guide.faqs.length} FAQs   ${guide.relatedProductIds.length} related products`,
    );

    results.push({
      slug: guide.slug,
      title: guide.title,
      bodyBlocks: guide.body.length,
      faqs: guide.faqs.length,
      relatedProducts: guide.relatedProductIds.length,
    });

    if (!apply) continue;

    await client.createOrReplace({
      _id: guide.id,
      _type: "buyingGuide",
      title: guide.title,
      slug: { _type: "slug", current: guide.slug },
      excerpt: guide.excerpt,
      body: guide.body,
      faqs: guide.faqs.map(([question, answer], i) => ({
        _key: `faq-${i}`,
        _type: "faqEntry",
        question,
        answer,
      })),
      author: { _type: "reference", _ref: AUTHOR_ID },
      relatedCategory: { _type: "reference", _ref: guide.categoryId },
      relatedProducts: guide.relatedProductIds.map((id, i) => ({
        _key: `rp-${i}`,
        _type: "reference",
        _ref: id,
      })),
      publishedAt: new Date().toISOString(),
      seo: {
        _type: "seo",
        metaTitle: guide.seo.title,
        metaDescription: guide.seo.description,
      },
    });
    console.log(`   created ${guide.id}`);
  }

  console.log(
    `\n${apply ? "Created" : "Would create"} ${results.length} buying guides.`,
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-03-create-buying-guides-batch1.json",
    `${JSON.stringify({ apply, results }, null, 2)}\n`,
  );

  if (!apply) console.log("\nDry run — re-run with --apply.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
