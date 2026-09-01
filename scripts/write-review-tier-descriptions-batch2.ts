/**
 * Second batch of real-fact rewrites for the zero-fact REVIEW-tier fault —
 * continuation of write-review-tier-descriptions.ts (batch 1: the top 14 by
 * price). This batch is the next 18 published products by price from
 * docs/change-log/2026-09-01-full-catalogue-audit.json's `fixable` list.
 *
 * Every number below is taken directly from the product's own `dimensions`,
 * `weight`, `specs` or `primaryColour` fields on the *published* document
 * (fetched fresh, not assumed from the draft, which can and does diverge).
 *
 * One candidate dropped rather than guessed at: "Provence Collection Outdoor
 * Bistro Table" — its `dimensions`/`weight` fields (70 × 70 × 72cm, 8.4kg)
 * flatly contradict its own `specs` array (80cm diameter, 75cm height, 12kg)
 * on the same document. Two disagreeing sources of truth is a data-integrity
 * problem for Damien to resolve, not something to pick a winner on.
 *
 * Same rules as every other hand-written batch: nothing invented from an
 * absence, no admission of a gap, no supplier name, no product renamed.
 *
 *   pnpm tsx --env-file=.env.local scripts/write-review-tier-descriptions-batch2.ts
 *   pnpm tsx --env-file=.env.local scripts/write-review-tier-descriptions-batch2.ts --apply
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
    title: "Norton Black Square End Table | Modern Side Table | Kaiku",
    sections: [
      {
        heading: "56cm square, 48cm tall — metal, not wood",
        paragraphs: [
          "A 56 × 56cm square table, 48cm tall and 10.3kg — sized as a side or lamp table rather than a coffee table, at a height that sits just above most sofa arm height. The material is metal rather than a wood-look laminate, which is where the weight comes from relative to its size.",
        ],
      },
      {
        heading: "Delivery",
        paragraphs: [
          "It ships in a single carton at roughly 62.5 × 62.5 × 59cm and 14.7kg — a squat, heavy box rather than a long flat-pack, worth knowing if you're carrying it upstairs alone.",
        ],
      },
    ],
  },
  {
    title: "Lennox Black 2 Door Side Cupboard | Kaiku",
    sections: [
      {
        heading: "67cm tall, 49cm wide, 43cm deep",
        paragraphs: [
          "A compact two-door cupboard at 67cm tall, 49cm wide and 43cm deep, weighing 10kg — sized for a narrow hallway or the gap beside a sofa rather than a full-width sideboard. Two doors open to shelving behind, in a black finish that reads as a modern accent piece rather than an attempt to match existing wood furniture.",
        ],
      },
    ],
  },
  {
    title: "Large Ribbed Gesso Table Lamp | Luxury Designer Table Lamp | Kaiku",
    sections: [
      {
        heading: "81cm tall on a 41cm gesso base",
        paragraphs: [
          "At 81cm tall on a 41 × 41cm base, this is a substantial lamp meant to stand on its own rather than share a console table with much else — and at 10kg, the base itself does the work of keeping a tall lamp stable, rather than relying on a wide foot.",
          "Gesso is a plaster-like material built up and shaped rather than moulded plastic, which is where the ribbed texture and the weight both come from. The finish runs brown through neutral to taupe rather than a single flat colour, so it reads as a natural material rather than a painted one.",
        ],
      },
    ],
  },
  {
    title: "Slim Snowy Woodland Pre-Lit 200 Led Christmas Tree | Kaiku",
    sections: [
      {
        heading: "210cm tall on a 91cm base, 200 built-in LEDs",
        paragraphs: [
          "At 210cm tall with a 91 × 91cm branch spread, this fits a room with roughly 2.3m of ceiling height to spare above the tree topper — check the room, not just the box, since a slim profile at this height still needs real vertical clearance.",
          "It carries 200 built-in LED lights, so there's no separate string of lights to add before decorating. At 6.2kg it's light enough for one person to carry into position and reposition once it's assembled.",
        ],
      },
    ],
  },
  {
    title: "Capri Collection Outdoor Dining Chair | Kaiku",
    sections: [
      {
        heading: "Metal frame, fabric seat — 13.2kg per chair",
        paragraphs: [
          "Each chair weighs 13.2kg — heavy enough that it won't blow around in a garden the way a lightweight stacking chair does, but still liftable with one hand for occasional rearranging.",
          "The frame is metal rather than resin or wood, with fabric upholstery on the seat and back in a neutral tone that's easy to match to a table already in the garden.",
        ],
      },
    ],
  },
  {
    title: "Celina Mirrored Wall Clock | Kaiku",
    sections: [
      {
        heading: "112cm across, 15.7kg — plan the wall fixing first",
        paragraphs: [
          "Recorded at 112cm across, 5cm deep and 15.7kg, this is one of the largest clocks in the range — big enough that the mirrored face itself becomes a feature on the wall, not just the numerals.",
          "At that weight it needs a stud or masonry fixing rather than a plasterboard picture hook, so it's worth checking the wall before ordering, not after it arrives.",
        ],
      },
    ],
  },
  {
    title: "Galaxy Silver And Grey Hand Painted Canvas | Kaiku",
    sections: [
      {
        heading: "150cm square, hung rather than framed behind glass",
        paragraphs: [
          "At 150 × 150cm, this is a large-format canvas — roughly shoulder height on each side — meant to anchor a wall on its own rather than sit inside a grouped gallery arrangement.",
          "At 4cm deep and 7.2kg, it's a stretched canvas rather than a framed print behind glass: light enough to hang from standard canvas hooks, without needing a wall-fixed frame.",
        ],
      },
    ],
  },
  {
    title: "Lennox Black Framed Console | Kaiku",
    sections: [
      {
        heading: "132cm wide, 20kg",
        paragraphs: [
          "At 132cm wide, 36cm deep and 81cm tall, this is a full-length console built for a hallway wall or behind a sofa, rather than a narrow accent table — and at 20kg, once it's positioned it isn't something you shift casually.",
          "The black frame is the structural element the name refers to, rather than a solid black cabinet — the surface and any shelving beneath it read as open rather than enclosed.",
        ],
      },
    ],
  },
  {
    title: "Oura Round Coffee Table | Kaiku",
    sections: [
      {
        heading: "72cm round, 40cm tall",
        paragraphs: [
          "A 72cm-diameter round coffee table, 40cm tall and 10kg — sized for a two- or three-seat sofa arrangement rather than a large sectional, where a table this size would look undersized.",
          "At 10kg it's light enough to reposition for cleaning or rearranging a room without needing two people.",
        ],
      },
    ],
  },
  {
    title: "Large Hammered Silver Astral Vase | Kaiku",
    sections: [
      {
        heading: "40cm wide, 57cm tall, 10kg empty",
        paragraphs: [
          "At 40 × 40cm and 57cm tall, this is a floor-standing vase rather than a tabletop one, and at 10kg before anything is put in it, it's stable enough to hold tall branches or dried stems without tipping.",
          "The hammered finish is worked into the metal itself rather than printed on top, which is where the weight comes from relative to its size.",
        ],
      },
    ],
  },
  {
    title:
      "Set Of Three Wooden Lanterns With Traditional Cross Section | Kaiku",
    sections: [
      {
        heading: "A 31cm footprint, up to 84cm tall",
        paragraphs: [
          "The set is recorded at a 31 × 31cm base, rising up to 84cm, and weighs 9kg together — sized for a hearth, doorway or grouped floor display rather than a tabletop, where a piece this tall would dominate.",
          "The grey finish sits on wood-framed lanterns, each designed to hold a candle inside.",
        ],
      },
    ],
  },
  {
    title: "Set Of Three Wooden Lanterns With Archway Design | Kaiku",
    sections: [
      {
        heading: "A 31cm footprint, up to 104cm tall",
        paragraphs: [
          "Recorded at a 31 × 31cm base and up to 104cm tall, weighing 11.5kg for the set — taller than the cross-section design in the same collection, so it suits a floor position by a fireplace or entranceway rather than a shelf.",
          "Each lantern's grey-finished wood frame is cut with an arched opening, holding a candle inside.",
        ],
      },
    ],
  },
  {
    title: "Roza Panelled Wall Clock | Kaiku",
    sections: [
      {
        heading: "112cm across, and heavy enough to need a proper fixing",
        paragraphs: [
          "At 112cm across and 15.7kg, this is one of the largest and heaviest wall clocks in the range — roughly the size of a small dining table laid flat against the wall. It needs a stud or masonry fixing rated for that weight; a plasterboard hook alone won't hold it.",
          "The panelled face is built up from separate sections rather than a single flat disc, giving it real depth (5cm) rather than sitting flush against the wall.",
        ],
      },
    ],
  },
  {
    title: "Natural Folding Wooden A-Frame Shelf – Brown | Kaiku",
    sections: [
      {
        heading: "105cm tall, folds flat, Albasia wood",
        paragraphs: [
          "At 105cm tall, 40cm wide and 31cm deep, this is a tall, narrow ladder-style shelf built from Albasia wood rather than a standard hardwood — a lighter, faster-growing timber, which is part of why it comes in at just 5.5kg.",
          "Being a folding A-frame means it's designed to lie flat for storage or moving rather than needing to be dismantled and rebuilt each time.",
        ],
      },
    ],
  },
  {
    title: "Garda Grey Glazed Juniper Vase | Kaiku",
    sections: [
      {
        heading: "37cm in every dimension, 13kg",
        paragraphs: [
          "Recorded at 37cm across and 37cm tall — proportioned closer to a cube than a tall vase — and 13kg empty, heavier than either Astral vase despite being smaller, which points to a thicker glazed wall.",
          "The grey glaze is fired onto the surface rather than painted on, so it won't wear off with regular handling.",
        ],
      },
    ],
  },
  {
    title: "Adjustable Tractor Seat | Kaiku",
    sections: [
      {
        heading: "Cast ironwork, height-adjustable",
        paragraphs: [
          "Built from metal with a gloss black finish: a pressed and pierced tractor-pan seat, dished for comfort, on a base of four scrolled cast spokes with curled feet, and a footrest made from a twisted bar with turned ball ends — cast ironwork detail rather than a plain tube frame.",
          "At a 37 × 37cm footprint and adjustable up to 86cm, it sits like a bar stool with genuine ironwork character. At 15.6kg, it's stable enough to sit on without the base shifting, but heavy enough that repositioning it regularly means picking it up rather than sliding it.",
        ],
      },
    ],
  },
  {
    title: "Hammered Silver Astral Vase | Kaiku",
    sections: [
      {
        heading: "39cm wide, 38cm tall, 7kg empty",
        paragraphs: [
          "The smaller of the two Astral vases: 39 × 39cm and 38cm tall, at 7kg. Close to as wide as it is tall, so it sits more like a low bowl-vase than a tall floor piece — suited to a console table or hearth rather than the floor.",
        ],
      },
    ],
  },
  {
    title: "Silver Heart Skeleton Wall Clock | Kaiku",
    sections: [
      {
        heading: "An 89cm clock face, 4cm deep",
        paragraphs: [
          "At 89cm across and just 4cm deep, this is a large-format wall clock built to read from across a room rather than up close, and at 3.5kg it needs a wall fixing rated for that weight rather than a picture hook.",
          "The skeleton design leaves gaps in the face rather than backing it with a solid disc, so whatever's on the wall behind it shows through — worth considering against a patterned wall.",
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
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-review-tier-rewrites-batch2.json`,
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
