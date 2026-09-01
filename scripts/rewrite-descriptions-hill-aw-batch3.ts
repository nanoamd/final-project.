/**
 * Rewrite pass for Hill Interiors / AW Dropship product descriptions — see
 * scripts/rewrite-descriptions-hill-aw-batch1.ts for the full standard and
 * rationale.
 *
 * Batch 3: 13 more Hill Interiors decor pieces (vases, candle holders,
 * canvases) plus the first 7 AW Dropship reclaimed-teak furniture pieces.
 * The AW Dropship items carry one genuinely different real fact worth its
 * own section: unlike Hill Interiors' generic statutory-rights boilerplate,
 * this whole reclaimed-teak range is explicitly supplied WITHOUT a
 * manufacturer's warranty (that's on the product's own warrantyNotes field,
 * not invented) — the "Care and Warranty" section below states that.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-hill-aw-batch3.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-hill-aw-batch3.ts --apply
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
    id: "hill-decor-21706",
    title: "Silver Punch Faced Ceramic Large Candle Holder | Kaiku",
    summary:
      "A ceramic candle holder with a punch-faced texture, 21 x 21 x 24cm and 2.5kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A ceramic candle holder with a 'punch faced' texture — small indentations pressed into the surface — adding real thickness to the walls, which is where its weight comes from.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "21 x 21cm and 24cm tall, weighing 2.5kg — a substantial single-candle holder rather than a tealight-sized one.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "For indoor use, kept out of direct sunlight for prolonged periods. Let any wax harden before gently removing it, then wipe clean with a damp cloth, avoiding abrasive materials.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21717",
    title: "Large Hammered Silver Astral Vase | Kaiku",
    summary:
      "A ceramic vase with a hammered silver finish, 40 x 40 x 57cm and 10kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A ceramic vase with a hammered finish worked into the surface itself rather than printed on top, which is where the weight comes from relative to its size.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "40 x 40cm and 57cm tall, weighing 10kg empty — a floor-standing vase rather than a tabletop one, stable enough to hold tall branches or dried stems without tipping.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "For indoor use. Suitable for fresh or dried flowers; line with florist cellophane before adding real stems. Clean with a soft, damp cloth, avoiding harsh chemicals.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21718",
    title: "Hammered Silver Astral Vase | Kaiku",
    summary:
      "A ceramic vase with a hammered silver finish, the smaller Astral size, 39 x 39 x 38cm and 7kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "The smaller of the two Astral vases, sharing the same hammered finish. Close to as wide as it is tall, so it sits more like a low bowl-vase than a tall floor piece.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "39 x 39cm and 38cm tall, weighing 7kg — suited to a console table or hearth rather than the floor.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "For indoor use. Suitable for fresh or dried flowers; line with florist cellophane before adding real stems. Clean with a soft, damp cloth, avoiding abrasive materials.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21761",
    title: "Garda Grey Glazed Gisela Vase | Kaiku",
    summary:
      "A tall ceramic vase in grey with a glazed finish, 17 x 17 x 57cm and 3.2kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A ceramic vase in grey with a glazed finish — taller and narrower than the white Gisela vase in the same shape family (51cm), and heavier too at 3.2kg versus 2.5kg, suggesting a thicker glaze application.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "17 x 17cm and 57cm tall, weighing 3.2kg — the tallest vase in the Garda range, with a sturdy base designed to resist tipping.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "For indoor use. Suitable for fresh or dried flowers; line with florist cellophane before adding real stems. Clean with a soft, damp cloth, avoiding harsh abrasives.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21766",
    title: "Garda Emerald Glazed Liv Vase | Kaiku",
    summary:
      "A ceramic vase in green with an emerald glazed finish, 18 x 18 x 28cm and 1.5kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A ceramic vase with an emerald-green glaze fired onto the surface rather than painted on, sitting mid-sized among the Garda glazed vases — taller than the Chive (23cm) but shorter than the Gisela (51–57cm).",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["18 x 18cm and 28cm tall, weighing 1.5kg."],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "For indoor use. Suitable for fresh or dried flowers; line with florist cellophane before adding real stems. Clean with a soft, damp cloth, avoiding harsh chemicals.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21767",
    title: "Garda Grey Glazed Chive Vase | Kaiku",
    summary:
      "A cube-shaped ceramic vase in grey with a glazed finish, 23 x 23 x 23cm and 1.6kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A ceramic vase in grey with a glazed finish, in a compact, evenly-proportioned cube shape rather than a tall one.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "23cm in every dimension, weighing 1.6kg — the lightest of the Garda glazed vases in the range, suiting a single stem or a small posy rather than a full arrangement.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "For indoor use, kept out of direct sunlight for prolonged periods. Suitable for fresh flowers — line with florist cellophane and change the water regularly. Clean with a soft, damp cloth and mild soap if needed.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21772",
    title: "Garda Grey Glazed Juniper Vase | Kaiku",
    summary:
      "A ceramic vase in grey with a glazed finish, 37 x 37 x 37cm and 13kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A ceramic vase in grey with a glazed finish fired onto the surface, in a shape proportioned closer to a cube than a tall vase.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "37cm across and 37cm tall, weighing 13kg empty — heavier than either Astral vase despite being smaller, pointing to a thicker glazed wall.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "For indoor use. Suitable for fresh flowers, changed regularly; line with florist cellophane before adding real stems. Clean gently with mild soap and warm water, avoiding harsh chemicals.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21775",
    title: "Garda Grey Glazed Tiber Vase | Kaiku",
    summary:
      "A ceramic vase in grey with a glazed finish, 29 x 29 x 28cm and 7kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A ceramic vase in grey with a glazed finish, almost exactly as wide as it is tall — the squattest of the Garda glazed vases in the range. It shares its weight with the taller Aged Stone vase despite standing noticeably shorter, suggesting a thicker-walled piece. Has no drainage hole, so it's suited to cut flowers rather than potted plants.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["29 x 29cm and 28cm tall, weighing 7kg empty."],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "For indoor use, kept out of continuous direct sunlight to prevent the glaze fading. Suitable for fresh or dried flowers; line with florist cellophane before adding real stems. Clean with a damp cloth and mild detergent for tougher stains.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21795",
    title: "Galaxy Silver And Grey Hand Painted Canvas | Kaiku",
    summary:
      "A hand-painted canvas in silver and grey, 150 x 150 x 4cm and 7.2kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A hand-painted canvas in silver and grey tones, stretched on a wood frame rather than framed behind glass — no two pieces are exactly alike, since each is individually painted. Made with non-toxic paints.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "150 x 150cm and 4cm deep, weighing 7.2kg — a large-format canvas, roughly shoulder height on each side, light enough to hang from standard canvas hooks without needing a wall-fixed frame.",
        ],
      },
      {
        heading: "Installation and Care",
        paragraphs: [
          "Do not hang or place above a heat source, and avoid extremely humid conditions. Dust gently with a soft, dry cloth — avoid cleaning solutions, which can damage the paint — and keep out of direct sunlight to preserve the colours.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-24479",
    title: "Sona Large Hurricane Lantern With Lid | Kaiku",
    summary:
      "A ceramic and glass hurricane lantern with a lid, in white, 21 x 21 x 50cm and 2.7kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A ceramic and glass hurricane lantern in white with a lid — a functional feature rather than a decorative one, letting a candle stay lit outdoors in light wind where an open-topped lantern wouldn't.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "21 x 21cm and 50cm tall, weighing 2.7kg — genuinely large, tall enough to hold a substantial pillar candle.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "Suitable for indoor and outdoor use; store under shelter in harsh weather. Clean the glass with a soft cloth and a mild glass cleaner — avoid soaking the lantern.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-24480",
    title: "Rhea Large Lighthouse Tealight Holder | Kaiku",
    summary:
      "A ceramic lighthouse-shaped tealight holder in white, 11 x 11 x 28cm and 0.8kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A ceramic tealight holder in white, shaped as a genuine lighthouse silhouette — narrow and tall rather than the typical squat tealight holder.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "11 x 11cm and 28cm tall, weighing 0.8kg — light enough to group several together without concern for the surface underneath.",
        ],
      },
      {
        heading: "Candle Use and Care",
        paragraphs: [
          "Designed for standard tealights, and suitable for indoor and outdoor use. Wipe with a soft, dry cloth; for a deeper clean, use a damp cloth with mild soap and dry immediately.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-24505",
    title: "Mistora Hand Painted Canvas In Frame | Kaiku",
    summary: "A hand-painted canvas in a wood frame, 80 x 80 x 3cm and 2.6kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A hand-painted canvas in a wood frame. Shares its 80 x 80cm, 3cm-deep sizing and 2.6kg weight exactly with the Silvra canvas in the same range — the difference between them is the artwork itself, not the size or construction.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["80 x 80cm and 3cm deep, weighing 2.6kg."],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "For indoor use. Dust regularly with a soft cloth, and keep out of direct sunlight to prevent fading.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-24506",
    title: "Silvra Hand Painted Canvas In Frame | Kaiku",
    summary: "A hand-painted canvas in a wood frame, 80 x 80 x 3cm and 2.6kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A hand-painted canvas in a wood frame — each piece unique due to the hand-painted nature of the artwork.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "80 x 80cm and just 3cm deep, weighing 2.6kg — light enough to hang from a standard picture hook rather than needing a stud fixing, despite its size.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "Dust regularly with a soft, dry cloth, and keep away from direct sunlight to maintain the colours.",
        ],
      },
    ],
  },
  {
    id: "product-aw-acshop-01",
    title: "Reclaimed Teak Sideboard Console Table with 6 Drawers | Kaiku",
    summary:
      "A handcrafted reclaimed teak sideboard with six drawers and two open shelves, 180 x 60 x 80cm and 60kg.",
    sections: [
      {
        heading: "Materials and Craftsmanship",
        paragraphs: [
          "Handcrafted from reclaimed solid teak sourced from retired Indonesian fishing boats, made in Bali. As reclaimed timber, natural variations in grain, texture and colour between pieces are expected, not defects.",
        ],
      },
      {
        heading: "Storage and Design",
        paragraphs: [
          "Six drawers plus two open shelves, with a 180cm tabletop.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "180 x 60 x 80cm (L x W x H), weighing 60kg — a two-person lift, so have help ready on delivery day. Delivered fully assembled.",
        ],
      },
      {
        heading: "Care and Warranty",
        paragraphs: [
          "Dust regularly with a soft cloth and wipe away spills promptly; avoid harsh chemical cleaners and prolonged exposure to moisture. Supplied without a manufacturer's warranty — natural variations and wood movement are part of the reclaimed material's character rather than faults — though it remains covered by your statutory consumer rights.",
        ],
      },
    ],
  },
  {
    id: "product-aw-acshop-02",
    title: "Reclaimed Teak Console Table with 3 Drawers | Kaiku",
    summary:
      "A handcrafted reclaimed teak console table with three drawers, 150 x 45 x 80cm and 37kg.",
    sections: [
      {
        heading: "Materials and Craftsmanship",
        paragraphs: [
          "Handcrafted from reclaimed solid teak sourced from retired Indonesian fishing boats, made in Bali. Natural variations in grain, texture and colour between pieces are part of the material, not defects.",
        ],
      },
      {
        heading: "Storage and Design",
        paragraphs: [
          "Three drawers, with a slim profile suited to hallways and entryways.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "150 x 45 x 80cm (L x W x H), weighing 37kg — a two-person lift. Minimal assembly may be required depending on the delivery method.",
        ],
      },
      {
        heading: "Care and Warranty",
        paragraphs: [
          "Dust regularly with a soft cloth and wipe away spills promptly; avoid harsh cleaning products and prolonged exposure to moisture. Supplied without a manufacturer's warranty, though covered by your statutory consumer rights.",
        ],
      },
    ],
  },
  {
    id: "product-aw-acshop-07",
    title: "Reclaimed Teak Dining Table 180cm | Kaiku",
    summary:
      "A handcrafted reclaimed teak dining table seating 6-8 people, 180 x 77 x 80cm and 40kg.",
    sections: [
      {
        heading: "Materials and Craftsmanship",
        paragraphs: [
          "Handcrafted from reclaimed solid teak sourced from retired Indonesian fishing boats, made in Bali. Natural variations in grain, texture and colour are part of the reclaimed material's character.",
        ],
      },
      {
        heading: "Seating and Dimensions",
        paragraphs: [
          "180cm long, seating 6 to 8 people comfortably. Full dimensions: 180 x 77 x 80cm (L x W x H), weighing 40kg — a two-person lift.",
        ],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "Minimal assembly may be required depending on the delivery method. Dust regularly with a soft cloth, wipe away spills promptly, and use coasters and placemats to protect the surface; avoid harsh chemical cleaners and prolonged moisture exposure.",
        ],
      },
      {
        heading: "Warranty",
        paragraphs: [
          "Supplied without a manufacturer's warranty, though covered by your statutory consumer rights under UK law.",
        ],
      },
    ],
  },
  {
    id: "product-aw-acshop-08",
    title: "Reclaimed Teak Six Shelf Display Unit with Castors | Kaiku",
    summary:
      "A handcrafted reclaimed teak six-shelf display unit on castors, 79 x 37 x 180cm and 40kg.",
    sections: [
      {
        heading: "Materials and Craftsmanship",
        paragraphs: [
          "Handcrafted from reclaimed solid teak sourced from retired Indonesian fishing boats, made in Bali. Natural variations in grain, colour and texture are part of the material's character.",
        ],
      },
      {
        heading: "Storage and Mobility",
        paragraphs: [
          "Six open shelves, fitted with castors so the unit can be repositioned while remaining stable in everyday use.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "79cm long, 37cm wide and 180cm tall, weighing 40kg — a two-person lift. Delivered fully assembled.",
        ],
      },
      {
        heading: "Care and Warranty",
        paragraphs: [
          "Dust regularly with a soft cloth and wipe away spills promptly; avoid harsh cleaning products and prolonged exposure to standing water. Supplied without a manufacturer's warranty, though covered by your statutory consumer rights.",
        ],
      },
    ],
  },
  {
    id: "product-aw-acshop-11",
    title: "Small Reclaimed Teak Coffee Table | Kaiku",
    summary:
      "A small handcrafted reclaimed teak coffee table with a lower shelf, 81 x 49 x 41cm and 12.4kg.",
    sections: [
      {
        heading: "Materials and Craftsmanship",
        paragraphs: [
          "Handcrafted from reclaimed solid teak sourced from retired Indonesian fishing boats, made in Bali. Natural variations in grain and colour are part of the reclaimed material's character.",
        ],
      },
      {
        heading: "Storage and Design",
        paragraphs: [
          "An integrated lower shelf for books, magazines or baskets, beneath a compact tabletop.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "81 x 49 x 41cm (L x W x H), weighing 12.4kg. Most people can manage that alone, though it's easier with help. Delivered fully assembled.",
        ],
      },
      {
        heading: "Care and Warranty",
        paragraphs: [
          "Dust regularly with a soft cloth and wipe away spills promptly; avoid harsh chemical cleaners and prolonged exposure to moisture. Supplied without a manufacturer's warranty, though covered by your statutory consumer rights.",
        ],
      },
    ],
  },
  {
    id: "product-aw-acshop-12",
    title:
      "4 Drawer Recycled Wood Storage Chest | Rustic Teak Storage Unit | Kaiku",
    summary:
      "A handcrafted reclaimed teak storage chest with four drawers, 77 x 42 x 43cm and 23.6kg.",
    sections: [
      {
        heading: "Materials and Craftsmanship",
        paragraphs: [
          "Handcrafted from reclaimed teak wood sourced from retired fishing boats — every unit is individually made, so natural variations in grain, colour and texture between pieces are part of its character rather than a defect.",
        ],
      },
      {
        heading: "Storage and Dimensions",
        paragraphs: [
          "Four drawers for everyday storage, in dimensions of 77 x 42 x 43cm and weighing 23.6kg. Most people can manage that alone, though it's easier with help.",
        ],
      },
      {
        heading: "Care and Warranty",
        paragraphs: [
          "Wipe with a soft cloth and avoid harsh chemicals. Supplied without a manufacturer's warranty, though covered by your statutory consumer rights under UK law.",
        ],
      },
    ],
  },
  {
    id: "product-aw-acshop-13",
    title: "Small Recycled Teak TV Stand with 2 Drawers | Kaiku",
    summary:
      "A small handcrafted reclaimed teak TV stand with two drawers and an open shelf, 79 x 46 x 61cm and 14.06kg.",
    sections: [
      {
        heading: "Materials and Craftsmanship",
        paragraphs: [
          "Handcrafted from reclaimed solid teak wood, sustainably sourced from retired fishing boats. Natural variations in grain, colour and texture are part of each piece's character rather than a defect.",
        ],
      },
      {
        heading: "Storage and Design",
        paragraphs: [
          "Two drawers for concealed storage, plus an open shelf sized for media players, streaming devices or games consoles.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "79 x 46 x 61cm (L x W x H), weighing 14.06kg. Most people can manage that alone, though it's easier with help. Minimal assembly may be required depending on the delivery method.",
        ],
      },
      {
        heading: "Care and Warranty",
        paragraphs: [
          "Dust regularly with a soft, dry cloth and wipe away spills promptly; avoid harsh chemical cleaners and prolonged exposure to standing water. Supplied without a manufacturer's warranty, though covered by your statutory consumer rights.",
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
      {
        id: written.id,
      },
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
    "docs/change-log/2026-09-01-rewrite-descriptions-hill-aw-batch3.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
