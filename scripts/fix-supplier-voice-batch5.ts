/**
 * Fifth batch of the "supplier voice" fix (see batch1-4 for background).
 * This batch: 13 products — Hampton ivory square bedside, Hampton mirror,
 * Himbleton sofa, Huddington sideboard, Kington club chair, two Nahla
 * mirrors, two Provence outdoor pieces, two Reed pieces, Romanby coffee
 * table and the Seraphia table lamp. Same AI-generated keyword-stuffed
 * copy pattern as batch3/4. Rewritten to only the real facts on each
 * product's own `dimensions`/`weight`/`specs` fields, fetched fresh this
 * batch.
 *
 * Matched by `_id`, not title.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-voice-batch5.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-voice-batch5.ts --apply
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
    id: "product-import-hampton-ivory-square-bedside",
    title:
      "Hampton Ivory Square Bedside Table | Luxury Shagreen Bedside Cabinet | Kaiku",
    summary:
      "An ivory faux shagreen bedside table with one drawer, antique brass-style legs and a walnut-effect drawer interior, measuring 45 × 45 × 60cm and weighing 10kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Faux shagreen finish over a wood construction, in ivory, with antique brass-style legs, a matching brass-style handle and a walnut-effect drawer interior.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: ["One drawer."],
      },
      {
        heading: "Dimensions, Weight and Assembly",
        paragraphs: [
          "45 × 45 × 60cm (W×D×H), 10kg. Minimal assembly required.",
        ],
      },
    ],
  },
  {
    id: "product-import-hampton-small-square-ivory-mirror",
    title:
      "Hampton Ivory Shagreen Square Wall Mirror | Luxury Designer Mirror | Kaiku",
    summary:
      "A square wall mirror with an ivory faux shagreen frame and an antique brass-style surround, measuring 80 × 80 × 2.5cm and weighing 10kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A faux shagreen frame in ivory with an antique brass-style surround, around a mirrored glass panel. Arrives fully assembled, for wall mounting.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["80 × 80 × 2.5cm (W×D×H), 10kg."],
      },
    ],
  },
  {
    id: "product-import-himbleton-green-sofa",
    title: "Himbleton Green 3 Seater Sofa | Luxury Chenille Sofa | Kaiku",
    summary:
      "A green 3-seater sofa upholstered in textured chenille, on powder-coated steel legs, measuring 218 × 88 × 82cm with a 47cm seat height. Legs require simple assembly.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Upholstered in green textured chenille, on powder-coated steel legs.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: ["Legs require simple assembly after delivery."],
      },
      {
        heading: "Dimensions",
        paragraphs: [
          "218 × 88 × 82cm (W×D×H) overall, with a 47cm seat height and 19cm leg height.",
        ],
      },
    ],
  },
  {
    id: "product-import-huddington-black-sideboard",
    title: "Huddington Black Sideboard | Luxury 3 Door Sideboard | Kaiku",
    summary:
      "A black wooden sideboard with three doors and internal shelving, measuring 150 × 45 × 87cm and weighing 57kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Wood construction with a black finish and a panelled door design.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: ["Three doors with internal shelving."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["150 × 45 × 87cm (W×D×H), 57kg."],
      },
    ],
  },
  {
    id: "product-import-kington-grey-club-chair",
    title: "Kington Grey Club Chair | Luxury Upholstered Accent Chair | Kaiku",
    summary:
      "A grey upholstered club chair with a curved backrest, on a plywood and rubberwood frame, measuring 62 × 70 × 81cm and weighing 12kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Upholstered in grey fabric over a plywood and rubberwood frame and legs, with a curved supportive backrest and padded seat.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["62 × 70 × 81cm (W×D×H), 12kg."],
      },
    ],
  },
  {
    id: "product-import-nahla-medium-mirror-with-dimpled-frame",
    title: "Nahla Medium Mirror With Dimpled Frame | Kaiku",
    summary:
      "A gold-toned wall mirror with a dimpled, textured frame, measuring 78 × 4 × 73cm and weighing 6.5kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Mirrored glass in a dimpled, textured gold-toned frame, for indoor wall mounting.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["78 × 4 × 73cm (W×D×H), 6.5kg."],
      },
      {
        heading: "Care",
        paragraphs: [
          "Clean the mirrored surface with a suitable glass or mirror cleaner and a soft, lint-free cloth. Dust the frame gently with a soft cloth; avoid abrasive cleaners or rough materials.",
        ],
      },
    ],
  },
  {
    id: "product-import-nahla-small-mirror-with-dimpled-frame",
    title: "Nahla Small Mirror With Dimpled Frame | Kaiku",
    summary:
      "A gold-toned wall mirror with a dimpled, textured frame, measuring 64 × 4 × 60cm and weighing 4.5kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Mirrored glass in a dimpled, textured gold-toned frame, for indoor wall mounting.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["64 × 4 × 60cm (W×D×H), 4.5kg."],
      },
      {
        heading: "Care",
        paragraphs: [
          "Clean the mirrored surface with a suitable glass or mirror cleaner and a soft, lint-free cloth. Dust the textured frame gently with a soft cloth; avoid abrasive products or rough materials.",
        ],
      },
    ],
  },
  {
    id: "product-import-provence-collection-outdoor-4-seater-dining-set",
    title: "Provence Collection Outdoor 4 Seater Dining Set | Kaiku",
    summary:
      "A beige 4-seater outdoor dining set with a square 5mm tempered glass tabletop, 5mm HDPE wicker weave on a powder-coated aluminium frame and grade 5 Olefin cushions, measuring 90 × 90 × 72cm and weighing 52kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A square 5mm tempered glass tabletop on a powder-coated aluminium frame woven with 5mm HDPE wicker, in beige, with grade 5 Olefin cushions that are shower-, UV- and fade-resistant and quick-drying.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["90 × 90 × 72cm (W×D×H), 52kg."],
      },
      {
        heading: "Care",
        paragraphs: [
          "Suitable for year-round outdoor use; a protective cover is recommended during poor weather.",
        ],
      },
    ],
  },
  {
    id: "product-import-provence-collection-outdoor-dining-chair",
    title: "Provence Collection Outdoor Dining Chair | Kaiku",
    summary:
      "A beige outdoor dining chair with 5mm round HDPE wicker weave on a powder-coated aluminium frame, with a grade 5 Olefin cushion, measuring 94 × 62 × 69cm and weighing 8kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "5mm round HDPE wicker weave on a powder-coated aluminium frame, in beige, with a grade 5 Olefin cushion that is shower-, UV- and fade-resistant and quick-drying.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["94 × 62 × 69cm (W×D×H), 8kg."],
      },
    ],
  },
  {
    id: "product-import-reed-collection-2-drawer-2-door-console",
    title: "Reed Collection 2 Drawer 2 Door Console | Kaiku",
    summary:
      "A brown wooden console table with two drawers and two doors, measuring 106 × 30 × 80cm and weighing 16kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: ["Wood construction in a brown finish."],
      },
      {
        heading: "Storage",
        paragraphs: ["Two drawers and two doors."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["106 × 30 × 80cm (W×D×H), 16kg."],
      },
    ],
  },
  {
    id: "product-import-reed-collection-3-drawer-bedside-table",
    title: "Reed Collection 3 Drawer Bedside Table | Kaiku",
    summary:
      "A brown wooden bedside table with three drawers, measuring 40 × 45 × 58cm and weighing 10kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: ["Wood construction in a brown finish."],
      },
      {
        heading: "Storage",
        paragraphs: ["Three drawers."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["40 × 45 × 58cm (W×D×H), 10kg."],
      },
    ],
  },
  {
    id: "product-import-romanby-stone-round-coffee-table",
    title: "Romanby Stone Round Coffee Table | Kaiku",
    summary:
      "A round coffee table in black and white stone with a metal base, measuring 60 × 60 × 45cm.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Stone tabletop in black and white, on a metal base, in a round shape.",
        ],
      },
      {
        heading: "Dimensions",
        paragraphs: ["60 × 60 × 45cm (W×D×H)."],
      },
    ],
  },
  {
    id: "product-import-seraphia-table-lamp-with-edged-linen-shade",
    title: "Seraphia Table Lamp with Edged Linen Shade | Kaiku",
    summary:
      "A brown resin table lamp with an edged linen shade, measuring 35 × 35 × 70cm and weighing 3.5kg.",
    sections: [
      {
        heading: "Materials and Design",
        paragraphs: [
          "A resin base and a linen shade with edged detailing, in brown.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["35 × 35 × 70cm (W×D×H), 3.5kg."],
      },
      {
        heading: "Care",
        paragraphs: ["Indoor use only."],
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
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-supplier-voice-rewrites-batch5.json`,
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
