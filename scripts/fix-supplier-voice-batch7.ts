/**
 * Seventh and final batch of the supplier-voice cleanup — the last 13 of the
 * original 71 flagged published products (per scripts/scan-supplier-voice.ts,
 * re-run fresh before writing this batch). Same standard as every earlier
 * batch: real facts only, pulled from each product's own `dimensions`,
 * `weight` and `specs` fields, plus the plainly factual construction details
 * already present in the old summary (ceramic base, linen shade, rattan
 * weave, wood frame, upholstery fabric) — stripped of every superlative
 * ("sophisticated", "elegant", "understated luxury") and every self-
 * referential "the X offers/delivers/provides" sentence pattern.
 *
 * None of these 13 had a `specs` array beyond Wadborough's, so most of this
 * batch is dimensions + weight + the real material facts extracted from
 * their own (otherwise-discarded) summary text.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-voice-batch7.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-voice-batch7.ts --apply
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
    id: "product-import-the-rutland-collection-side-table",
    title: "Rutland Side Table | Kaiku",
    summary:
      "A square wooden side table in a brown finish, 60 x 60 x 60cm and 16kg. Part of the Rutland furniture collection.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A square wooden side table with a brown finish, part of the wider Rutland furniture collection.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["60 x 60 x 60cm (L x W x H), weighing 16kg."],
      },
    ],
  },
  {
    id: "product-import-the-serene-collection-one-drawer-side-table",
    title: "Serene One Drawer Side Table | Kaiku",
    summary:
      "A wooden side table with one drawer, finished in natural brown. 48 x 43 x 59cm (W x D x H) and 7.7kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Made from wood with a natural brown finish, with one drawer for storage.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["48cm wide x 43cm deep x 59cm high, weighing 7.7kg."],
      },
    ],
  },
  {
    id: "product-import-the-serene-collection-three-drawer-bedside-table",
    title: "Serene Three Drawer Bedside Table | Kaiku",
    summary:
      "A bedside table with three drawers, finished in distressed grey. 48 x 43 x 59cm (W x D x H) and 10kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Finished in a distressed grey, with three drawers for storage.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["48cm wide x 43cm deep x 59cm high, weighing 10kg."],
      },
    ],
  },
  {
    id: "product-import-the-serene-rattan-collection-coffee-table",
    title: "Serene Rattan Coffee Table | Kaiku",
    summary:
      "A woven rattan coffee table with tapered legs, in a grey tone. 120 x 60 x 48cm (L x W x H) and 14.5kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A woven rattan coffee table with tapered legs, finished in a grey tone.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["120cm long x 60cm wide x 48cm high, weighing 14.5kg."],
      },
    ],
  },
  {
    id: "product-import-the-serene-rattan-collection-side-table",
    title: "Serene Rattan Side Table | Kaiku",
    summary:
      "A woven rattan side table with tapered legs, in a grey tone. 60 x 40 x 60cm (L x W x H) and 6.6kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A woven rattan side table with tapered legs, finished in a grey tone.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["60cm long x 40cm wide x 60cm high, weighing 6.6kg."],
      },
    ],
  },
  {
    id: "product-import-twill-weave-ceramic-table-lamp-with-linen-shade",
    title: "Twill Weave Ceramic Table Lamp with Linen Shade | Kaiku",
    summary:
      "A ceramic table lamp with a twill weave texture on the base and a linen shade. 25 x 25 x 58cm and 3kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A ceramic base with a twill weave pattern, paired with a linen shade.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["25 x 25 x 58cm, weighing 3kg."],
      },
    ],
  },
  {
    id: "product-import-uthina-table-lamp",
    title: "Uthina Table Lamp | Kaiku",
    summary:
      "A table lamp with a neutral-toned base and a linen shade. 30 x 30 x 53cm and 2kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A neutral, beige-and-stone-toned base with a linen shade.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["30 x 30 x 53cm, weighing 2kg."],
      },
    ],
  },
  {
    id: "product-import-vellis-wingback-armchair",
    title: "Vellis Blue Wingback Armchair | Kaiku",
    summary:
      "A wingback armchair with a high backrest and winged profile, upholstered in blue fabric. 84 x 76 x 101cm and 20.7kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A wingback armchair with a high backrest and winged profile, upholstered in blue fabric.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["84cm long x 76cm wide x 101cm high, weighing 20.7kg."],
      },
    ],
  },
  {
    id: "product-import-veyla-ceramic-table-lamp-with-linen-shade",
    title: "Veyla Ceramic Table Lamp with Linen Shade | Kaiku",
    summary:
      "A ceramic table lamp with a matte finish and a linen shade, in a black and grey palette. 33 x 33 x 51cm and 3.5kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A ceramic base with a matte finish, paired with a linen shade, in a black and grey palette.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["33 x 33 x 51cm, weighing 3.5kg."],
      },
    ],
  },
  {
    id: "product-import-wadborough-neutral-sofa",
    title: "Wadborough 3 Seater Sofa in Neutral | Kaiku",
    summary:
      "A 3-seater sofa with a wood frame, upholstered in neutral fabric. 228 x 102 x 68cm and 57kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A wood-framed 3-seater sofa upholstered in neutral fabric.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "228cm wide x 102cm deep x 68cm high, weighing 57kg. Packed size is 225cm x 102cm x 70cm.",
        ],
      },
    ],
  },
  {
    id: "product-import-white-beaded-ceramic-lamp-with-linen-shade",
    title: "White Beaded Ceramic Table Lamp with Linen Shade | Kaiku",
    summary:
      "A table lamp with a beaded ceramic base in white and a linen shade. 40 x 40 x 71cm and 3.288kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A beaded ceramic base in a white finish, paired with a linen shade.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["40 x 40 x 71cm, weighing 3.288kg."],
      },
    ],
  },
  {
    id: "product-import-white-ceramic-pot-lamp-with-linen-shade",
    title: "White Ceramic Pot Table Lamp with Linen Shade | Kaiku",
    summary:
      "A table lamp with a ribbed ceramic base in white and a linen shade. 38 x 38 x 62cm and 3kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A ribbed ceramic base in a white finish, paired with a linen shade.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["38 x 38 x 62cm, weighing 3kg."],
      },
    ],
  },
  {
    id: "product-import-zephra-chair",
    title: "Zephra White Armchair | Kaiku",
    summary:
      "An armchair upholstered in white fabric with tapered metal legs. 67 x 79 x 78cm and 12.85kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: ["Upholstered in white fabric, with tapered metal legs."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["67cm long x 79cm wide x 78cm high, weighing 12.85kg."],
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
    "docs/change-log/2026-09-01-supplier-voice-rewrites-batch7.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
