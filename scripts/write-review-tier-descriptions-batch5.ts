/**
 * Fifth and (for now) final batch closing out the published REVIEW-tier
 * zero/thin-fact backlog. These three didn't show up in the earlier
 * "zero facts" audit query because each carries 1-2 scattered facts across
 * 1,100+ words rather than exactly zero — still a "length standing in for
 * substance" failure, just below the exact-zero threshold that query
 * filtered on. Same real-numbers-only standard as batches 1-4.
 *
 * After this batch, the only published REVIEW-tier products left are the
 * three already-flagged data-integrity cases (Delphine Collection Sliding
 * Glass Dresser Top, Provence Collection Outdoor Bistro Table, Himalayan
 * Salt Cooking Plate - Square) and one artefact-only case (Soft Squiggly
 * Mirror — raw template syntax, not a facts problem) — none of which are
 * fixable by writing a better description.
 *
 *   pnpm tsx --env-file=.env.local scripts/write-review-tier-descriptions-batch5.ts
 *   pnpm tsx --env-file=.env.local scripts/write-review-tier-descriptions-batch5.ts --apply
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
    title: "Brandon Wall Clock | Kaiku",
    sections: [
      {
        heading: "49cm across, 1.21kg — the range's standard clock size",
        paragraphs: [
          "At 49 × 49cm and 4cm deep, this shares its exact sizing and 1.21kg weight with the Rothay and Ashmount clocks in the same collection, in a white finish rather than grey.",
          "Light enough for a standard picture hook.",
        ],
      },
    ],
  },
  {
    title: "Garda Emerald Glazed Liv Vase | Kaiku",
    sections: [
      {
        heading: "18cm wide, 28cm tall, emerald glaze",
        paragraphs: [
          "At 18 × 18cm and 28cm tall, this sits mid-sized among the Garda glazed vases — taller than the Chive (23cm) but shorter than the Gisela (51–57cm).",
          "At 1.5kg, the emerald-green glaze is fired onto the surface rather than painted on.",
        ],
      },
    ],
  },
  {
    title: "Delphine Collection 1 Drawer 1 Door Chest Right Hand | Kaiku",
    sections: [
      {
        heading: "50cm wide, 72cm tall — one drawer, one right-hand door",
        paragraphs: [
          "At 50cm wide, 38cm deep and 72cm tall, this is a compact console piece rather than a full-length one — a single drawer above a single door, at 9kg.",
          "The 'right hand' in the name refers to which side the door hinges on — worth checking against where the piece will sit before ordering.",
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
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-review-tier-rewrites-batch5.json`,
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
