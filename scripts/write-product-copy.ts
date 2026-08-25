/**
 * Writes a hand-written copy batch into Sanity, after checking it for padding.
 *
 * The copy lives in scripts/copy/batch-NN.ts and is written one product at a time by
 * hand. This does the mechanical half: Portable Text blocks, the summary, the SEO
 * meta description, the merchandising tags, and the delivery and warranty notes in the
 * arrangement Damien asked for — delivery and returns together in the delivery field,
 * returns left empty, warranty in the same format.
 *
 * **It refuses to write padded copy.** `buildDescription` measures its own output with
 * scripts/lib/padding.ts and throws over 10%, so the gate cannot be forgotten. The
 * catalogue baseline is 26%, which is what the gate exists to stop growing.
 *
 * Writes to the draft, never to the published document, even where a published one
 * exists. Damien sets prices and presses Publish; nothing here puts copy in front of a
 * customer on its own.
 *
 *   pnpm tsx --env-file=.env.local scripts/write-product-copy.ts batch-01
 *   pnpm tsx --env-file=.env.local scripts/write-product-copy.ts batch-01 --apply
 */
import { createClient } from "@sanity/client";

import { BATCH_01 } from "./copy/batch-01";
import {
  buildDescription,
  paddedSentences,
  PaddingError,
  paddingRatio,
  type ProductCopy,
  UnrecordedFactError,
  wordCount,
} from "./lib/product-copy-blocks";

const BATCHES: Record<string, ProductCopy[]> = { "batch-01": BATCH_01 };

const apply = process.argv.includes("--apply");
/** Show the sentences with no anchor even where the copy passed. */
const showPadding = process.argv.includes("--padding");
const name = process.argv[2];
const found = name ? BATCHES[name] : undefined;

if (!found) {
  console.error(
    `Usage: scripts/write-product-copy.ts <batch> [--apply]\n  batches: ${Object.keys(BATCHES).join(", ")}`,
  );
  process.exit(1);
}
// process.exit does not narrow, and the alternative is a non-null assertion on every use.
const batch: ProductCopy[] = found;

const token = process.env.SANITY_API_WRITE_TOKEN;
if (apply && !token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — refusing to --apply.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

/** Meta descriptions are truncated by Google around 155–160 characters. */
function metaDescription(summary: string): string {
  if (summary.length <= 158) return summary;
  // Whole sentences only — a description cut mid-clause reads as broken, which is the
  // mistake scripts/rewrite-meta.ts was written to undo.
  const sentences = summary.match(/[^.!?]+[.!?]/g) ?? [summary];
  let out = "";
  for (const sentence of sentences) {
    if ((out + sentence).trim().length > 158) break;
    out += sentence;
  }
  return (out || sentences[0] || summary).trim();
}

/**
 * The Specifications tab, built from the same list the description prints.
 *
 * Two sources for one set of measurements is how a page ends up saying 60cm in the body
 * and 51cm in the table, so `specs` is derived from the copy's own "Product
 * Specifications" section rather than typed a second time. Barcode is left out: it has
 * its own `gtin` field, and the Merchant feed reads that.
 */
function specsFor(copy: ProductCopy) {
  const section = copy.sections.find(
    (candidate) => candidate.heading === "Product Specifications",
  );
  return (section?.labelled ?? [])
    .filter((item) => item.label !== "Barcode")
    .map((item) => ({
      _key: item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      _type: "productSpec" as const,
      label: item.label,
      value: item.value,
    }));
}

async function main() {
  console.log(
    `\n${name} — ${batch.length} products. ${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  const failures: string[] = [];
  const prepared: { copy: ProductCopy; id: string; blocks: unknown[] }[] = [];

  for (const copy of batch) {
    // The draft id, whether or not a published document exists. Sanity's draft id is
    // the published id with a prefix, so this needs the document rather than a guess.
    const found = await client.fetch<{ _id: string } | null>(
      `*[_type == "product" && slug.current == $slug] | order(_id asc) [0]{ _id }`,
      { slug: copy.slug },
    );
    if (!found) {
      failures.push(`${copy.slug}: no product with that slug`);
      continue;
    }
    const id = found._id.startsWith("drafts.")
      ? found._id
      : `drafts.${found._id}`;

    try {
      const blocks = buildDescription(copy);
      prepared.push({ copy, id, blocks });
      console.log(
        `  ✓ ${(paddingRatio(copy) * 100).toFixed(0).padStart(3)}% padding  ` +
          `${String(wordCount(copy)).padStart(4)}w  ${copy.slug}`,
      );
      if (showPadding)
        for (const sentence of paddedSentences(copy))
          console.log(`      · ${sentence}`);
    } catch (error) {
      if (error instanceof PaddingError) {
        failures.push(error.message);
        console.log(`  ✗ ${copy.slug} — over the padding limit`);
        continue;
      }
      if (error instanceof UnrecordedFactError) {
        failures.push(error.message);
        console.log(`  ✗ ${copy.slug} — a described feature is not recorded`);
        continue;
      }
      throw error;
    }
  }

  if (failures.length) {
    console.error(`\n${failures.length} product(s) rejected:\n`);
    for (const failure of failures) console.error(`  ${failure}\n`);
  }

  console.log(
    `\n${prepared.length} of ${batch.length} pass. ` +
      `Catalogue baseline is 26% padding; the limit here is 10%.\n`,
  );

  if (!apply || !prepared.length) {
    if (!apply)
      console.log("Dry run — nothing written. Re-run with --apply.\n");
    return;
  }

  for (const { copy, id, blocks } of prepared) {
    await client
      .patch(id)
      .set({
        summary: copy.summary,
        description: blocks,
        deliveryNotes: copy.deliveryNotes,
        // Empty, as asked: the delivery field carries both, and the product page falls
        // back to the site's standard 14-day wording for the Returns column.
        returnsNotes: "",
        warrantyNotes: copy.warrantyNotes,
        ...(copy.badges ? { badges: copy.badges } : {}),
        ...(copy.highlights ? { highlights: copy.highlights } : {}),
        ...(copy.styleTags ? { styleTags: copy.styleTags } : {}),
        ...(copy.roomTags ? { roomTags: copy.roomTags } : {}),
        ...(copy.useTags ? { useTags: copy.useTags } : {}),
        specs: specsFor(copy),
        // The copy asserts these in prose, so they are written from the same object
        // rather than trusted to still match what the enrichment left behind.
        ...(copy.facts.materialTags
          ? { materialTags: copy.facts.materialTags }
          : {}),
        ...(copy.facts.colourTags ? { colourTags: copy.facts.colourTags } : {}),
        ...(copy.facts.primaryColour
          ? { primaryColour: copy.facts.primaryColour }
          : {}),
        "seo.metaDescription": metaDescription(copy.summary),
      })
      .commit();
    console.log(`  ✓ ${copy.slug}`);
  }

  console.log(
    `\nWrote ${prepared.length} drafts. Prices and Publish are yours.\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
