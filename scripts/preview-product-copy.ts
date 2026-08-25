/**
 * Renders a copy batch as text, and checks it against itself for duplication.
 *
 * The padding gate in scripts/lib/product-copy-blocks.ts judges one product at a time.
 * It cannot see the other failure mode the audit found across the live catalogue: 67
 * headings shared by three or more products, and paragraphs appearing verbatim on
 * several. That is a batch-level property, so it is checked here, before anything is
 * written.
 *
 *   pnpm tsx scripts/preview-product-copy.ts batch-01
 *   pnpm tsx scripts/preview-product-copy.ts batch-01 --render
 */
import { BATCH_01 } from "./copy/batch-01";
import { buildDescription, fingerprintOf } from "./lib/product-copy-blocks";

const BATCHES = { "batch-01": BATCH_01 };
const name = process.argv[2] ?? "batch-01";
const batch = BATCHES[name as keyof typeof BATCHES];
const render = process.argv.includes("--render");

if (!batch) {
  console.error(`Unknown batch: ${name}`);
  process.exit(1);
}

if (render) {
  for (const copy of batch) {
    console.log(`\n${"=".repeat(78)}\n${copy.slug}\n${"=".repeat(78)}`);
    console.log(`\n${copy.summary}\n`);
    for (const block of buildDescription(copy)) {
      const text = block.children.map((span) => span.text).join("");
      if (block.listItem) console.log(`  • ${text}`);
      else if (block.style === "h2") console.log(`\n## ${text}`);
      else console.log(text);
    }
  }
}

/* ------------------------------------------------------- duplication across the batch -- */

const headings = new Map<string, string[]>();
const paragraphs = new Map<string, string[]>();

for (const copy of batch)
  for (const section of copy.sections) {
    // The policy sections are meant to be identical everywhere, and so is the shape of
    // the page — "Why You'll Love It" and "Product Specifications" appear on every
    // product on purpose, because that is the format.
    const shared =
      section.policy ||
      section.heading === "Why You'll Love It" ||
      section.heading === "Product Specifications";
    if (shared) continue;
    const key = fingerprintOf(section.heading);
    headings.set(key, [...(headings.get(key) ?? []), copy.slug]);
    for (const paragraph of section.paragraphs ?? []) {
      const p = fingerprintOf(paragraph);
      paragraphs.set(p, [...(paragraphs.get(p) ?? []), copy.slug]);
    }
  }

let problems = 0;
for (const [text, slugs] of headings)
  if (slugs.length > 1) {
    problems++;
    console.log(`\n! heading on ${slugs.length} products: "${text}"`);
    for (const slug of slugs) console.log(`    ${slug}`);
  }
for (const [text, slugs] of paragraphs)
  if (slugs.length > 1) {
    problems++;
    console.log(
      `\n! paragraph on ${slugs.length} products: "${text.slice(0, 90)}…"`,
    );
    for (const slug of slugs) console.log(`    ${slug}`);
  }

console.log(
  problems
    ? `\n${problems} duplication problem(s) across ${batch.length} products.\n`
    : `\nNo repeated body headings or paragraphs across ${batch.length} products.\n`,
);
