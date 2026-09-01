/**
 * Fourth batch of the "supplier voice" fix (see batch1-3 for background).
 * This batch: 13 products — Capri outdoor footstool, two Charlton pieces,
 * Chilworth bedside, two Contour pieces, Easton chest, Elmley end table,
 * the Eucalyptus artificial plant, Grafton console, and three Hampton
 * pieces. Same SEO-stuffed AI copy pattern as batch3 (repeated "Perfect
 * for:"/"Why Choose" keyword-list sections). Rewritten to only the real
 * facts on each product's own `dimensions`/`weight`/`specs` fields,
 * fetched fresh this batch.
 *
 * One data-integrity note: Easton Chest of Drawers' structured `specs`
 * field says Colour "Yellow" and Material "Metal, Oak", while the body
 * copy's own trailing spec recap says Colour "Natural Oak" and Material
 * "Oak & Oak Veneer" — two disagreeing colour claims on the same document.
 * Colour is omitted rather than guessed between them; material is stated
 * only where both sources agree (oak-based construction).
 *
 * Matched by `_id`, not title.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-voice-batch4.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-voice-batch4.ts --apply
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
    id: "product-import-capri-collection-outdoor-foot-stool",
    title: "Capri Collection Outdoor Foot Stool | Kaiku",
    summary:
      "A beige outdoor footstool woven from 5mm half-round HDPE wicker on a lightweight aluminium frame, with an Olefin cushion and acacia wood feet, measuring 81 × 56 × 24cm and weighing 7.7kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "5mm half-round HDPE wicker weave on a lightweight, rust-resistant aluminium frame, with acacia wood feet and a quick-drying, fade-resistant Olefin cushion, in beige.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["81 × 56 × 24cm (W×D×H), 7.7kg."],
      },
      {
        heading: "Care",
        paragraphs: [
          "Clean the HDPE wicker with mild soap and water. Suitable for year-round outdoor use.",
        ],
      },
    ],
  },
  {
    id: "product-import-charlton-ribbed-walnut-desk",
    title:
      "Charlton Ribbed Walnut Desk | Luxury Walnut Home Office Desk | Kaiku",
    summary:
      "A walnut desk with a ribbed finish, measuring 120 × 50 × 76cm and weighing 71kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Walnut construction with a ribbed detail, in a brown finish.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["120 × 50 × 76cm (W×D×H), 71kg."],
      },
    ],
  },
  {
    id: "product-import-charlton-walnut-ribbed-chest-of-drawers",
    title:
      "Charlton Ribbed Walnut Chest of Drawers | Luxury 6 Drawer Chest | Kaiku",
    summary:
      "A walnut chest of drawers with six horizontally ribbed, handle-free drawer fronts on a soft-close mechanism, measuring 110 × 45 × 85cm and weighing 88kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Oak, oak veneer and MDF construction with a walnut finish and visible natural wood grain. Drawer fronts are horizontally ribbed and handle-free, closing on a soft-close, smooth-running metal mechanism.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: ["Six drawers."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["110 × 45 × 85cm (W×D×H), 88kg."],
      },
    ],
  },
  {
    id: "product-import-chilworth-1-drawer-grey-bedside-table",
    title:
      "Chilworth Grey Bedside Table | Luxury 1 Drawer Bedside Table | Kaiku",
    summary:
      "A grey bedside table with one drawer and an open lower shelf, on tapered legs, measuring 35 × 35 × 60cm and weighing 13kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Birch, MDF and painted wood construction with a grey finish, tapered legs, a modern bar handle and smooth metal drawer runners.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: ["One drawer plus an open lower storage shelf."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["35 × 35 × 60cm (W×D×H), 13kg."],
      },
    ],
  },
  {
    id: "product-import-contour-collection-2-drawer-2-door-sideboard",
    title: "Contour Collection 2 Drawer 2 Door Sideboard | Kaiku",
    summary:
      "A black wooden sideboard with two drawers and two doors, measuring 80 × 35 × 80cm and weighing 15kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: ["Wood construction in a black finish."],
      },
      {
        heading: "Storage",
        paragraphs: ["Two drawers and two doors."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["80 × 35 × 80cm (W×D×H), 15kg."],
      },
      {
        heading: "Care",
        paragraphs: [
          "Clean with a soft, dry cloth. Avoid abrasive cleaners, wipe spills immediately, and protect the surface from excessive moisture and hot items placed directly on it.",
        ],
      },
    ],
  },
  {
    id: "product-import-contour-collection-3-drawer-console",
    title: "Contour Collection 3 Drawer Console | Kaiku",
    summary:
      "A black wooden console table with three drawers, measuring 120 × 33 × 80cm and weighing 14.5kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: ["Wood construction in a black finish."],
      },
      {
        heading: "Storage",
        paragraphs: ["Three drawers."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["120 × 33 × 80cm (W×D×H), 14.5kg."],
      },
      {
        heading: "Care",
        paragraphs: [
          "Clean with a soft, dry cloth. Avoid abrasive cleaners, wipe spills immediately, and use coasters or protective mats under decorative items.",
        ],
      },
    ],
  },
  {
    id: "product-import-easton-2-drawer-chest-of-drawers",
    title: "Easton 2 Drawer Chest of Drawers | Luxury Oak Chest | Kaiku",
    summary:
      "An oak chest of drawers with a sandblasted sunburst finish, two drawers and gold-style semi-circular handles on a gold-style metal base, measuring 90 × 45 × 85cm.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Oak and oak veneer construction with a sandblasted sunburst finish, gold-style semi-circular handles and a gold-style metal base.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: ["Two drawers."],
      },
      {
        heading: "Dimensions",
        paragraphs: ["90 × 45 × 85cm (W×D×H)."],
      },
    ],
  },
  {
    id: "product-import-elmley-grey-glass-top-end-table",
    title: "Elmley Grey End Table | Luxury Glass Side Table | Kaiku",
    summary:
      "A grey faux shagreen end table with a clear tempered glass top and an antique-style brass surround, measuring 45 × 45 × 60cm and weighing 12kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A grey faux shagreen base with an antique-style brass surround and a clear tempered glass tabletop.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["45 × 45 × 60cm (W×D×H), 12kg."],
      },
    ],
  },
  {
    id: "product-import-eucalyptus-plant-in-stone-effect-pot",
    title: "Eucalyptus Plant In Stone Effect Pot | Kaiku",
    summary:
      "An artificial eucalyptus plant in a stone-effect pot, measuring 19 × 19 × 23cm and weighing 0.23kg.",
    sections: [
      {
        heading: "Materials and Finish",
        paragraphs: [
          "An artificial plastic eucalyptus plant in green, in a stone-effect finished pot.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["19 × 19 × 23cm (W×D×H), 0.23kg. No assembly required."],
      },
      {
        heading: "Care and Placement",
        paragraphs: [
          "As an artificial plant, it needs virtually no maintenance — dust the leaves periodically with a soft, dry cloth or duster, and avoid excessive water or harsh cleaning products.",
          "Suitable for indoor use and fair-weather outdoor use; for outdoor use, protect it from prolonged exposure to harsh weather to preserve the foliage and pot.",
        ],
      },
    ],
  },
  {
    id: "product-import-grafton-black-console-table",
    title: "Grafton Black Console Table | Industrial Oak Console Table | Kaiku",
    summary:
      "A console table combining a solid oak drawer, a faux concrete-effect top and a slate grey metal frame, measuring 140 × 35 × 80cm and weighing 15.4kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A solid oak drawer with an industrial-style metal handle, a faux concrete-effect top and a slate grey metal frame.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: ["One drawer."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["140 × 35 × 80cm (W×D×H), 15.4kg."],
      },
    ],
  },
  {
    id: "product-import-hampton-bedside-table",
    title:
      "Hampton Grey Bedside Table | Luxury Faux Shagreen Bedside Cabinet | Kaiku",
    summary:
      "A grey faux shagreen bedside table with one drawer, antique brass-style legs and handle, measuring 56 × 46 × 66cm and weighing 28kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Faux shagreen finish over a wood construction, with antique brass-style legs and handle and smooth metal drawer runners.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: ["One drawer."],
      },
      {
        heading: "Dimensions, Weight and Assembly",
        paragraphs: [
          "56 × 46 × 66cm (W×D×H), 28kg. Minimal assembly required.",
        ],
      },
    ],
  },
  {
    id: "product-import-hampton-brown-console-table",
    title:
      "Hampton Brown Shagreen Console Table | Luxury Faux Shagreen Console Table | Kaiku",
    summary:
      "A brown faux shagreen console table with two drawers, walnut-effect drawer interiors and antique brass-style handles and legs, measuring 122 × 38 × 81cm and weighing 24kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Faux shagreen finish over a wood construction, with walnut-effect drawer interiors, antique brass-style handles and legs, and smooth metal drawer runners.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: ["Two drawers."],
      },
      {
        heading: "Dimensions, Weight and Assembly",
        paragraphs: [
          "122 × 38 × 81cm (W×D×H), 24kg. Minimal assembly required.",
        ],
      },
    ],
  },
  {
    id: "product-import-hampton-ivory-round-bedside-table",
    title:
      "Hampton Ivory Round Bedside Table | Luxury Shagreen Bedside Cabinet | Kaiku",
    summary:
      "An ivory faux shagreen bedside table with one drawer, antique brass-style legs and a walnut-style drawer interior, measuring 45 × 45 × 60cm and weighing 18kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Faux shagreen finish over a wood construction, in ivory, with antique brass-style legs, a brass-style decorative surround, a matching brass-style handle and a walnut-style drawer interior.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: ["One drawer."],
      },
      {
        heading: "Dimensions, Weight and Assembly",
        paragraphs: [
          "45 × 45 × 60cm (W×D×H), 18kg. Minimal assembly required.",
        ],
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
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-supplier-voice-rewrites-batch4.json`,
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
