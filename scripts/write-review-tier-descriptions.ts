/**
 * Real descriptions for the highest-value published products carrying the
 * catalogue's dominant REVIEW-tier fault: a long, readable essay with zero
 * measurements, materials or capacities. Diagnosed and quantified in
 * docs/change-log/2026-09-01-full-catalogue-audit.json — 223 products share
 * this shape, all with real dimensions/weight/specs recorded that the
 * existing copy simply never used. This is the first batch: the 14 highest
 * price, published, best-supported by real data (see that audit for the
 * rest).
 *
 * Every number below is taken directly from the product's own `dimensions`,
 * `weight` and `specs` fields — cross-checked against packed/carton
 * dimensions where the raw spec string didn't label which number was width
 * vs depth. One candidate from the same batch (Delphine Collection Sliding
 * Glass Dresser Top) was dropped rather than guessed at: its specs read as
 * generic placeholders ("Standard size", "Lightweight") rather than real
 * values, and a height of 120cm on a dresser-top glass panel doesn't square
 * with what the product actually is — flagged for Damien rather than
 * written from data that doesn't hold together.
 *
 * Same rules as every other hand-written batch this project has done:
 * nothing invented from an absence, no admission of a gap, no supplier name,
 * no product renamed. Replaces the existing description wholesale — the
 * audit already established there was nothing worth keeping in it (900+
 * words, not one fact).
 *
 *   pnpm tsx --env-file=.env.local scripts/write-review-tier-descriptions.ts
 *   pnpm tsx --env-file=.env.local scripts/write-review-tier-descriptions.ts --apply
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
    title: "Kyra Grey Wash Elm Wood Wardrobe | Kaiku",
    sections: [
      {
        heading: "Elm, grey-washed rather than stained solid",
        paragraphs: [
          "95cm wide, 50cm deep and 190cm tall — a full-height double wardrobe rather than a single. The grey wash sits on new elm, so the grain still shows through the finish instead of being hidden under a solid stain; iron detailing on the frame and handles keeps the look from reading as purely soft-toned.",
          "At 190cm it clears a standard 2.4m ceiling with room to spare and suits a bedroom with a proper hanging run — a double wardrobe this size is built for two people's wardrobes sharing the space, not a single occupant's overflow.",
        ],
      },
      {
        heading: "Delivery and assembly",
        paragraphs: [
          "It arrives boxed at roughly 71kg in a carton measuring 100 × 54 × 197cm — worth checking against your stairs and doorways before ordering, since a 197cm-tall box is the dimension that catches people out on a turn in the stairs, not the width.",
        ],
      },
    ],
  },
  {
    title: "Loire White Super Kingsize Bed | Kaiku",
    sections: [
      {
        heading: "Built for a super king mattress",
        paragraphs: [
          "194cm wide and 210cm long, sized for a UK super king mattress (180 × 200cm) with the frame allowance a headboard and footboard need. At 114cm the headboard stands tall enough to be the room's focal point rather than disappearing behind pillows.",
          "The frame combines bayur wood and MDF for the structure, upholstered in polyester and cotton — a fabric headboard rather than a hard one, which is softer to lean against reading in bed.",
        ],
      },
      {
        heading: "Delivery",
        paragraphs: [
          "It ships flat-packed, with the largest carton measuring 199 × 16 × 119cm — a long, slim box that needs a straight run to the bedroom rather than a tight stair turn, and needs assembling once it's there.",
        ],
      },
    ],
  },
  {
    title: "Tamarind & Resin Coffee Table – Aqua | Kaiku",
    sections: [
      {
        heading: "Tamarind wood and cast resin, not a printed finish",
        paragraphs: [
          "A 46 × 47cm table — closer to a large stool or side table in footprint than a full coffee table — with the aqua colour cast directly into resin poured against the tamarind wood rather than painted on top. That's why the colour has real depth to it rather than a flat, printed look, and why the piece is heavy for its size at 31kg: solid resin, not a hollow shell.",
          "The weight is worth knowing before ordering as much as after — at 31kg it isn't a table you reposition often, so it wants its spot decided in advance.",
        ],
      },
    ],
  },
  {
    title: "Light Up Bookcase | Kaiku",
    sections: [
      {
        heading: "Tall, narrow, and lit",
        paragraphs: [
          "90cm wide, 38cm deep and 220cm tall — a floor-to-near-ceiling piece with integrated lighting built into the shelving itself, for displaying books and objects that are meant to be seen rather than just stored.",
          "At 220cm it needs a proper ceiling height to clear, and at 63kg once assembled it's a fixture rather than something moved around a room casually — decide its wall before it arrives.",
        ],
      },
    ],
  },
  {
    title: "Multi Shelf Industrial Shelf Unit | Kaiku",
    sections: [
      {
        heading: "Metal and wood, industrial finish",
        paragraphs: [
          "110cm wide, 40cm deep and 203cm tall, built from a metal frame with wood shelving in an industrial finish — the look of scaffold-board shelving rather than a painted domestic unit. At 52.6kg it's a substantial, floor-standing piece rather than something wall-mounted.",
          "It requires assembly on arrival. The depth (40cm) is worth checking against the wall it's going on — deep enough for books and boxes stood upright, shallow enough not to dominate a hallway or landing.",
        ],
      },
    ],
  },
  {
    title: "Mickleton Cream Chenille Armchair | Kaiku",
    sections: [
      {
        heading: "A compact chair in cream chenille",
        paragraphs: [
          "66cm wide, 76.2cm deep and 79cm tall, on a metal frame upholstered in cream chenille — a chair sized for a bedroom corner or as a second seat in a living room rather than a full lounge chair. Chenille has a soft, slightly ribbed texture that reads as warmer than a flat-weave fabric under the same colour.",
          "It weighs 17.7kg assembled and arrives boxed at 24.5kg in a 73 × 85 × 86cm carton — check that against the tightest point of your route in before it's delivered.",
        ],
      },
    ],
  },
  {
    title: "Hannah Grey Velvet Ottoman Bed Double | Kaiku",
    sections: [
      {
        heading: "A double bed with storage built into the base",
        paragraphs: [
          "145cm wide, 206cm long and 111cm tall, in grey velvet over a pine and iron frame with foam padding through the headboard and base. As an ottoman bed the entire base lifts on a gas-strut mechanism to reveal storage underneath the mattress — the practical reason to choose this over a standard bed frame in a room that's short on wardrobe or under-bed space.",
          "It arrives flat-packed, in a carton measuring roughly 145.5 × 148cm at the base with a 9.5cm depth — the dimension worth checking is the width through doorways and stair turns before delivery.",
        ],
      },
    ],
  },
  {
    title: "Hannah Beige Ottoman Double Bed | Kaiku",
    sections: [
      {
        heading: "The same ottoman base, in beige velvet",
        paragraphs: [
          "145cm wide, 206cm long and 111cm tall, in beige velvet over a pine and iron frame with foam padding. Like the rest of the Hannah range, the whole base lifts on a gas strut to reveal storage underneath the mattress — the reason to choose an ottoman bed over a standard frame when a room is short on wardrobe space.",
          "It ships flat-packed, in a carton around 147 × 147cm at the base with a 10cm depth — check the width against your doorways and any stair turn before it's delivered.",
        ],
      },
    ],
  },
  {
    title: "Alton White Chest of Drawers | Luxury 3 Drawer Birch Chest | Kaiku",
    sections: [
      {
        heading: "Birch and painted wood, three drawers",
        paragraphs: [
          "90cm wide, 45cm deep and 75cm tall, painted white over a birch and MDF frame. At 75cm it sits at a height that works as a standard chest of drawers or, in a larger room, a low sideboard — three drawers is enough for folded clothes or linens without the footprint of a taller unit.",
          "It weighs 22kg assembled and arrives boxed at 25kg in a 95 × 50 × 80cm carton.",
        ],
      },
    ],
  },
  {
    title:
      "Hampton Ivory Shagreen Nest of Tables | Luxury Nesting Tables Set of 2 | Kaiku",
    sections: [
      {
        heading: "A pair, the larger measuring 39 × 39 × 54cm",
        paragraphs: [
          "The larger of the two tables measures 39cm square and 54cm tall, in faux shagreen over a metal frame in ivory — shagreen's textured, slightly pebbled finish reads as more tactile than a smooth lacquer under the same pale colour. The smaller table nests beneath it, so the pair can stand as one piece or be split to opposite ends of a sofa.",
          "The set weighs 7kg together and arrives boxed at 10kg in a 47 × 47 × 66cm carton.",
        ],
      },
    ],
  },
  {
    title: "Boucle Ribbed Ark Chair | Kaiku",
    sections: [
      {
        heading: "Ribbed bouclé over a rounded frame",
        paragraphs: [
          "96cm wide, 63cm deep and 90cm tall, upholstered in ribbed bouclé — bouclé's characteristic looped, textured yarn, run in vertical ribs rather than a flat panel. The rounded, arched profile the name refers to gives it a softer silhouette than a square-backed armchair.",
          "It weighs 14.7kg, light enough to reposition around a room without help once it's in place.",
        ],
      },
    ],
  },
  {
    title: "Neatham End Table | Luxury Modern Side Table | Kaiku",
    sections: [
      {
        heading: "40cm square, faux concrete over metal",
        paragraphs: [
          "40cm wide, 40cm deep and 60cm tall — sized to sit beside an armchair at arm height rather than as a coffee table. The top is a faux concrete finish on a metal frame, giving it the look of cast concrete without the weight: it comes in at 10kg, light enough to move as you rearrange a room.",
          "It arrives boxed at 45 × 45 × 70cm.",
        ],
      },
    ],
  },
  {
    title: "Avia Mist Armchair | Kaiku",
    sections: [
      {
        heading: "A wide, low chair in Mist",
        paragraphs: [
          "97cm wide, 86cm deep and 72cm tall — wider and lower than a typical armchair, built for sinking into rather than sitting upright in. Mist is a soft, muted grey-blue, the kind of tone that sits quietly against most existing colour schemes rather than demanding to be matched.",
          "It weighs 17.5kg, manageable for one person to reposition once it's unpacked.",
        ],
      },
    ],
  },
  {
    title: "Grafton Black End Table | Industrial Oak Side Table | Kaiku",
    sections: [
      {
        heading: "Metal, in black, at 50 × 32 × 60cm",
        paragraphs: [
          "50cm long, 32cm wide and 60cm tall — a narrow footprint that suits a side table beside a sofa arm or bed where floor space is tight. Built from black metal, it takes the industrial-frame look without the wood-and-metal mix the name might suggest.",
          "It weighs 7kg and arrives boxed at 9kg in a 54 × 36 × 65cm carton — light enough to carry upstairs in one trip.",
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

  if (apply && queued) await transaction.commit();

  console.log(
    `\n${apply ? "APPLYING" : "DRY RUN"} — review-tier rewrites, batch 1\n`,
  );
  for (const result of results)
    console.log(
      `  ${result.status.padEnd(10)} ${String(result.words).padStart(4)}w  ${result.sections} sections  ${result.title.slice(0, 60)}`,
    );

  const written = results.filter((r) => r.status === "write");
  const total = written.reduce((n, r) => n + r.words, 0);
  console.log(
    `\n${written.length} products, ${total} words, ${apply ? "one transaction" : "not written"}.`,
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-review-tier-rewrites-batch1.json`,
    JSON.stringify({ applied: apply, results }, null, 2),
  );

  if (!apply) console.log("\nNothing written. Re-run with --apply.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
