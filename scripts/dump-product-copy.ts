/**
 * Prints a product's copy as plain text: summary, description, policy fields, tags.
 *
 * Written to answer "what does Damien's own format actually look like" without reading
 * Portable Text in Studio. The Reclaimed Teak Sideboard is the reference the batches in
 * scripts/copy/ are written against, and the word count at the end is the length to
 * match — 649 words, of which about 400 are body prose.
 *
 *   pnpm tsx --env-file=.env.local scripts/dump-product-copy.ts <slug>
 */
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

interface Span {
  text: string;
  marks?: string[] | null;
}
interface Block {
  style?: string | null;
  listItem?: string | null;
  children?: Span[] | null;
}
interface Doc {
  _id: string;
  title: string;
  summary?: string | null;
  description?: Block[] | null;
  deliveryNotes?: string | null;
  returnsNotes?: string | null;
  warrantyNotes?: string | null;
  badges?: string[] | null;
  highlights?: string[] | null;
  specs?: { label?: string; value?: string }[] | null;
}

const slug = process.argv[2];

async function main() {
  if (!slug) {
    console.error("Usage: scripts/dump-product-copy.ts <slug>");
    process.exit(1);
  }

  const doc = await client.fetch<Doc | null>(
    `*[_type == "product" && slug.current == $slug] | order(_id asc) [0]{
      _id, title, summary, description, deliveryNotes, returnsNotes,
      warrantyNotes, badges, highlights, specs
    }`,
    { slug },
  );
  if (!doc) {
    console.log(`No product with slug "${slug}".`);
    return;
  }

  console.log(`${doc._id}\n${doc.title}\n`);
  console.log(`SUMMARY\n${doc.summary ?? "(empty)"}\n`);

  let words = 0;
  console.log("DESCRIPTION");
  for (const block of doc.description ?? []) {
    const text = (block.children ?? []).map((span) => span.text).join("");
    words += text.split(/\s+/).filter(Boolean).length;
    if (block.listItem) console.log(`  • ${text}`);
    else if (block.style === "h2") console.log(`\n## ${text}`);
    else if (block.style === "h3") console.log(`\n### ${text}`);
    else console.log(text);
  }
  console.log(`\n[${words} words in the description]\n`);

  for (const field of [
    "deliveryNotes",
    "returnsNotes",
    "warrantyNotes",
  ] as const)
    console.log(`${field}\n${doc[field] || "(empty)"}\n`);

  console.log(`badges: ${JSON.stringify(doc.badges)}`);
  console.log(`highlights: ${JSON.stringify(doc.highlights)}`);
  console.log(`specs: ${JSON.stringify(doc.specs)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
