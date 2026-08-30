/**
 * Clears the wrong product's content off the Capri Collection Outdoor Dining
 * Chair, and writes it a real one.
 *
 * Found while investigating Search Console's "pages not indexed" report —
 * duplicate content is one of the causes Google's own documentation names for
 * "Crawled – currently not indexed", so a scan compared every live
 * description against every other. Exactly one exact match turned up: this
 * chair's `summary`, `description` **and `dimensions`** are word-for-word and
 * number-for-number identical to the Contour Collection 2 Drawer 2 Door
 * Sideboard — a different product, from a different supplier, in a different
 * category, at a different price. The live page for a £225 outdoor garden
 * chair currently tells a shopper it is "designed for interiors" and "creates
 * a stylish foundation for displaying lamps, ceramics, artwork" — it is not
 * a chair on the page, it is a sideboard.
 *
 * How it happened is not recoverable and does not matter to the fix: some
 * earlier write patched the wrong document. What matters is that the chair's
 * own `specs` are `null` and its `dimensions` are the sideboard's, not
 * missing — so there is no real number here to fall back to, and inventing
 * one would repeat the exact fault this catalogue keeps getting corrected
 * for. The fix therefore has two parts:
 *
 *   1. Clear `dimensions`, `summary` and `description` rather than leave the
 *      sideboard's facts in place. Blank is honest; wrong is not.
 *   2. Write a short, real description from what *does* survive independent
 *      of the corruption — materialTags (Fabric, Metal), the category
 *      (garden-furniture), the price, and the gallery — naming no dimension,
 *      because there is not one to name.
 *
 * The next step this cannot do by itself: dimensions for this chair need
 * sourcing from the supplier or measuring the product, same as any product
 * that arrives with none. Until then this description is honest about being
 * incomplete rather than silently wrong.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-capri-chair-content.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-capri-chair-content.ts --apply
 */
import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const TITLE = "Capri Collection Outdoor Dining Chair | Kaiku";

/** Confirmed independent of the corrupted fields: materials, from materialTags. */
const SUMMARY =
  "The Capri Collection Outdoor Dining Chair combines a metal frame with fabric upholstery, part of the Capri Collection's outdoor range.";

const SECTIONS: { heading: string; paragraphs: string[] }[] = [
  {
    heading: "Metal and fabric, built for the garden",
    paragraphs: [
      "A metal frame carries fabric upholstery on the seat and back, which is the pairing that lets an outdoor chair be comfortable rather than only weatherproof — the frame does the structural work and the fabric does the sitting.",
      "It is part of the Capri Collection, alongside the matching outdoor footstool, so a pair or a set reads as one range rather than pieces bought separately.",
    ],
  },
  {
    heading: "What this page cannot tell you yet",
    paragraphs: [
      "The dimensions for this chair are not yet confirmed and are deliberately left off this page rather than guessed. If a specific footprint matters for your space, ask before ordering and we will get the measurement from the supplier.",
    ],
  },
];

function toBlocks(sections: typeof SECTIONS): unknown[] {
  const blocks: unknown[] = [];
  let index = 0;
  const block = (text: string, style: string) => {
    const key = `capri-chair-fix-${index++}`;
    return {
      _type: "block",
      _key: key,
      style,
      markDefs: [],
      children: [{ _type: "span", _key: `${key}s`, text, marks: [] }],
    };
  };
  for (const section of sections) {
    blocks.push(block(section.heading, "h2"));
    for (const paragraph of section.paragraphs)
      blocks.push(block(paragraph, "normal"));
  }
  return blocks;
}

async function main() {
  const product = await client.fetch<{
    _id: string;
    summary?: string;
    dimensions?: unknown;
  } | null>(
    `*[_type == "product" && title == $title][0]{_id, summary, dimensions}`,
    {
      title: TITLE,
    },
  );

  if (!product) {
    console.log(`NOT FOUND: ${TITLE}`);
    return;
  }

  console.log(
    `\n${apply ? "APPLYING" : "DRY RUN"} — Capri chair content fix\n`,
  );
  console.log(`  was summary: ${product.summary}`);
  console.log(`  was dimensions: ${JSON.stringify(product.dimensions)}`);
  console.log(`  new summary: ${SUMMARY}`);
  console.log(`  new dimensions: (cleared)`);
  console.log(`  new description: ${SECTIONS.length} sections`);

  if (!apply) {
    console.log("\nNothing written. Re-run with --apply.");
    return;
  }

  await client
    .patch(product._id)
    .unset(["dimensions"])
    .set({
      summary: SUMMARY,
      description: toBlocks(SECTIONS),
    })
    .commit();

  console.log("\nDone.");
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
