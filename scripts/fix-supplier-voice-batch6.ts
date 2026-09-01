/**
 * Sixth batch of the "supplier voice" fix (see batch1-5 for background).
 * This batch: 13 products — Seville and Siena planters, Solara pendant
 * light, Solenne table lamp, Sorelle sofa, the Square Decorative hanging
 * mirror, Symi table lamp, Tarn pot, Teos table lamp, three Camden
 * collection pieces and the Rutland bench. Same AI-generated keyword-
 * stuffed copy pattern as batch3-5. Rewritten to only the real facts on
 * each product's own `dimensions`/`weight`/`specs` fields, fetched fresh
 * this batch.
 *
 * Matched by `_id`, not title.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-voice-batch6.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-voice-batch6.ts --apply
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
    id: "product-import-seville-collection-lebes-planter",
    title: "Seville Collection Lebes Planter | Kaiku",
    summary:
      "A ceramic planter in a rounded, classical lebes shape, in a neutral colourway, measuring 17 × 17 × 15cm and weighing 1.25kg.",
    sections: [
      {
        heading: "Materials and Design",
        paragraphs: [
          "Ceramic, in a rounded vessel shape inspired by the classical lebes, in a neutral colourway.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["17 × 17 × 15cm (W×D×H), 1.25kg."],
      },
    ],
  },
  {
    id: "product-import-siena-brown-round-ribbed-planter",
    title: "Siena Brown Round Ribbed Planter | Kaiku",
    summary:
      "A round ceramic planter with a ribbed, textured, weathered brown finish, measuring 41 × 41 × 19cm and weighing 8kg.",
    sections: [
      {
        heading: "Materials and Design",
        paragraphs: [
          "Ceramic, round with a ribbed, textured surface and a weathered brown finish. Suitable for indoor or outdoor styling.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["41 × 41 × 19cm (W×D×H), 8kg."],
      },
    ],
  },
  {
    id: "product-import-solara-orb-pendant-ceiling-light",
    title: "Solara Orb Pendant Ceiling Light | Kaiku",
    summary:
      "A spherical wooden pendant ceiling light in brown and white, measuring 42 × 42 × 52cm and weighing 5.5kg.",
    sections: [
      {
        heading: "Materials and Design",
        paragraphs: ["A wooden orb-shaped shade, in brown and white."],
      },
      {
        heading: "Fitting",
        paragraphs: [
          "Ceiling-mounted; professional installation is required. Fixtures and fittings are not included.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["42 × 42 × 52cm (W×D×H), 5.5kg."],
      },
    ],
  },
  {
    id: "product-import-solenne-table-lamp-with-edged-linen-shade",
    title: "Solenne Table Lamp with Edged Linen Shade | Kaiku",
    summary:
      "A brown resin table lamp with a cylindrical, edged linen shade, measuring 41 × 41 × 79cm and weighing 4kg.",
    sections: [
      {
        heading: "Materials and Design",
        paragraphs: [
          "A resin base and a cylindrical linen shade with edged detailing, in brown.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["41 × 41 × 79cm (W×D×H), 4kg."],
      },
      {
        heading: "Care",
        paragraphs: ["Indoor use only."],
      },
    ],
  },
  {
    id: "product-import-sorelle-two-seater-sofa-with-cushions",
    title: "Sorelle Two Seater Sofa with Cushions | Kaiku",
    summary:
      "A white two-seater sofa in textured fabric on a metal frame, with cushions included, measuring 197 × 97 × 72cm and weighing 39.9kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Upholstered in white textured fabric on a metal frame. Two matching cushions are included.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["197 × 97 × 72cm (W×D×H), seats 2, 39.9kg."],
      },
      {
        heading: "Care",
        paragraphs: ["Indoor use only."],
      },
    ],
  },
  {
    id: "product-import-square-decorative-hanging-collage-mirror-in-black",
    title: "Square Decorative Hanging Collage Mirror in Black | Kaiku",
    summary:
      "A black handcrafted decorative wall mirror with a metal frame, measuring 14 × 2 × 145cm and weighing 1.86kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Glass and metal, in a black geometric frame, handcrafted, for vertical indoor wall mounting.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["14 × 2 × 145cm (W×D×H), 1.86kg."],
      },
    ],
  },
  {
    id: "product-import-symi-slim-table-lamp",
    title: "Symi Slim Table Lamp | Kaiku",
    summary:
      "A white, slim table lamp with a linen shade on a wooden base, measuring 22 × 22 × 45cm and weighing 0.72kg.",
    sections: [
      {
        heading: "Materials and Design",
        paragraphs: [
          "A wooden base and a linen shade, handcrafted, in white, in a slim silhouette.",
        ],
      },
      {
        heading: "Bulb and Assembly",
        paragraphs: [
          "Takes an E14 screw bulb, not included. Partial assembly required. Indoor use only.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["22 × 22 × 45cm (W×D×H), 0.72kg."],
      },
    ],
  },
  {
    id: "product-import-tarn-collection-large-pot-with-handles",
    title: "Tarn Large Pot with Handles | Kaiku",
    summary:
      "A white ceramic decorative pot with twin handles and a watertight interior, measuring 32 × 27 × 26cm and weighing 4.91kg.",
    sections: [
      {
        heading: "Materials and Design",
        paragraphs: [
          "Ceramic, in white, with twin handles and a watertight interior. Indoor use only.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["32 × 27 × 26cm (W×D×H), 4.91kg."],
      },
    ],
  },
  {
    id: "product-import-teos-table-lamp",
    title: "Teos Table Lamp | Kaiku",
    summary:
      "A beige and brown table lamp with a washed wood base and a linen shade, measuring 25 × 25 × 53cm and weighing 2.5kg.",
    sections: [
      {
        heading: "Materials and Design",
        paragraphs: [
          "A washed wood base and a linen shade, in beige and brown.",
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
        paragraphs: ["25 × 25 × 53cm (W×D×H), 2.5kg."],
      },
    ],
  },
  {
    id: "product-import-the-camden-collection-half-moon-3-tier-table",
    title: "Camden Half Moon 3 Tier Table | Kaiku",
    summary:
      "A grey wooden half-moon console table with three display tiers, measuring 71 × 33 × 76cm and weighing 8.5kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Wood construction in grey, in a half-moon profile with three display tiers.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["71 × 33 × 76cm (W×D×H), 8.5kg."],
      },
    ],
  },
  {
    id: "product-import-the-camden-collection-one-drawer-side-table",
    title: "Camden One Drawer Side Table | Kaiku",
    summary:
      "A grey wooden side table with one drawer, measuring 50 × 38 × 75cm and weighing 8.5kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: ["Wood construction in grey."],
      },
      {
        heading: "Storage",
        paragraphs: ["One drawer."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["50 × 38 × 75cm (W×D×H), 8.5kg."],
      },
    ],
  },
  {
    id: "product-import-the-camden-collection-round-side-table",
    title: "Camden Round Side Table | Kaiku",
    summary:
      "A grey, round wooden side table, measuring 45 × 45 × 60cm and weighing 5kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: ["Wood construction in grey, round."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["45 × 45 × 60cm (W×D×H), 5kg."],
      },
    ],
  },
  {
    id: "product-import-the-rutland-collection-rectangular-bench",
    title: "Rutland Rectangular Bench | Kaiku",
    summary:
      "A brown, rectangular wooden bench, measuring 160 × 40 × 45cm and weighing 21.5kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: ["Wood construction in brown, rectangular."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["160 × 40 × 45cm (W×D×H), 21.5kg."],
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
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-supplier-voice-rewrites-batch6.json`,
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
