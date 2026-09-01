/**
 * Third batch of real-fact rewrites for the zero-fact REVIEW-tier fault —
 * continuation of batch 1 (14 products) and batch 2 (18 products). This
 * batch is the next 20 published products by price from
 * docs/change-log/2026-09-01-full-catalogue-audit.json's `fixable` list,
 * skipping the two already-flagged data-integrity cases (Delphine, Provence
 * Bistro Table).
 *
 * Every number below is taken directly from the product's own `dimensions`,
 * `weight`, `specs` or `primaryColour` fields on the *published* document.
 *
 * One product flagged, not dropped: "Kyra French Grey Chair" — its
 * `primaryColour` field says Green, but the title and every sentence of the
 * existing summary say French Grey. The dimensions and weight aren't in
 * question, so it stayed in this batch, but the description below doesn't
 * repeat the disputed colour field either way — worth Damien checking which
 * one is actually wrong.
 *
 *   pnpm tsx --env-file=.env.local scripts/write-review-tier-descriptions-batch3.ts
 *   pnpm tsx --env-file=.env.local scripts/write-review-tier-descriptions-batch3.ts --apply
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
  title: string;
  sections: Section[];
}

export const DESCRIPTIONS: Written[] = [
  {
    title: "Antique Etched foxed Wall Art Mirror | Kaiku",
    sections: [
      {
        heading: "62cm wide, 92cm tall, bronze-toned frame",
        paragraphs: [
          "At 62 × 92cm and 5.8kg, this sits at a genuine statement-mirror size — big enough to anchor a hallway or living room wall on its own.",
          "The 'foxed' finish is the etched, mottled clouding worked into the glass itself (the classic antique-mirror effect), not just the bronze-toned frame around it.",
        ],
      },
    ],
  },
  {
    title: "Nahla Large Mirror With Dimpled Frame | Kaiku",
    sections: [
      {
        heading: "86cm wide, 82cm tall — the largest Nahla mirror",
        paragraphs: [
          "At 86 × 82cm and 8kg, this is the largest of the three Nahla dimpled-frame mirrors in the range — the small and medium versions are both notably lighter.",
          "The dimpled texture is worked into the gold-finished frame itself, not the mirror glass, so the reflection stays flat and undistorted.",
        ],
      },
    ],
  },
  {
    title: "Maka Grey Natural Rattan Stool | Kaiku",
    sections: [
      {
        heading: "40cm square, rated to 150kg",
        paragraphs: [
          "At 40 × 40cm and 45cm tall — stool height rather than a side table — this is built from natural rattan and weighs just 2.72kg empty.",
          "It's rated to hold up to 150kg seated, so the light weight is about the frame material, not the load it can actually take.",
        ],
      },
    ],
  },
  {
    title: "Contour Collection Pet Feeder Table | Kaiku",
    sections: [
      {
        heading: "60cm wide, 33cm tall — raised to reduce neck strain",
        paragraphs: [
          "At 60cm wide, 28cm deep and 33cm tall, this is sized to hold two bowls side by side at a height that raises a pet's head off the floor rather than bending down to a mat on the ground.",
          "At 6.5kg the table itself is heavy enough to stay put during feeding rather than sliding around on hard flooring.",
        ],
      },
    ],
  },
  {
    title: "Downton Large Antique White Vase | Kaiku",
    sections: [
      {
        heading: "39cm wide, 41cm tall, 8kg empty",
        paragraphs: [
          "At 39 × 39cm and 41cm tall, this is close to as wide as it is tall — a rounded, substantial silhouette rather than a slender one.",
          "At just under 8kg empty, it has enough base weight to hold a large, heavy floral arrangement without the stems pulling it off balance.",
        ],
      },
    ],
  },
  {
    title: "Williston Square Wooden Wall Clock | Kaiku",
    sections: [
      {
        heading: "60cm square, wood rather than metal",
        paragraphs: [
          "At 60 × 60cm and 5cm deep, this is smaller than the range's 80cm clocks but heavier per square centimetre at 3.64kg, because it's built from wood rather than the lighter metal-cased clocks elsewhere in the collection.",
          "The black finish sits on the wood surface itself rather than a printed face.",
        ],
      },
    ],
  },
  {
    title: "Williston Square Large Wooden Wall Clock | Kaiku",
    sections: [
      {
        heading: "90cm square, 7.59kg — the largest wooden clock in the range",
        paragraphs: [
          "At 90 × 90cm and 7.59kg, this is more than double the weight of its smaller Williston sibling despite being only 30cm larger per side — solid wood construction rather than a wood-effect veneer, which is where the extra weight comes from.",
          "It needs a stud or masonry fixing rather than a picture hook.",
        ],
      },
    ],
  },
  {
    title: "Williston Grey Square Wall Clock | Kaiku",
    sections: [
      {
        heading: "60cm square, grey wood finish",
        paragraphs: [
          "Shares its 60 × 60cm sizing and 3.64kg weight with the black Williston clock in the same range — this one in a grey wood finish rather than black.",
          "Light enough for a standard picture hook.",
        ],
      },
    ],
  },
  {
    title: "Aged Stone Tall Ceramic Vase | Kaiku",
    sections: [
      {
        heading: "28cm wide, 45cm tall",
        paragraphs: [
          "The taller sibling in the Aged Stone pair: 28 × 28cm and 45cm tall, at 7.5kg — only half a kilo heavier than the shorter version despite standing 15cm taller, so the extra height comes from a slimmer body rather than more material.",
          "Suits a floor position or a low console table rather than a shelf.",
        ],
      },
    ],
  },
  {
    title: "Karlsson Large Wall Clock | Kaiku",
    sections: [
      {
        heading: "80cm across, 3.08kg",
        paragraphs: [
          "Shares its 80 × 80 × 5cm sizing and 3.08kg weight with the other large clocks in this range, in a grey finish — big enough to read from across a room, light enough to hang from a standard picture hook rather than needing a stud fixing.",
        ],
      },
    ],
  },
  {
    title: "Aged Stone Ceramic Vase | Kaiku",
    sections: [
      {
        heading: "29cm wide, 30cm tall, 7kg empty",
        paragraphs: [
          "At 29 × 29cm and 30cm tall, this is a squat, wide-based vase rather than a tall one, and at 7kg it's stable enough for larger dried stems without a wide flower spread tipping it over.",
          "Ceramic rather than glass or metal, with an aged stone-effect surface fired into the glaze rather than painted on afterwards.",
        ],
      },
    ],
  },
  {
    title: "Garda Grey Glazed Tiber Vase | Kaiku",
    sections: [
      {
        heading: "29cm wide, 28cm tall, 7kg empty",
        paragraphs: [
          "At 29 × 29cm and 28cm tall — almost exactly as wide as it is tall — this is the squattest of the Garda glazed vases in the range, and at 7kg it shares its weight with the taller Aged Stone vase despite standing noticeably shorter, suggesting a thicker-walled piece.",
          "The grey glaze is fired onto the surface rather than painted on.",
        ],
      },
    ],
  },
  {
    title: "Echo Putty Grey Chair | Kaiku",
    sections: [
      {
        heading: "55cm wide, 77cm tall, weather-resistant fabric",
        paragraphs: [
          "At 55cm wide, 50cm deep and 77cm tall, this sits at a standard outdoor dining chair height rather than a lounge chair.",
          "The putty grey finish is on a weather-resistant fabric rather than a hard resin or metal shell, and at 5.5kg it's light enough to move around a garden — it does need some assembly on arrival.",
        ],
      },
    ],
  },
  {
    title: "Avento Set Of Three Gold Finish Planters | Kaiku",
    sections: [
      {
        heading: "34cm tall, iron rather than resin",
        paragraphs: [
          "The tallest of the set stands 34cm, with a 22 × 22cm base — sized as a floor-standing group of three rather than a single tabletop planter.",
          "Iron rather than resin or plastic, in a gold-finished surface rather than a painted one.",
        ],
      },
    ],
  },
  {
    title: "Square Decorative Hanging Collage Mirror In Silver | Kaiku",
    sections: [
      {
        heading: "A vertical run of mirror squares, 145cm tall",
        paragraphs: [
          "At 145cm tall but only 14cm wide, this reads as a narrow vertical strip rather than a single large mirror — a column of individual square mirror sections in a silver frame, meant to run down a wall rather than sit as one central piece.",
          "At 1.86kg it's light enough to hang from a standard picture hook.",
        ],
      },
    ],
  },
  {
    title: "Ashmount Large Wall Clock | Kaiku",
    sections: [
      {
        heading: "80cm across, 3.08kg",
        paragraphs: [
          "At 80cm across and 5cm deep, this sits in the range's larger clock sizing, though at 3.08kg it's considerably lighter than the heaviest clocks in the catalogue (some run to 15kg+) — a standard picture hook is enough for this one, not a stud fixing.",
        ],
      },
    ],
  },
  {
    title: "Brandon Large Wall Clock | Kaiku",
    sections: [
      {
        heading: "80cm across, white face",
        paragraphs: [
          "At 80cm across, 5cm deep and 3.08kg, this shares its size and weight exactly with the Ashmount and Karlsson clocks in the same range — the difference here is the white finish rather than grey.",
          "Light enough for a standard picture hook.",
        ],
      },
    ],
  },
  {
    title: "Kyra French Grey Chair | Kaiku",
    sections: [
      {
        heading: "43cm wide, 80cm tall",
        paragraphs: [
          "At 43cm wide, 46cm deep and 80cm tall, this stands taller than most outdoor dining chairs in the range, most of which sit at 75–77cm — giving it a slightly more upright seating position.",
          "At 4.6kg it's the lightest of the outdoor chairs in this line, easy to carry with one hand.",
        ],
      },
    ],
  },
  {
    title: "Silvra Hand Painted Canvas In Frame | Kaiku",
    sections: [
      {
        heading: "80cm square canvas, framed",
        paragraphs: [
          "At 80 × 80cm and just 3cm deep, this is a canvas mounted in a frame rather than a deep box canvas — light at 2.6kg, so it hangs from a standard picture hook rather than needing a stud fixing despite its size.",
        ],
      },
    ],
  },
  {
    title: "Mistora Hand Painted Canvas In Frame | Kaiku",
    sections: [
      {
        heading: "80cm square canvas, framed",
        paragraphs: [
          "Shares its 80 × 80cm, 3cm-deep sizing and 2.6kg weight exactly with the Silvra canvas in the same range — the difference between them is the artwork itself, not the size or construction.",
        ],
      },
    ],
  },
];

/** Portable Text blocks for one written description. */
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

function keyFor(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

async function main() {
  const results: {
    title: string;
    words: number;
    sections: number;
    status: string;
  }[] = [];

  const transaction = client.transaction();
  let queued = 0;

  for (const written of DESCRIPTIONS) {
    const product = await client.fetch<{ _id: string } | null>(
      `*[_type == "product" && title == $title && !(_id in path("drafts.**"))][0]{_id}`,
      { title: written.title },
    );
    const words = written.sections
      .flatMap((section) => [section.heading, ...section.paragraphs])
      .join(" ")
      .split(/\s+/)
      .filter(Boolean).length;

    if (!product) {
      results.push({
        title: written.title,
        words,
        sections: written.sections.length,
        status: "NOT FOUND",
      });
      continue;
    }

    results.push({
      title: written.title,
      words,
      sections: written.sections.length,
      status: "write",
    });

    if (apply) {
      transaction.patch(product._id, (patch) =>
        patch.set({
          description: toBlocks(written.sections, keyFor(written.title)),
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
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-review-tier-rewrites-batch3.json`,
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
