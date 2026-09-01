/**
 * Rewrite pass for Hill Interiors / AW Dropship product descriptions — see
 * scripts/rewrite-descriptions-hill-aw-batch1.ts for the full standard and
 * rationale (same sauna/cold-plunge bar: bold h2 sections, real per-product
 * facts only, nothing invented, delivery/returns/warranty boilerplate left
 * out because it's identical across every product and already shown in its
 * own tab).
 *
 * Batch 2: 20 more of the 149 products that did not already meet the
 * standard — mostly Hill Interiors wall clocks and wall plaques.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-hill-aw-batch2.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-hill-aw-batch2.ts --apply
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
    id: "hill-decor-21501",
    title: "Marble Effect Pudding Vase | Kaiku",
    summary:
      "A ceramic vase in grey with a marble-effect finish, in a rounded 'pudding' shape, 25 x 25 x 23cm and 2.24kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A ceramic vase in grey with a marble-effect finish, in a rounded, squat 'pudding' silhouette — wider than it is tall, unlike most vases in the range.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "25 x 25cm at the base, 23cm tall, weighing 2.24kg — marginally heavier than its taller Ellipse sibling despite being shorter, pointing to a thicker-walled body.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "Suitable for fresh flowers; line with florist cellophane before adding real stems. Clean with a damp cloth and mild detergent, avoiding abrasive materials.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21615",
    title: "Roco Wall Clock | Kaiku",
    summary:
      "A wall clock with a glass face in a metal frame, 45cm across and 0.92kg — the smallest clock in the range.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A wall clock with a glass face in a metal frame — the smallest in the range, which mostly runs 59–90cm.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "45cm across and 5cm deep, weighing 0.92kg — one of the lightest clocks in the range, needing nothing more than a picture hook.",
        ],
      },
      {
        heading: "Care",
        paragraphs: ["Clean with a soft, dry cloth, avoiding harsh chemicals."],
      },
    ],
  },
  {
    id: "hill-decor-21616",
    title: "Bloomsbury Wall Clock | Kaiku",
    summary:
      "A wall clock with a glass face in a metal frame, 59cm across and 2.16kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A wall clock with a glass face in a metal frame. Shares its exact 59cm, 2.16kg sizing with the Louie Wall Clock in the same range — the two differ in face design and colour, not size.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["59cm across and 6cm deep, weighing 2.16kg."],
      },
      {
        heading: "Power and Care",
        paragraphs: [
          "Battery operated (batteries not included). A hook or nail is enough to hang it. Clean with a soft, dry cloth, avoiding damp or abrasive cleaners.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21617",
    title: "Louie Wall Clock | Kaiku",
    summary:
      "A wall clock with a glass face in a black metal frame, 59cm across and 2.16kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A wall clock with a glass face in a black metal frame, matching the Bloomsbury Wall Clock's sizing exactly in the same range.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "59cm across and 6cm deep, weighing 2.16kg — hangs from a standard picture hook.",
        ],
      },
      {
        heading: "Power and Care",
        paragraphs: [
          "Battery operated (batteries not included). For indoor use only. Wipe with a soft, dry cloth to keep it free of dust.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21618",
    title: "Roza Panelled Wall Clock | Kaiku",
    summary:
      "A large panelled wall clock in metal and wood, 112cm across and 15.7kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A wall clock with a panelled face built up from separate metal and wood sections rather than a single flat disc, giving it real depth (5cm) rather than sitting flush against the wall.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "112cm across and 15.7kg — one of the largest and heaviest wall clocks in the range, roughly the size of a small dining table laid flat against the wall. It needs a stud or masonry fixing rated for that weight; a plasterboard hook alone won't hold it.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: ["For indoor use only. Dust with a soft, dry cloth."],
      },
    ],
  },
  {
    id: "hill-decor-21619",
    title: "Celina Mirrored Wall Clock | Kaiku",
    summary:
      "A large wall clock with a mirrored glass face, 112cm across and 15.7kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A wall clock with a mirrored glass face in a metal frame, large enough that the mirrored face itself becomes a feature on the wall, not just the numerals. Runs on a quiet quartz movement.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "112cm across, 5cm deep and 15.7kg — one of the largest clocks in the range. At that weight it needs a stud or masonry fixing rather than a plasterboard picture hook, so it's worth checking the wall before ordering.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Dust regularly and clean the mirrored finish with a soft cloth and a gentle glass cleaner, avoiding harsh chemicals.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21620",
    title: "Bronze Skeleton Wall Clock | Kaiku",
    summary:
      "A skeleton-style wall clock in bronze metal, 70cm across and 1.94kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A skeleton-style wall clock in a bronze metal finish; the open face leaves most of the dial as visible mechanism rather than a solid backing, which is where the weight saving comes from. Runs on a quartz movement.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "70cm across and 5cm deep, weighing 1.94kg — light for its size, sitting between the range's smaller 45–60cm clocks and its largest 80–90cm pieces.",
        ],
      },
      {
        heading: "Power and Care",
        paragraphs: [
          "Battery operated, with the battery replaced as needed. Dust with a soft, dry cloth and avoid chemical cleaners.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21623",
    title: "White Skeleton Wall Clock | Kaiku",
    summary:
      "A skeleton-style wall clock in white metal, 70cm across and 1.94kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A skeleton-style wall clock in a white metal finish, sharing its 70cm sizing and 1.94kg weight exactly with the Bronze Skeleton Wall Clock in the same range, with the same open, skeletal dial design.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "70cm across and 5cm deep, weighing 1.94kg — light enough to hang with nails or adhesive hooks rather than a stud fixing.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "For indoor use only. Dust with a soft, dry cloth, avoiding harsh chemicals.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21625",
    title: "Rothay Large Wall Clock | Kaiku",
    summary: "A large wall clock in grey metal, 80cm across and 3.08kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A wall clock in grey metal — the large version in the Rothay range; its standard-sized sibling runs 49cm across and weighs less than half as much, at 1.21kg.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["80cm across and 5cm deep, weighing 3.08kg."],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "For indoor use only. Dust regularly with a soft cloth, avoiding harsh cleaning products.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21627",
    title: "Rothay Wall Clock | Kaiku",
    summary: "A wall clock in grey metal, 49cm across and 1.21kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A wall clock in grey metal — the smaller of the two Rothay clocks; the Large version runs 80cm across and weighs more than double, at 3.08kg.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["49 x 49cm and 4cm deep, weighing 1.21kg."],
      },
      {
        heading: "Power and Care",
        paragraphs: [
          "Battery operated. For indoor use only. Dust regularly, using a damp cloth for stubborn marks and avoiding harsh chemicals.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21629",
    title: "Ashmount Large Wall Clock | Kaiku",
    summary: "A large wall clock in grey metal, 80cm across and 3.08kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A wall clock in grey metal, sized in the range's larger clock category.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "80cm across and 5cm deep, weighing 3.08kg — considerably lighter than the heaviest clocks in the catalogue (some run to 15kg+), so a standard picture hook is enough for this one, not a stud fixing.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Clean with a soft, damp cloth, avoiding abrasive cleaners.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21631",
    title: "Ashmount Wall Clock | Kaiku",
    summary: "A wall clock in grey metal, 49cm across and 1.21kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A wall clock in grey metal, sharing its exact 49 x 49cm sizing and 1.21kg weight with the standard Rothay clock in the same collection — the Ashmount Large version runs to 80cm and 3.08kg.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "49 x 49cm and 4cm deep, weighing 1.21kg — light enough to hang easily.",
        ],
      },
      {
        heading: "Power and Care",
        paragraphs: [
          "Battery operated; if the clock stops, check the battery first. Dust regularly with a soft cloth.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21632",
    title: "Brandon Large Wall Clock | Kaiku",
    summary: "A large wall clock in white metal, 80cm across and 3.08kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A wall clock in white metal, sharing its size and weight exactly with the Ashmount and Karlsson clocks in the same range — the difference here is the white finish rather than grey.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "80cm across, 5cm deep and 3.08kg — light enough for a standard picture hook.",
        ],
      },
      {
        heading: "Power and Care",
        paragraphs: [
          "Battery operated. For indoor use only. Dust regularly with a soft, dry cloth, avoiding harsh cleaning chemicals.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21633",
    title: "Karlsson Large Wall Clock | Kaiku",
    summary:
      "A large wall clock in grey metal with a silent mechanism, 80cm across and 3.08kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A wall clock in grey metal with a silent mechanism for quiet operation, sized alongside the other large clocks in the range.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "80 x 80 x 5cm and 3.08kg — big enough to read from across a room, light enough to hang from a standard picture hook rather than needing a stud fixing.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Dust regularly with a soft cloth; for deeper cleaning, wipe with a damp cloth and dry with a soft towel.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21634",
    title: "Brandon Wall Clock | Kaiku",
    summary: "A wall clock in white metal, 49cm across and 1.21kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A wall clock in white metal, sharing its exact 49 x 49cm sizing and 1.21kg weight with the Rothay and Ashmount clocks in the same collection, in a white finish rather than grey.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "49 x 49cm and 4cm deep, weighing 1.21kg — light enough for a standard picture hook.",
        ],
      },
      {
        heading: "Power and Care",
        paragraphs: [
          "Battery operated. Dust regularly with a soft cloth, keep out of direct sunlight, and wipe gently with a damp cloth if needed.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21637",
    title: "Butchers Cuts Pork Wall Plaque | Kaiku",
    summary:
      "A wooden wall plaque in grey illustrating butchers' cuts of pork, 58 x 45 x 3cm and 1.41kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A wood wall plaque in grey, illustrating butchers' cuts of pork — a genuinely large kitchen plaque rather than a small accent piece.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "58cm wide, 45cm tall and 3cm deep, weighing 1.41kg — needs a clear run of wall to sit properly, and hangs from a standard picture hook.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "For indoor use. Wipe with a soft cloth, avoiding harsh chemicals.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21639",
    title: "Butchers Cuts Chicken Wall Plaque | Kaiku",
    summary:
      "A wooden wall plaque in grey illustrating butchers' cuts of chicken, 58 x 45 x 3cm and 1.41kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A wood wall plaque in grey, illustrating butchers' cuts of chicken with printed artwork. Shares its 58 x 45cm, 3cm-deep sizing and 1.41kg weight exactly with the Butchers Cuts Pork Wall Plaque in the same collection, so the two hang as a matched pair. No assembly required.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["58cm wide, 45cm tall and 3cm deep, weighing 1.41kg."],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "Recommended for indoor use. Dust with a soft cloth, using a damp cloth for any spills or stains.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21643",
    title: "Williston Square Wooden Wall Clock | Kaiku",
    summary: "A wooden wall clock in black, 60 x 60 x 5cm and 3.64kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A wall clock built from wood rather than the lighter metal-cased clocks elsewhere in the range, in a black finish worked into the wood surface itself rather than a printed face. Runs on a silent quartz mechanism.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "60 x 60cm and 5cm deep, weighing 3.64kg — smaller than the range's 80cm clocks but heavier per square centimetre, because of the solid wood construction.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Clean with a soft, dry cloth; keep away from direct sunlight and moisture to protect the wood finish.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21644",
    title: "Williston Square Large Wooden Wall Clock | Kaiku",
    summary:
      "A large solid wood wall clock in black, 90 x 90 x 5cm and 7.59kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "The largest wooden wall clock in the Williston range, in solid wood rather than a wood-effect veneer, with a black finish and a clear, easy-to-read face.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "90 x 90cm and 7.59kg — more than double the weight of its smaller Williston sibling despite being only 30cm larger per side, which is where the solid wood construction shows. Needs a stud or masonry fixing rather than a picture hook.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "For indoor use only — not recommended in a bathroom, where moisture can damage the wood. Dust regularly with a soft, dry cloth.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21647",
    title: "Williston Grey Square Wall Clock | Kaiku",
    summary: "A wooden wall clock in grey, 60 x 60 x 5cm and 3.64kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A wall clock in a grey wood finish, sharing its 60 x 60cm sizing and 3.64kg weight with the black Williston clock in the same range, with a high-contrast dial for easier reading.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["60 x 60cm and 5cm deep, weighing 3.64kg."],
      },
      {
        heading: "Care",
        paragraphs: [
          "Dust regularly with a soft cloth, avoiding harsh cleaning agents.",
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
    "docs/change-log/2026-09-01-rewrite-descriptions-hill-aw-batch2.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
