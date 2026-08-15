/**
 * Runs the padding test over every published product's copy.
 *
 * Damien asked to be sure none of his products get hit for padding. This is the
 * baseline: it measures what is there now, before 89 more descriptions get added, so
 * the new ones can be held to a standard the existing ones already meet — or so the
 * existing ones can be fixed first if they do not.
 *
 * Three checks, matching the three things Google's helpful-content systems read as
 * thin:
 *
 *   1. **Padded sentences** — a sentence containing no word specific to this product:
 *      nothing from its title, no number, nothing from the colour, material, room or
 *      use vocabularies. The rule and its reasoning live in scripts/lib/padding.ts.
 *   2. **Duplicated paragraphs** — the same prose on several products. A shared
 *      returns policy is fine and expected; the same *sales* paragraph on twelve
 *      products is not, so the report separates body copy from the delivery and
 *      returns sections rather than lumping them together.
 *   3. **Repeated headings** — the same H2 across many products, which turns a
 *      catalogue into one template wearing different nouns.
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-padding.ts
 *   pnpm tsx --env-file=.env.local scripts/audit-padding.ts --worst 15
 *
 * Read-only.
 */
import { createClient } from "@sanity/client";

import { anchorsFor, fingerprint, judgeCopy } from "./lib/padding";

const worst = (() => {
  const i = process.argv.indexOf("--worst");
  const n = i > -1 ? Number(process.argv[i + 1]) : NaN;
  return Number.isFinite(n) ? n : 10;
})();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

interface Block {
  _type?: string;
  style?: string;
  listItem?: string;
  children?: { text?: string }[];
}

interface Row {
  title: string;
  slug: string;
  price: number | null;
  summary: string | null;
  description: Block[] | null;
  materialTags: string[] | null;
  colourTags: string[] | null;
  roomTags: string[] | null;
  useTags: string[] | null;
  primaryColour: string | null;
}

const QUERY = /* groq */ `
*[_type == "product" && !(_id in path("drafts.**")) && count(description) > 0]{
  title, "slug": slug.current, price, summary, description,
  materialTags, colourTags, roomTags, useTags, primaryColour
} | order(title asc)`;

const textOf = (block: Block): string =>
  (block.children ?? []).map((child) => child.text ?? "").join("");

/**
 * Where the boilerplate legitimately starts.
 *
 * Everything from the Delivery & Returns heading onward is policy: it is *supposed*
 * to be identical on every product, and counting it as duplication would bury the
 * real finding under 130 copies of the returns wording.
 */
const POLICY_HEADING = /^(delivery|returns|warranty|delivery & returns)/i;

function splitCopy(blocks: Block[]): { body: Block[]; policy: Block[] } {
  const index = blocks.findIndex(
    (block) =>
      block.style?.startsWith("h") && POLICY_HEADING.test(textOf(block).trim()),
  );
  return index === -1
    ? { body: blocks, policy: [] }
    : { body: blocks.slice(0, index), policy: blocks.slice(index) };
}

async function main() {
  const rows = await client.fetch<Row[]>(QUERY);
  console.log(`\n${rows.length} published products with a description\n`);

  const results: {
    row: Row;
    ratio: number;
    padded: string[];
    words: number;
  }[] = [];
  const paragraphCounts = new Map<string, { count: number; text: string }>();
  const headingCounts = new Map<string, { count: number; text: string }>();

  for (const row of rows) {
    const { body, policy } = splitCopy(row.description ?? []);
    const anchors = anchorsFor(row);

    const prose = body
      .filter(
        (b) => b._type === "block" && !b.listItem && !b.style?.startsWith("h"),
      )
      .map(textOf)
      .filter(Boolean);

    const verdict = judgeCopy([row.summary ?? "", ...prose], anchors);
    const words = [
      row.summary ?? "",
      ...body.map(textOf),
      ...policy.map(textOf),
    ]
      .join(" ")
      .split(/\s+/)
      .filter(Boolean).length;

    results.push({
      row,
      ratio: verdict.ratio,
      padded: verdict.padded.map((p) => p.sentence),
      words,
    });

    // Body copy only — policy blocks are meant to repeat.
    for (const paragraph of prose) {
      if (paragraph.split(/\s+/).length < 8) continue;
      const key = fingerprint(paragraph);
      const seen = paragraphCounts.get(key);
      paragraphCounts.set(key, {
        count: (seen?.count ?? 0) + 1,
        text: seen?.text ?? paragraph,
      });
    }
    for (const block of body) {
      if (!block.style?.startsWith("h")) continue;
      const text = textOf(block).trim();
      if (!text) continue;
      const key = fingerprint(text);
      const seen = headingCounts.get(key);
      headingCounts.set(key, {
        count: (seen?.count ?? 0) + 1,
        text: seen?.text ?? text,
      });
    }
  }

  const totalSentences = results.reduce(
    (sum, r) => sum + r.padded.length / (r.ratio || 1),
    0,
  );
  const totalPadded = results.reduce((sum, r) => sum + r.padded.length, 0);
  console.log(
    `Padded sentences: ${totalPadded} across the catalogue ` +
      `(~${Math.round((totalPadded / Math.max(1, totalSentences)) * 100)}% of body sentences)\n`,
  );

  console.log(`WORST ${worst} BY PADDING RATIO`);
  for (const r of [...results]
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, worst)) {
    console.log(
      `  ${(r.ratio * 100).toFixed(0).padStart(3)}%  ${r.padded.length}/${Math.round(r.padded.length / (r.ratio || 1))}  ` +
        `${r.words}w  £${r.row.price ?? "—"}  ${r.row.slug}`,
    );
    for (const sentence of r.padded.slice(0, 2))
      console.log(`         "${sentence.slice(0, 104)}"`);
  }

  const dupParagraphs = [...paragraphCounts.values()]
    .filter((p) => p.count > 2)
    .sort((a, b) => b.count - a.count);
  console.log(`\nBODY PARAGRAPHS ON 3+ PRODUCTS: ${dupParagraphs.length}`);
  for (const p of dupParagraphs.slice(0, 10))
    console.log(`  ×${p.count}  "${p.text.slice(0, 100)}"`);

  const dupHeadings = [...headingCounts.values()]
    .filter((h) => h.count > 2)
    .sort((a, b) => b.count - a.count);
  console.log(`\nBODY HEADINGS ON 3+ PRODUCTS: ${dupHeadings.length}`);
  for (const h of dupHeadings.slice(0, 10))
    console.log(`  ×${h.count}  "${h.text.slice(0, 80)}"`);

  // Length with nothing behind it. A long page on a cheap item is the classic shape.
  const bloated = results
    .filter((r) => r.row.price !== null && r.row.price < 100 && r.words > 450)
    .sort((a, b) => b.words - a.words);
  console.log(`\nLONG COPY ON SUB-£100 ITEMS: ${bloated.length}`);
  for (const r of bloated.slice(0, 10))
    console.log(`  ${r.words}w  £${r.row.price}  ${r.row.slug}`);

  console.log();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
