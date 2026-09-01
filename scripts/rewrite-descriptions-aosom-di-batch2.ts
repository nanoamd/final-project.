/**
 * Damien: "completely rewrite every single description to be just as good as
 * the sauna and cold plunge descriptions with the nice bolder headers" — with
 * a follow-up correction: match the sauna/plunge pages' DENSITY of real
 * information, not just their section count. Mine every field on the
 * document, not only dimensions/weight/materials.
 *
 * Batch 2 of the Aosom / D.I. Designs description rewrite — the first 15 of
 * 92 Aosom products whose existing description carried Aosom's own
 * auto-generated template: real facts, but organised into `listItem` bullet
 * blocks and a raw "Specifications" dump that just re-lists numbers already
 * stated elsewhere, plus a "Features" section that mixes genuine facts
 * (drawer counts, folding thickness, LED colour count) with pure sales
 * adjectives ("Stunning", "Elegant", "Sturdy").
 *
 * Every section below is rebuilt from this exact document's own `specs`,
 * `dimensions`, `weight` and `deliveryLeadTime` — including facts that were
 * previously buried only in a bullet list or a "Features" paragraph (LED
 * colours, USB ports, folding thickness, drawer interior sizes, weight
 * capacity vs item weight). Nothing here is inferred beyond what the
 * document already states. Two data notes worth recording:
 *
 * - Several Aosom bed frames have their generic `weight` field populated
 *   with the WEIGHT CAPACITY number, not the item's own weight (e.g.
 *   831-804v70cw's `weight` is 500 — identical to its "Weight Capacity: 500
 *   kg" spec, for an item that plainly does not weigh 500kg itself). Rather
 *   than repeat that as "weighing 500kg", every capacity figure below is
 *   written as a capacity, and no invented item weight is added where the
 *   document doesn't separately give one.
 * - `deliveryLeadTime` is null on several of these (the four beds imported
 *   under 83d-*) — no Delivery section is written for those; nothing is
 *   guessed to fill it.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-aosom-di-batch2.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-aosom-di-batch2.ts --apply
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
    id: "product-aosom-02-0302",
    title: "Glass Droplet Pendant Chandelier, Chrome | Kaiku",
    summary:
      "A crystal pendant chandelier with a polished chrome finish and an adjustable drop, taking a GU10 bulb. 30cm diameter x 120cm and 4.5kg.",
    sections: [
      {
        heading: "Electrical and Fitting",
        paragraphs: [
          "Hard-wired directly to a ceiling rose rather than plugged into a socket, so installation should be carried out by a qualified electrician. It's controlled with a push-button switch and takes a GU10 bulb, maximum wattage 50W — the bulb itself isn't included.",
        ],
      },
      {
        heading: "Materials and Design",
        paragraphs: [
          "Made from crystal with a polished chrome finish, with multiple hanging crystal droplets. The drop is adjustable, so the height can be set to suit the ceiling.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["30cm diameter x 120cm height, weighing 4.5kg."],
      },
      {
        heading: "Assembly and Use",
        paragraphs: [
          "Assembly is required; the box contains the ceiling light and an installation manual. Rated for indoor use only.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 7–14 days."] },
    ],
  },
  {
    id: "product-aosom-831-804v70cw",
    title: "4ft6 Double Ottoman Bed with Front Drawer, Cream | Kaiku",
    summary:
      "A double ottoman bed frame in cream, built from eucalyptus wood with a powder-coated finish and polyester upholstery. Gas-lift storage plus a front drawer; weight capacity 500kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Built from eucalyptus wood with a powder-coated finish, upholstered in polyester. Ships flat-packed in 2 cartons and requires assembly.",
        ],
      },
      {
        heading: "Storage and Headboard",
        paragraphs: [
          "A gas-lift mechanism opens 140 x 193.5cm of under-bed storage, with a front drawer on wheels for additional access. The headboard is a two-level adjustable, velvet-feel design.",
        ],
      },
      {
        heading: "Dimensions and Capacity",
        paragraphs: [
          "Overall dimensions are 140cm wide x 193.5cm deep x 95/104cm high, for a 135 x 190cm double mattress. The headboard is 140cm wide; the front drawer measures 86 x 40 x 15cm. Weight capacity is 500kg.",
        ],
      },
      { heading: "Care", paragraphs: ["Wipe with a dry cloth."] },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-aosom-836-046wt",
    title: "Modern Writing Desk with Storage Shelf, White Wood Grain | Kaiku",
    summary:
      "A writing desk in white wood grain, made from particle board with a laminated finish and an under-desk storage shelf. 90 x 50 x 74cm, weight capacity 80kg.",
    sections: [
      {
        heading: "Materials and Finish",
        paragraphs: [
          "Made from particle board with a white wood grain laminated finish. Tabletop thickness is 1.5cm.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: ["An under-desk shelf measures 85 x 33 x 10cm."],
      },
      {
        heading: "Dimensions and Weight Capacity",
        paragraphs: [
          "Overall dimensions are 90 x 50 x 74cm (W x D x H), with a weight capacity of 80kg.",
        ],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "Arrives flat-packed and requires assembly; the box contains the desk and an assembly manual. Wipe with a dry cloth — avoid wet cloths, which can damage the laminated finish.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 7–14 days."] },
    ],
  },
  {
    id: "product-aosom-836-068v02bk",
    title: "Computer Desk with Three Shelves and Drawers, Black | Kaiku",
    summary:
      "A black computer desk with three open shelves and a drawer, made from particle board with a melamine finish. 120 x 49 x 72cm, item weight 22kg.",
    sections: [
      {
        heading: "Materials and Finish",
        paragraphs: [
          "Made from particle board with a melamine finish and a black laminated top.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: [
          "Open shelves measure 36.5 x 24 x 21.5cm; the drawer has an interior depth of 28.5cm, interior width of 28.5cm and interior height of 10cm.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "Overall dimensions are 120 x 49 x 72cm (L x D x H). Item weight is 22kg; the desk has a weight capacity of 20kg.",
        ],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "Ships flat-packed in a single carton and requires assembly. Wipe with a dry cloth to keep the finish clean.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 7–14 days."] },
    ],
  },
  {
    id: "product-aosom-836-263gy",
    title: "Computer Desk with Sliding Keyboard Tray, Grey | Kaiku",
    summary:
      "A grey computer desk with a sliding keyboard tray and a drawer, made from E1 grade particle board with a melamine finish. 100 x 40 x 86.6cm, weight capacity 50kg.",
    sections: [
      {
        heading: "Materials and Finish",
        paragraphs: [
          "Made from E1 grade particle board with a melamine finish.",
        ],
      },
      {
        heading: "Dimensions and Fittings",
        paragraphs: [
          "Overall dimensions are 100cm wide x 40cm deep x 86.6cm high. The sliding keyboard tray measures 67.3 x 25cm; the drawer's interior is 23 x 37.8 x 31.2cm.",
        ],
      },
      {
        heading: "Weight Capacity",
        paragraphs: [
          "The desk has a weight capacity of 50kg; the drawer is rated to 20kg.",
        ],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "Ships flat-packed in a single carton and requires assembly. Wipe down with a damp cloth followed by a dry cloth.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 2–3 weeks."] },
    ],
  },
  {
    id: "product-aosom-836-296cg",
    title: "Folding Convertible Desk with Blackboard, Grey | Kaiku",
    summary:
      "A folding 3-in-1 desk in grey, combining a bookcase, work area and chalkboard panel. Made from MDF with a painted finish. 153 x 98 x 51cm, maximum load 60kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Made from MDF with a painted finish; the frame structure uses particleboard reinforced with metal hinges. It's designed as a 3-in-1 unit — an end bookcase, a central work area and a chalkboard panel — and folds away into the bookcase when not in use.",
        ],
      },
      {
        heading: "Dimensions and Knee Space",
        paragraphs: [
          "Overall dimensions are 153cm high x 98cm wide x 51cm deep. The working surface is 78.5 x 47.5cm, with knee space of 75cm height and 98cm width. The bookcase has 9 compartments.",
        ],
      },
      {
        heading: "Weight Limits",
        paragraphs: [
          "Maximum load is 60kg overall, with the tabletop rated to 50kg.",
        ],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "Ships flat-packed in one carton and requires assembly, including fixings for anti-tip wall-mounting. Wipe down with a dry cloth.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 2–3 weeks."] },
    ],
  },
  {
    id: "product-aosom-836-410v00gy",
    title: "Compact Computer Desk with Keyboard Tray, Grey | Kaiku",
    summary:
      "A compact grey computer desk with a keyboard tray and drawer, made from E1 grade particle board with a melamine finish. 80 x 45 x 75cm, weight capacity 50kg.",
    sections: [
      {
        heading: "Materials and Finish",
        paragraphs: [
          "Made from E1 grade particle board with a melamine finish.",
        ],
      },
      {
        heading: "Dimensions and Storage",
        paragraphs: [
          "Overall dimensions are 80cm long x 45cm wide x 75cm high. The keyboard tray measures 46 x 30cm; the internal drawer is 28cm deep, 18.5cm wide and 6.5cm high.",
        ],
      },
      {
        heading: "Weight Capacity",
        paragraphs: [
          "The desk supports up to 50kg; the drawer is rated to 3kg.",
        ],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "Requires assembly on delivery. Wipe with a damp cloth — avoid harsh chemicals, which can damage the finish.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 7–14 days."] },
    ],
  },
  {
    id: "product-aosom-836-580v00rb",
    title: "Compact Folding Desk with Storage Shelf, Rustic Brown | Kaiku",
    summary:
      "A folding desk in rustic brown, built from particleboard on a steel frame with a maple wood-effect top, folding flat to 4.5cm. 86 x 66 x 82cm, weight capacity 20kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Built from particleboard on a steel frame, with a maple wood-effect laminated top. The frame uses an X-shaped metal structure with reinforced bottom bars, and folds flat to 4.5cm thick for storage.",
        ],
      },
      {
        heading: "Dimensions and Storage",
        paragraphs: [
          "Overall dimensions are 86cm wide x 66cm deep x 82cm high. The work surface is 80 x 51cm; knee space is 69cm high, 73.5cm wide and 66cm deep. An upper shelf measures 80cm long x 15cm deep.",
        ],
      },
      {
        heading: "Weight Capacity",
        paragraphs: [
          "Total weight capacity is 20kg — 15kg on the tabletop, 5kg on the shelf. Item weight is 10kg.",
        ],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "Ships flat-packed in one carton and requires assembly. Wipe with a dry cloth to keep it clean.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 2–3 weeks."] },
    ],
  },
  {
    id: "product-aosom-836-668v01nd",
    title: "Folding Wall-Mounted Work Table, Natural | Kaiku",
    summary:
      "A fold-down work table combined with a 4-tier bookshelf, in a natural wood-effect finish on a powder-coated steel frame. 105 x 60 x 127cm, weight capacity 80kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Built from particleboard with a wood-effect finish, on a powder-coated steel frame. It combines a 4-tier bookshelf with a fold-down work table; adjustable feet keep it level.",
        ],
      },
      {
        heading: "Dimensions",
        paragraphs: [
          "Overall dimensions are 105cm wide x 60cm deep x 127cm high; the tabletop is 80 x 56.8cm. Folded, it reduces to 30 x 60 x 127cm.",
        ],
      },
      {
        heading: "Weight Capacity",
        paragraphs: ["Weight capacity is 80kg; item weight is 21kg."],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "Ships flat-packed in one carton and requires assembly. Wipe with a dry cloth.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 2–3 weeks."] },
    ],
  },
  {
    id: "product-aosom-83a-218v00nd",
    title: "6-Seater Garden Dining Set with Stackable Chairs | Kaiku",
    summary:
      "A 6-seater garden dining set in aluminium and wood-plastic composite: one rectangular table and six stackable armchairs. Table 85 x 160 x 75cm, combined weight 53kg.",
    sections: [
      {
        heading: "What's Included",
        paragraphs: [
          "One rectangular dining table and six stackable armchairs, with an instruction manual.",
        ],
      },
      {
        heading: "Materials and Construction",
        paragraphs: ["Made from aluminium and wood-plastic composite."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "The table measures 85cm wide x 160cm long x 75cm high. Combined weight is 53kg, shipped in 2 packages.",
        ],
      },
      {
        heading: "Weight Capacity",
        paragraphs: [
          "The table is rated to 50kg; each chair is rated to 120kg.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-aosom-83d-032v00gy",
    title: "3ft Single Pine Storage Bed with Drawers, Grey | Kaiku",
    summary:
      "A single storage bed in pine wood with a painted finish, with two wheeled drawers under a slatted frame. 197 x 98 x 82cm, weight capacity 120kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Made from pine wood with a painted finish, on a slatted frame that supports the mattress without needing a box spring.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: [
          "Two wheeled drawers are built into the frame, each with an interior of 86 x 42 x 12.5cm.",
        ],
      },
      {
        heading: "Dimensions and Capacity",
        paragraphs: [
          "Overall dimensions are 197cm long x 98cm wide x 82cm high, for a 3ft (90 x 190cm) mattress. Weight capacity is 120kg.",
        ],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "Ships flat-packed in 2 cartons and requires assembly. Wipe with a dry cloth.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-83d-149v72cg",
    title: "King Size Gas-Lift Ottoman Bed with Tufted Headboard | Kaiku",
    summary:
      "A king-size gas-lift ottoman bed with a metal frame, frosted velvet upholstery and a button-tufted headboard filled with high-density foam. 205 x 151 x 106cm, weight capacity 500kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A metal frame upholstered in frosted velvet (polyester) with a matte finish. The button-tufted headboard is filled with high-density foam.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: [
          "A gas-lift mechanism opens under-bed storage; two anti-slip stoppers hold the mattress in place, and the closed headboard design stops items falling behind it.",
        ],
      },
      {
        heading: "Dimensions and Capacity",
        paragraphs: [
          "Overall dimensions are 205cm long x 151cm wide x 106cm high, for a 150 x 200cm mattress. Item weight is 49kg; weight capacity is 500kg.",
        ],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "Ships flat-packed in 2 cartons and requires assembly. Wipe with a dry cloth.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-83d-185v03cg",
    title:
      "5ft King Bed Frame with Hydraulic Storage and LED Lighting, Grey | Kaiku",
    summary:
      "A king-size bed frame in linen fabric and metal, with hydraulic under-bed storage, remote-controlled RGB LED lighting and a built-in USB charging station. 157 x 214 x 113cm, weight capacity 300kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A linen fabric and metal frame, with an engineered wood headboard.",
        ],
      },
      {
        heading: "Storage and Features",
        paragraphs: [
          "A hydraulic lifting mechanism opens a storage compartment 150 x 200cm with a 20cm depth. The headboard carries RGB LED lighting in seven colours with remote control, and a built-in charging station with two USB-A ports and one USB-C port.",
        ],
      },
      {
        heading: "Dimensions and Capacity",
        paragraphs: [
          "Overall dimensions are 157cm wide x 214cm long x 113cm high, for a 150 x 200cm mattress. Weight capacity is 300kg.",
        ],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "Ships flat-packed in 2 cartons and requires assembly. Wipe with a damp cloth, then a dry cloth.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-83d-219v00bk",
    title: "3ft Single Bed Frame with Headboard and Footboard, Black | Kaiku",
    summary:
      "A single bed frame in black metal with a painted finish, a diamond-pattern headboard and footboard, and snap-in slats. 196 x 96 x 88.5cm, weight capacity 136kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A metal frame with a painted finish; the headboard and footboard carry a diamond pattern. Reinforced metal slats snap into place without tools, and are designed to resist squeaking.",
        ],
      },
      {
        heading: "Dimensions and Capacity",
        paragraphs: [
          "Overall dimensions are 196cm long x 96cm wide x 88.5cm high, for a UK single (90 x 190cm) mattress. The headboard measures 96 x 88.5cm, the footboard 96 x 60.5cm, with 32cm of under-bed clearance. Weight capacity is 136kg.",
        ],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "Ships flat-packed in one carton and requires assembly. Wipe with a dry cloth.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 7–14 days."] },
    ],
  },
  {
    id: "product-aosom-83d-220v03bk",
    title: "4ft6 Double Bed Frame with Underbed Storage, Black | Kaiku",
    summary:
      "A double bed frame in black metal with a painted finish and a headboard-free, slatted design. 190.5 x 135.6 x 32.5cm, weight capacity 272kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A metal frame with a painted finish and a slatted, headboard-free design. The 12-slat system snap-fits together without tools, and plastic foot caps protect flooring.",
        ],
      },
      {
        heading: "Dimensions and Capacity",
        paragraphs: [
          "Overall dimensions are 190.5cm long x 135.6cm wide x 32.5cm high, for a UK double (190 x 135cm) mattress, with 28.5cm of under-bed clearance. Weight capacity is 272kg.",
        ],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "Ships flat-packed in one carton and requires assembly. Wipe with a dry cloth.",
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
  const results: { id: string; title: string; found: boolean }[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const written of REWRITES) {
    const doc = await client.fetch<{ _id: string } | null>(
      `*[_id == $id][0]{_id}`,
      { id: written.id },
    );
    results.push({ id: written.id, title: written.title, found: !!doc });
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
    "docs/change-log/2026-09-01-rewrite-descriptions-aosom-di-batch2.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
