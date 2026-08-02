/**
 * One-off migration: for products whose Specifications box is empty but
 * whose description has a bullet list with "Label: value" lines (e.g.
 * "Material: Solid Natural Teak", "Height: 90cm"), extract those bullets
 * into the structured `specs` field so they show up in the Specifications
 * tab, not just buried in the long description.
 *
 * Conservative by design: only touches products with a currently-empty
 * `specs` array (never overwrites what an editor already entered), and
 * only extracts from actual bullet-list blocks matching a clean
 * "Label: value" pattern. Products whose specs are jammed into a single
 * run-on sentence with no bullets (e.g. "Table size: height: 46cm Wood
 * top diameter: 77cm...") are skipped and logged — there's no reliable
 * way to split those automatically; add specs for those by hand in
 * Studio.
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/extract-product-specs.ts
 */
import { createClient } from "@sanity/client";

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token,
  useCdn: false,
});

interface PortableTextSpan {
  text?: string;
}
interface PortableTextBlock {
  _type: string;
  listItem?: string;
  children?: PortableTextSpan[];
}
interface ProductRow {
  _id: string;
  title: string;
  specs?: unknown[];
  description?: PortableTextBlock[];
}

const LABEL_VALUE = /^([A-Za-z][A-Za-z /]{1,30}):\s*(.+)$/;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function main() {
  const products = await client.fetch<ProductRow[]>(
    `*[_type == "product"]{ _id, title, specs, description }`,
  );

  let updated = 0;
  let skippedHasSpecs = 0;
  let skippedNoCandidates = 0;

  for (const product of products) {
    if (product.specs?.length) {
      skippedHasSpecs++;
      continue;
    }

    const candidates: { label: string; value: string }[] = [];
    for (const block of product.description ?? []) {
      if (block._type !== "block" || block.listItem !== "bullet") continue;
      const text = (block.children ?? [])
        .map((c) => c.text ?? "")
        .join("")
        .trim();
      const match = LABEL_VALUE.exec(text);
      const [, label, value] = match ?? [];
      if (label && value) {
        candidates.push({ label: label.trim(), value: value.trim() });
      }
    }

    if (!candidates.length) {
      skippedNoCandidates++;
      continue;
    }

    await client
      .patch(product._id)
      .set({
        specs: candidates.map((c) => ({
          _type: "productSpec",
          _key: slugify(c.label) || Math.random().toString(36).slice(2),
          label: c.label,
          value: c.value,
        })),
      })
      .commit();

    console.log(`✓ ${product.title}: added ${candidates.length} specs`);
    updated++;
  }

  console.log(
    `\nDone. Updated ${updated}, already had specs ${skippedHasSpecs}, no bullet-list candidates found ${skippedNoCandidates} (check those by hand — likely a run-on sentence rather than bullets).`,
  );
}

main().catch((err) => {
  console.error("extract-product-specs failed:", err);
  process.exit(1);
});
