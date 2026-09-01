/**
 * Third batch of the "supplier voice" fix (see batch1/batch2 for the full
 * background). This batch: 13 products — the second D.I. Designs coffee
 * table, four Abberley collection pieces, the Antique Gold Hare lamp, two
 * Axis pieces, two Berkeley pieces, the Bloom outdoor sofa, and two Broadway
 * pieces. These are a different failure mode from batch1/2's brochure copy:
 * heavily SEO-stuffed AI-generated copy repeating "Perfect for: [20-item
 * list of room types, hotel chains and property types]" and "Why Choose
 * the X?" sections dozens of times per product — 1,500+ words of keyword
 * padding with almost no product-specific fact beyond what's already in
 * `dimensions`/`weight`/`specs`. Rewritten down to only the real facts.
 *
 * Every fact below is pulled from each product's own `dimensions`/`weight`/
 * `specs` fields, fetched fresh this batch (not assumed from the scan
 * snapshot). Matched by `_id`, not title.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-voice-batch3.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-voice-batch3.ts --apply
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
    id: "product-di-di-crofton-ct-wh",
    title: "Crofton White Marble Coffee Table | Kaiku",
    summary:
      "A round coffee table with a white marble-effect recycled glass top on a gold-painted steel frame, 100cm across and 37cm tall, 16kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A recycled glass tabletop printed with a white marble-effect pattern, on a gold-painted steel frame.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["100cm diameter, 37cm tall, 16kg. No assembly required."],
      },
    ],
  },
  {
    id: "product-import-abberley-2-drawer-white-bedside-table",
    title:
      "Abberley White Bedside Table | Luxury 2 Drawer Bedside Table | Kaiku",
    summary:
      "A white bedside table with two drawers, handcrafted from solid oak and oak veneer with gold-coloured handles, measuring 45 × 40 × 60cm and weighing 16kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Handcrafted from solid oak and oak veneer, finished in white paint with visible oak grain, curved drawer fronts, tapered legs and gold-coloured square handles. Drawers run on smooth metal runners.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: ["Two drawers."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["45 × 40 × 60cm (W×D×H), 16kg."],
      },
    ],
  },
  {
    id: "product-import-abberley-black-sideboard",
    title: "Abberley Black Oak Sideboard | Luxury 4 Door Sideboard | Kaiku",
    summary:
      "A black stained oak sideboard with four ribbed doors and removable internal shelving, handcrafted from solid oak and oak veneer, measuring 160 × 45 × 80cm and weighing 58kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Handcrafted from solid oak and oak veneer, finished in a black stain with visible natural grain, ribbed door fronts, tapered legs and brass-style hardware.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: ["Four doors with removable internal shelving."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["160 × 45 × 80cm (W×D×H), 58kg."],
      },
    ],
  },
  {
    id: "product-import-abberley-white-desk",
    title: "Abberley White Desk | Luxury Oak Home Office Desk | Kaiku",
    summary:
      "A white stained solid oak desk with two drawers and gold-coloured handles, measuring 120 × 50 × 76cm and weighing 15kg. Legs require simple assembly.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Handcrafted from white stained solid oak and oak veneer, with visible grain, a curved front and legs, decorative cut-line detailing and gold-coloured square handles on smooth metal drawer runners.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: ["Two drawers."],
      },
      {
        heading: "Dimensions, Weight and Assembly",
        paragraphs: [
          "120 × 50 × 76cm (W×D×H), 15kg. Legs require simple assembly.",
        ],
      },
    ],
  },
  {
    id: "product-import-abberley-white-end-table",
    title: "Abberley White End Table | Luxury Oak Side Table | Kaiku",
    summary:
      "A white painted solid oak end table with two open storage shelves and a curved front, measuring 40 × 40 × 60cm and weighing 13kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Handcrafted from solid oak and oak veneer, finished in white paint with visible natural grain, a curved front and tapered legs.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: ["Two open shelves."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["40 × 40 × 60cm (W×D×H), 13kg."],
      },
    ],
  },
  {
    id: "product-import-antique-gold-hare-table-lamp-with-green-velvet-shade",
    title: "Antique Gold Hare Table Lamp With Green Velvet Shade | Kaiku",
    summary:
      "A table lamp with a handcrafted resin hare-shaped base in an antique gold finish, paired with a deep green velvet shade and gold interior, measuring 25 × 25 × 50cm and weighing 1.1kg.",
    sections: [
      {
        heading: "Materials and Design",
        paragraphs: [
          "A handcrafted resin base in the shape of a hare, finished in antique gold, with a deep green velvet shade and gold interior.",
        ],
      },
      {
        heading: "Bulb and Assembly",
        paragraphs: [
          "Takes an E27 screw bulb, not included. Partial assembly required. Indoor use only.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["25 × 25 × 50cm (W×D×H), 1.1kg."],
      },
      {
        heading: "Care",
        paragraphs: [
          "Dust regularly with a soft, dry cloth. Avoid abrasive cleaners or harsh chemicals on the resin base, and handle the velvet shade carefully.",
        ],
      },
    ],
  },
  {
    id: "product-import-axis-putty-grey-chair",
    title: "Axis Putty Grey Carver Dining Chair | Kaiku",
    summary:
      "A putty grey carver dining chair with integrated armrests and a durable moulded construction, suitable for indoor or outdoor use, measuring 54 × 51 × 79cm and weighing 4.2kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Durable moulded plastic construction with integrated armrests, in a putty grey finish. Weather-resistant, suitable for indoor and outdoor use.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["54 × 51 × 79cm (W×D×H), 4.2kg."],
      },
    ],
  },
  {
    id: "product-import-axis-shelf-unit-with-glass-shelves",
    title: "Axis Shelf Unit With Glass Shelves | Kaiku",
    summary:
      "A metal-framed shelving unit with clear glass shelves, measuring 80 × 12 × 110cm and weighing 7.2kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A slim metal frame with clear glass shelves for open display.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: ["Assembly is required."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["80 × 12 × 110cm (W×D×H), 7.2kg."],
      },
      {
        heading: "Care",
        paragraphs: [
          "Clean glass shelves with a suitable glass cleaner and a soft cloth. Dust the metal frame with a dry or slightly damp cloth, avoiding abrasive products.",
        ],
      },
    ],
  },
  {
    id: "product-import-berkeley-1-drawer-black-bedside-table",
    title:
      "Berkeley Black 1 Drawer Bedside Table | Luxury High Gloss Bedside Cabinet | Kaiku",
    summary:
      "A high-gloss black bedside table with one drawer and tapered gold metal legs, made from MDF, measuring 45 × 45 × 60cm and weighing 26kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "MDF construction with a high-gloss black finish and tapered gold-finish metal legs.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: ["One drawer."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["45 × 45 × 60cm (W×D×H), 26kg."],
      },
    ],
  },
  {
    id: "product-import-berkeley-white-console-table",
    title:
      "Berkeley White Console Table | Luxury High Gloss Console Table | Kaiku",
    summary:
      "A high-gloss white console table with one drawer, a gold bar handle and tapered gold metal legs, measuring 120 × 35 × 80cm and weighing 38kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A high-gloss white lacquer finish on tapered gold-finish metal legs, with a gold bar handle and smooth metal drawer runners.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: ["One drawer."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["120 × 35 × 80cm (W×D×H), 38kg."],
      },
    ],
  },
  {
    id: "product-import-bloom-collection-outdoor-sofa",
    title: "Bloom Collection Outdoor Sofa | Kaiku",
    summary:
      "A brown outdoor sofa woven from chunky HDPE wicker on a powder-coated aluminium frame, with grade 5 Olefin cushions, measuring 202 × 108 × 72cm and weighing 34kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Chunky HDPE wicker weave on a powder-coated aluminium frame, in a brown finish. Cushions are grade 5 Olefin fabric, chosen for its resilience, colourfastness, stain resistance and quick-drying performance.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "This is a heavy item; assembly needs at least two people, carried out on a firm, flat, dry surface.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["202 × 108 × 72cm (W×D×H), 34kg."],
      },
      {
        heading: "Care",
        paragraphs: [
          "Clean the HDPE wicker with mild soapy water; sponge clean the cushions. Protect or store cushions during prolonged poor weather where practical.",
        ],
      },
    ],
  },
  {
    id: "product-import-broadway-chest-of-drawers",
    title: "Broadway Oak Chest of Drawers | Luxury 3 Drawer Oak Chest | Kaiku",
    summary:
      "A smoky grey oak chest of drawers with a ribbon-front drawer design and contrasting black rear panel, measuring 120 × 50 × 85cm and weighing 53kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Premium oak with a smoky grey finish, a distinctive ribbon-front drawer design and a contrasting black rear panel. Arrives fully assembled.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: ["Three drawers."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["120 × 50 × 85cm (W×D×H), 53kg."],
      },
    ],
  },
  {
    id: "product-import-broadway-one-drawer-bedside-table",
    title:
      "Broadway Oak Bedside Table | Luxury Solid Oak 1 Drawer Bedside Table | Kaiku",
    summary:
      "A solid oak bedside table with a geometric panelled drawer front, measuring 55 × 45 × 55cm and weighing 16kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Solid oak construction with a distinctive geometric panelled drawer front and a natural oak finish.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: ["One drawer."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["55 × 45 × 55cm (W×D×H), 16kg."],
      },
    ],
  },
];

function toBlocks(sections: Section[], key: string): unknown[] {
  const blocks: unknown[] = [];
  let index = 0;
  const block = (text: string, style: string) => {
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
    blocks.push(block(section.heading, "h2"));
    for (const paragraph of section.paragraphs)
      blocks.push(block(paragraph, "normal"));
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
    titleMatches: boolean;
    currentTitle: string | null;
  }[] = [];

  const transaction = client.transaction();
  let queued = 0;

  for (const written of REWRITES) {
    const doc = await client.fetch<{ _id: string; title: string } | null>(
      `*[_id == $id][0]{_id, title}`,
      { id: written.id },
    );

    results.push({
      id: written.id,
      title: written.title,
      found: !!doc,
      titleMatches: doc?.title === written.title,
      currentTitle: doc?.title ?? null,
    });

    if (!doc) continue;

    if (apply) {
      transaction.patch(written.id, (patch) =>
        patch.set({
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
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-supplier-voice-rewrites-batch3.json`,
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
