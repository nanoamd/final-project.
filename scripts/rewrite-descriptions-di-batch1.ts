/**
 * D.I. Designs description rewrite — batch 1 of 4.
 *
 * Damien: "completely rewrite every single description to be just as good as
 * the sauna and cold plunge descriptions", and on voice: "not too smart it
 * looks ai. humanize it keep that same raw feel from the originals".
 *
 * All 54 published D.I. Designs products sit in the description work queue
 * (`scripts/list-description-work-queue.ts --supplier "D.I. Designs"`) — every
 * one of them THIN or BARE. The earlier pass
 * (`rewrite-descriptions-aosom-di-batch1.ts`) stripped the supplier marketing
 * copy but left short spec-sheet stubs: "Storage — One drawer." That cleared
 * the voice problem without reaching the standard.
 *
 * This series rewrites them against the SaunaPlunge reference: 4–6 sections,
 * 150–250 words, every fact carrying its consequence, headings named after the
 * actual thing being described rather than "Features" or "Specifications".
 *
 * The source is each product's own `dimensions`, `weight`, `specs` (including
 * packed size and packed weight) and — mostly — its own FAQ answers, which for
 * this supplier are unusually detailed: materials, runner type, assembly state,
 * shelf configuration, care, and natural wood variation, product by product.
 * Nothing here comes from anywhere else. Where a FAQ only hedges (the Elmley
 * coffee table's glass is described as "durable glass ... for everyday
 * residential use" and never confirmed as tempered), the claim is left out
 * rather than softened — no section admits a gap.
 *
 * Dropped from every product, because none of it is a per-product fact: the
 * "Which interior styles does this suit?" lists, the "suitable for boutique
 * hotels" commercial-use pitch, the "Why choose Kaiku?" answer, and the
 * identical doorstep/pallet delivery boilerplate that already renders
 * elsewhere on the product page.
 *
 * Batch 1: the seven coffee tables, then the Abberley collection (console,
 * bedside, sideboard, chest, desk, end table) and the two Alton pieces.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-di-batch1.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-di-batch1.ts --apply
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
interface Written {
  id: string;
  title: string;
  summary: string;
  sections: Section[];
}

export const REWRITES: Written[] = [
  {
    id: "product-di-di-abberley-ct-br",
    title: "Abberley Coffee Table in Brown | Kaiku",
    summary:
      "A brown coffee table in solid oak and oak veneer with a tempered glass top and an open shelf underneath. 110 x 50 x 40cm (W x D x H) and 25kg, with the legs to attach on arrival.",
    sections: [
      {
        heading: "Oak Frame and Tempered Glass Top",
        paragraphs: [
          "Solid oak and oak veneer in a brown stained finish, topped with tempered safety glass — that's significantly stronger and more resistant to everyday knocks than standard glass, which matters on a surface that takes mugs, feet and the odd dropped remote.",
        ],
      },
      {
        heading: "The Lower Shelf",
        paragraphs: [
          "An open shelf sits below the glass, so books, magazines and remotes have somewhere to live other than the top.",
        ],
      },
      {
        heading: "Attaching the Legs",
        paragraphs: [
          "Assembly is minimal — the legs attach using the fittings and instructions supplied, so it's a short job rather than a flat-pack build.",
        ],
      },
      {
        heading: "110 x 50cm, and a Two-Person Lift",
        paragraphs: [
          "110 x 50 x 40cm (W x D x H) and 25kg. That's a two-person lift, so have someone with you on delivery day.",
        ],
      },
      {
        heading: "Oak Grain and Colour Variation",
        paragraphs: [
          "It's natural oak and oak veneer, so the grain and tone shift from one table to the next. That's the material rather than a fault, and it's why yours won't be an exact match for the photographs.",
        ],
      },
      {
        heading: "Cleaning the Glass and the Oak",
        paragraphs: [
          "Glass cleaner and a soft microfibre cloth for the top; dust the oak and wipe it with a barely damp cloth. Keep abrasive cleaners and standing water off the frame, and use coasters for hot drinks.",
        ],
      },
    ],
  },
  {
    id: "product-di-di-bentley-ct-oak",
    title: "Bentley Coffee Table in Oak | Kaiku",
    summary:
      "A square coffee table in grey aged oak and oak veneer on a crossed-leg metal base, with three removable trays set into the top. 120 x 120 x 45cm and 22kg.",
    sections: [
      {
        heading: "Grey Aged Oak on a Crossed-Leg Base",
        paragraphs: [
          "Built from grey aged oak and oak veneer with the natural grain left visible, set on a crossed-leg metal base.",
        ],
      },
      {
        heading: "Three Removable Trays",
        paragraphs: [
          "The top holds three trays that lift out one at a time. You can carry drinks through on one rather than balancing them, and take a tray to the sink instead of wiping around whatever's sitting on the table.",
        ],
      },
      {
        heading: "A 120cm Square Footprint",
        paragraphs: [
          "120 x 120 x 45cm, so it wants a decent amount of floor and suits a square seating arrangement rather than a narrow room. At 22kg most people can shift it alone, though it's easier with two.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: ["Some light assembly, with full instructions supplied."],
      },
      {
        heading: "Oak Grain and Colour Variation",
        paragraphs: [
          "Oak is a natural material, so grain pattern, colour and texture differ slightly from table to table.",
        ],
      },
      {
        heading: "Everyday Care",
        paragraphs: [
          "Wipe with a soft damp cloth and dry it straight away. Harsh cleaning chemicals and standing water are the two things to keep off it.",
        ],
      },
    ],
  },
  {
    id: "product-di-di-crofton-ct-wh",
    title: "Crofton White Marble Coffee Table | Kaiku",
    summary:
      "A round coffee table with a white marble-effect recycled glass top on a gold-painted steel frame. 100cm across, 37cm tall and 16kg, delivered fully assembled.",
    sections: [
      {
        heading: "Marble Effect, Not Marble",
        paragraphs: [
          "The top isn't stone. It's recycled glass printed with a white marble effect, so you get the look of marble on a surface that wipes clean and doesn't need the upkeep stone does.",
        ],
      },
      {
        heading: "Painted Steel Frame",
        paragraphs: [
          "The base is painted steel in a gold finish — solid metal rather than a coated board, which is where the strength comes from.",
        ],
      },
      {
        heading: "100cm Round, 37cm High",
        paragraphs: [
          "100cm across and 37cm tall, weighing 16kg. Round means no corners to catch a shin in a busy room, and at 37cm it sits low against most sofa seats.",
        ],
      },
      {
        heading: "No Assembly",
        paragraphs: [
          "It arrives fully assembled. Unbox it, put it where you want it, and that's the job done.",
        ],
      },
      {
        heading: "Cleaning the Top",
        paragraphs: [
          "A soft damp cloth is all it needs. Abrasive cleaners and harsh chemicals will damage the printed finish, so leave those alone.",
        ],
      },
    ],
  },
  {
    id: "product-di-di-elmley-ct-iv",
    title: "Elmley Coffee Table in Ivory | Kaiku",
    summary:
      "A rectangular coffee table with a clear glass top, an ivory faux shagreen base and an antique-style brass surround. 120 x 80 x 35.5cm and 19kg.",
    sections: [
      {
        heading: "What Faux Shagreen Is",
        paragraphs: [
          "The base is wrapped in faux shagreen — a textured finish that takes its pebbled pattern from traditional shagreen leather, in ivory. Being a man-made finish rather than a hide, it takes a wipe-down without any special treatment.",
        ],
      },
      {
        heading: "Glass Top and Brass Surround",
        paragraphs: [
          "A clear glass top sits inside an antique-style brass surround, so the edge you brush past is metal rather than bare glass. The glass being clear rather than smoked means the ivory base reads through it, which is the point of the thing — hide the base under a tinted top and you've lost the texture you paid for.",
        ],
      },
      {
        heading: "120 x 80cm, and Low at 35.5cm",
        paragraphs: [
          "120 x 80 x 35.5cm and 19kg. That's a broad rectangle at a low height — 35.5cm sits below the seat cushion on most sofas, so it reads as a low table rather than a chunky block in the middle of the room. One person can reposition it.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "Minimal assembly, with the fittings supplied. Nothing here is a flat-pack build.",
        ],
      },
    ],
  },
  {
    id: "product-di-di-overbury-ct",
    title: "Overbury Coffee Table in Chocolate Brown | Kaiku",
    summary:
      "A rectangular coffee table with a chocolate brown wood-veneer top, a brushed gold seam across it and a geometric gold-painted steel base. 110 x 80 x 38cm and 25kg.",
    sections: [
      {
        heading: "Veneer Over MDF, Not Solid Timber",
        paragraphs: [
          "The top is MDF finished in a wood veneer. You get real timber grain on a board that stays flatter and more stable than a solid slab would, though it isn't solid wood and we'd rather say so than imply otherwise.",
        ],
      },
      {
        heading: "The Gold Seam",
        paragraphs: [
          "A brushed gold seam runs across the top. It's a decorative detail and the thing the Overbury pieces are known for.",
        ],
      },
      {
        heading: "Geometric Steel Base",
        paragraphs: [
          "The frame is gold-painted steel in a geometric shape, taking the weight of the top on metal rather than timber legs.",
        ],
      },
      {
        heading: "110 x 80cm, and a Two-Person Lift",
        paragraphs: [
          "110 x 80 x 38cm and 25kg — heavy enough that you'll want help carrying it through, so have someone about on delivery day.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: ["Some light assembly, with full instructions in the box."],
      },
    ],
  },
  {
    id: "product-di-di-pershore-ct-oak",
    title: "Pershore Rectangular Aged Oak Coffee Table | Kaiku",
    summary:
      "A rectangular coffee table in aged oak with a raised edge, set on blackened crossed metal legs. 110 x 80 x 40cm and 21kg.",
    sections: [
      {
        heading: "Aged Oak with a Raised Edge",
        paragraphs: [
          "The top is oak and oak veneer in an aged finish, with a raised lip running round the edge — enough to stop a rolling glass or a stray remote going straight off the side.",
        ],
      },
      {
        heading: "Powder-Coated Crossed Legs",
        paragraphs: [
          "The base is crossed steel legs in black, powder-coated rather than painted. Powder coating is baked onto the metal, so it holds up to scuffs and knocks better than a brushed-on finish — which matters on a coffee table base, the part of the room that gets kicked and vacuumed into.",
        ],
      },
      {
        heading: "110 x 80cm, 40cm High",
        paragraphs: [
          "110 x 80 x 40cm and 21kg. At 80cm deep this is a wide table rather than a narrow one, so it fills the space in front of a three-seater instead of looking lost there. Most people can manage 21kg on their own, though it's an awkward carry solo at 110cm long.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "Minimal assembly, and full instructions are included — the legs are the only real job.",
        ],
      },
    ],
  },
  {
    id: "product-di-di-witley-ct-oak",
    title: "Witley Coffee Table | Kaiku",
    summary:
      "A coffee table in grey aged oak with natural rattan detailing and a tempered glass top, with an open shelf underneath. 115 x 58 x 40cm and 17kg.",
    sections: [
      {
        heading: "Oak, Rattan and Tempered Glass",
        paragraphs: [
          "Grey aged oak with natural rattan detailing, under a tempered glass top. Tempered glass is heat-treated to be stronger and more durable than standard glass, which is what you want on a surface in daily household use.",
        ],
      },
      {
        heading: "The Open Shelf",
        paragraphs: ["An open shelf runs underneath the glass top."],
      },
      {
        heading: "115 x 58cm — Narrow for Its Length",
        paragraphs: [
          "115 x 58 x 40cm and 17kg. At 58cm deep it's narrower than most tables of that length, which helps when the gap between sofa and television is tight. One person can move it.",
        ],
      },
      {
        heading: "Attaching the Legs",
        paragraphs: [
          "Minimal assembly — the legs attach with the fittings and instructions supplied.",
        ],
      },
      {
        heading: "Care, and Variation in the Oak",
        paragraphs: [
          "Glass cleaner and a microfibre cloth on the top; dust the oak and wipe spills promptly with a lightly damp cloth. Don't stand anything very hot straight on the surface. Grain, veneer and finish vary between tables — that's the timber, not a defect.",
        ],
      },
      {
        heading: "Warranty",
        paragraphs: [
          "This one comes without a manufacturer's warranty. Your statutory rights under UK consumer law still apply.",
        ],
      },
    ],
  },
  {
    id: "product-import-abberley-1-drawer-black-console-table",
    title: "Abberley One Drawer Black Console Table | Kaiku",
    summary:
      "A black console table with one drawer, made from solid oak and oak veneer. 120cm wide but only 30cm deep, 85cm high and 15kg.",
    sections: [
      {
        heading: "Solid Oak and Oak Veneer in Black",
        paragraphs: [
          "Solid oak and oak veneer under a black finish — timber rather than a board with a printed wrap.",
        ],
      },
      {
        heading: "Only 30cm Deep",
        paragraphs: [
          "Front to back it's 30cm, shallow enough for a hallway where a normal table has you turning sideways to get past. At 120cm long it also works behind a sofa in an open-plan room.",
        ],
      },
      {
        heading: "The Drawer",
        paragraphs: [
          "One drawer, which is where keys, post and chargers end up.",
        ],
      },
      {
        heading: "Weight and Packed Size",
        paragraphs: [
          "15kg assembled, so one person can carry it in. It ships in a box around 127 x 37 x 93cm — worth measuring the stairs or the lift if it's going up.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "Depending on how it ships there may be a little assembly to do; the fittings and instructions come with it.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Dust with a soft cloth and wipe spills as they happen. Abrasive cleaners and standing moisture are what damage the finish.",
        ],
      },
    ],
  },
  {
    id: "product-import-abberley-2-drawer-white-bedside-table",
    title:
      "Abberley White Bedside Table | Luxury 2 Drawer Bedside Table | Kaiku",
    summary:
      "A white bedside table with two drawers, made from solid oak and oak veneer with the grain still visible through the paint. 45 x 40 x 60cm and 16kg.",
    sections: [
      {
        heading: "Painted Oak with the Grain Showing",
        paragraphs: [
          "Solid oak and oak veneer, painted white with the natural grain still reading through rather than filled flat.",
        ],
      },
      {
        heading: "Two Drawers on Metal Runners",
        paragraphs: [
          "Both drawers run on metal runners rather than wood on wood, so they keep pulling out smoothly once they're loaded.",
        ],
      },
      {
        heading: "Curved Fronts, Tapered Legs, Gold Handles",
        paragraphs: [
          "The drawer fronts are curved, the legs tapered, and the handles are square in a gold colour.",
        ],
      },
      {
        heading: "45 x 40 x 60cm",
        paragraphs: [
          "45cm wide, 40cm deep, 60cm high and 16kg — carryable on your own, easier with help. It ships in a box around 52 x 47 x 68cm.",
        ],
      },
      {
        heading: "The Handles Go On",
        paragraphs: [
          "It arrives largely built. Fitting the handles is the main thing left, and it's quick with the fittings supplied.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "A soft dry or barely damp cloth for regular cleaning, spills wiped straight away, and nothing abrasive on the paint.",
        ],
      },
    ],
  },
  {
    id: "product-import-abberley-black-sideboard",
    title: "Abberley Black Oak Sideboard | Luxury 4 Door Sideboard | Kaiku",
    summary:
      "A black-stained oak sideboard with four ribbed doors and removable internal shelves, made from solid oak and oak veneer. 160 x 45 x 80cm and 58kg.",
    sections: [
      {
        heading: "Stained Black, Not Painted Out",
        paragraphs: [
          "Solid oak and oak veneer in a black stain. Stain soaks in rather than sitting on top, so the grain still shows through the colour instead of disappearing under it.",
        ],
      },
      {
        heading: "Ribbed Doors and Brass-Style Hardware",
        paragraphs: [
          "Four ribbed door fronts, tapered legs and brass-style hardware.",
        ],
      },
      {
        heading: "Shelves That Lift Out",
        paragraphs: [
          "The internal shelves are removable, so a tall bottle or a stack of platters gets a full-height space rather than having to fit round a fixed shelf.",
        ],
      },
      {
        heading: "160cm Wide and 58kg",
        paragraphs: [
          "160 x 45 x 80cm and 58kg — a two-person lift, and the carton is bigger again at roughly 168.5 x 54 x 90cm and 67kg. Measure the doorway and the turn at the top of the stairs before delivery day.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Dust with a dry or slightly damp cloth and deal with spills quickly. Nothing abrasive on the stain.",
        ],
      },
    ],
  },
  {
    id: "product-import-abberley-white-chest-of-drawers",
    title: "Abberley White Chest of Drawers | Luxury 3 Drawer Chest | Kaiku",
    summary:
      "A white chest of three drawers in solid oak and oak veneer, with curved fronts and gold-coloured handles. 90 x 45 x 85cm and 44kg, delivered assembled.",
    sections: [
      {
        heading: "White-Stained Oak",
        paragraphs: [
          "Solid oak and oak veneer in a white stain, which leaves the grain visible beneath the colour rather than covering it over.",
        ],
      },
      {
        heading: "Three Drawers on Metal Runners",
        paragraphs: [
          "Three drawers, all on metal runners, so they still run smoothly with a full load of clothes or bedding in them.",
        ],
      },
      {
        heading: "Curved Fronts and Brushed Gold Handles",
        paragraphs: [
          "The drawer fronts are curved and the handles are square, in a brushed gold colour.",
        ],
      },
      {
        heading: "Delivered Assembled — What That Means on the Day",
        paragraphs: [
          "It arrives built, which saves you the job but means it comes in as one 44kg piece rather than a flat box. The carton is around 96.5 x 52 x 92.5cm at 48kg, and it's a two-person lift.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Dust with a dry or slightly damp cloth and wipe spills immediately. Harsh chemicals and abrasive cleaners will mark the painted finish.",
        ],
      },
    ],
  },
  {
    id: "product-import-abberley-white-desk",
    title: "Abberley White Desk | Luxury Oak Home Office Desk | Kaiku",
    summary:
      "A white-stained solid oak desk with two drawers, 120 x 50 x 76cm and 15kg. The legs are supplied separately and attach on arrival.",
    sections: [
      {
        heading: "White-Stained Oak with Visible Grain",
        paragraphs: [
          "Solid oak and oak veneer in a white stain, with the grain still showing through, a curved front and legs, and cut-line detailing along the drawers.",
        ],
      },
      {
        heading: "A 120 x 50cm Work Surface",
        paragraphs: [
          "120cm across and 50cm deep gives you room for a laptop and a monitor without the keyboard hanging over the front edge, at a working height of 76cm.",
        ],
      },
      {
        heading: "Two Drawers",
        paragraphs: [
          "Two drawers on metal runners, sized for stationery, paperwork and the everyday clutter of a desk.",
        ],
      },
      {
        heading: "The Legs Attach First",
        paragraphs: [
          "The legs come separate and go on using the instructions in the box. The whole desk is only 15kg, so you can do it yourself on the floor and stand it up after.",
        ],
      },
      {
        heading: "Packed Size",
        paragraphs: [
          "The carton is around 127 x 57 x 83.5cm at 18kg — long rather than heavy, so mind the corners on the way up.",
        ],
      },
    ],
  },
  {
    id: "product-import-abberley-white-end-table",
    title: "Abberley White End Table | Luxury Oak Side Table | Kaiku",
    summary:
      "A white painted end table in solid oak and oak veneer, with two open shelves. 40 x 40 x 60cm and 13kg.",
    sections: [
      {
        heading: "Painted Oak with a Curved Front",
        paragraphs: [
          "Solid oak and oak veneer, painted white with the natural grain still visible, a curved front and tapered legs.",
        ],
      },
      {
        heading: "Two Open Shelves",
        paragraphs: [
          "Storage here is two open shelves rather than a drawer, so whatever you put there is on show. Books and a basket work; the things you'd rather not look at don't.",
        ],
      },
      {
        heading: "40cm Square, 60cm Tall",
        paragraphs: [
          "40 x 40 x 60cm and 13kg. It's tall for its footprint: at 60cm the top sits above the arm of most sofas rather than below it, which suits a lamp better than a mug you're reaching for without looking. Light enough to move around the room on your own.",
        ],
      },
      {
        heading: "Packed Size",
        paragraphs: [
          "The carton is roughly 45 x 45 x 68cm at 16kg — a compact box, so no trouble through a normal doorway.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "A soft dry or slightly damp cloth, spills wiped straight away, and nothing abrasive on the paint.",
        ],
      },
    ],
  },
  {
    id: "product-import-alton-white-chest-of-drawers",
    title: "Alton White Chest of Drawers | Luxury 3 Drawer Birch Chest | Kaiku",
    summary:
      "A white chest of three drawers in birch and MDF, with tapered legs and brass-style handles. 90 x 45 x 75cm and 22kg, delivered fully assembled.",
    sections: [
      {
        heading: "Birch and MDF Under White Paint",
        paragraphs: [
          "Birch wood and MDF with a white painted finish, on tapered legs, with cut-line detailing and brass-style handles.",
        ],
      },
      {
        heading: "Wooden Runners, Not Metal",
        paragraphs: [
          "The three drawers run on traditional wooden runners rather than metal ones — worth knowing if you're used to the glide of a ball-bearing runner, because these slide differently.",
        ],
      },
      {
        heading: "Delivered Fully Assembled",
        paragraphs: [
          "It comes built, so nothing to put together. It also means it arrives as one piece: 22kg in a carton around 95 x 50 x 80cm at 25kg. One person can do it, two is easier through a doorway.",
        ],
      },
      {
        heading: "90 x 45 x 75cm",
        paragraphs: [
          "90cm wide, 45cm deep and 75cm high — low enough to take a lamp or a mirror above it without the two fighting for the same wall.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Dust with a dry or slightly damp cloth and wipe spills immediately. Avoid abrasive cleaning products on the paint.",
        ],
      },
    ],
  },
  {
    id: "product-import-alton-white-console-table",
    title:
      "Alton White Console Table | Luxury 3 Drawer Birch Console Table | Kaiku",
    summary:
      "A white console table with three drawers, made from birch and MDF with tapered legs and brass-style handles. 100 x 45 x 76cm and 20kg.",
    sections: [
      {
        heading: "Birch and MDF Under White Paint",
        paragraphs: [
          "Birch wood and MDF finished in white paint, with tapered legs, cut-line detailing and brass-style handles.",
        ],
      },
      {
        heading: "Three Drawers on Wooden Runners",
        paragraphs: [
          "Three drawers, running on traditional wooden runners rather than metal ones.",
        ],
      },
      {
        heading: "45cm Deep — Check Your Hallway",
        paragraphs: [
          "100 x 45 x 76cm. At 45cm front to back this is a deeper console than the hallway-slim sort, so it gives you a usable surface but wants a bit more room to walk past.",
        ],
      },
      {
        heading: "Weight and Packed Size",
        paragraphs: [
          "20kg assembled, in a carton around 105 x 50 x 81cm at 22kg. Manageable on your own, easier with help.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Dust with a dry or slightly damp cloth, wipe spills immediately, and keep abrasive cleaning products away from the painted surface.",
        ],
      },
    ],
  },
];

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

function keyFor(id: string): string {
  return id.replace(/[^a-z0-9]+/g, "-").slice(0, 40);
}

async function main() {
  const results: {
    id: string;
    title: string;
    found: boolean;
    sections: number;
    words: number;
  }[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const written of REWRITES) {
    const doc = await client.fetch<{ _id: string } | null>(
      `*[_id == $id][0]{_id}`,
      { id: written.id },
    );
    const words = written.sections
      .flatMap((s) => [s.heading, ...s.paragraphs])
      .join(" ")
      .trim()
      .split(/\s+/).length;
    results.push({
      id: written.id,
      title: written.title,
      found: !!doc,
      sections: written.sections.length,
      words,
    });
    if (!doc) continue;
    if (apply) {
      transaction.patch(written.id, (p) =>
        p.set({
          description: toBlocks(written.sections, keyFor(written.id)),
          summary: written.summary,
        }),
      );
      queued += 1;
    }
  }

  console.table(results);

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-01-rewrite-descriptions-di-batch1.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
