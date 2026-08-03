/**
 * One-off: fixes two real, verified typos found in live product copy
 * (via the public Merchant Center feed, cross-checked against the Studio
 * data) — matched by SKU, only touching the exact field/substring named
 * below. Nothing else on either product is changed.
 *
 * 1. KK-SA-SP-002 ("SaunaPlunge™ Dales Glow 2 Person Indoor Infrared
 *    Sauna"): title has a double space after "SaunaPlunge™" and "2 Person"
 *    instead of "2-Person" — every other sauna in the catalogue uses the
 *    hyphenated "N-Person" form.
 * 2. AW-ACShop-19 ("Bedside Table - Classic - Recycled Wood"): description
 *    has a raw "&nbsp;" artifact and a missing space ("bedroom.The") from
 *    the original supplier copy.
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/fix-content-typos.ts
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

async function fixTitleTypo() {
  const sku = "KK-SA-SP-002";
  const docs = await client.fetch<{ _id: string; title: string }[]>(
    `*[_type == "product" && sku == $sku]{ _id, title }`,
    { sku },
  );
  if (!docs.length) {
    console.warn(`✗ ${sku}: no product found, skipped`);
    return;
  }
  for (const doc of docs) {
    const fixed = doc.title
      .replace(/SaunaPlunge™\s+/, "SaunaPlunge™ ")
      .replace(/(\d)\s+Person\b/, "$1-Person");
    if (fixed === doc.title) {
      console.log(`- ${sku}: title already correct, left alone`);
      continue;
    }
    await client.patch(doc._id).set({ title: fixed }).commit();
    console.log(`✓ ${sku}: title fixed → "${fixed}"`);
  }
}

async function fixDescriptionTypo() {
  const sku = "AW-ACShop-19";
  const docs = await client.fetch<
    { _id: string; description: PortableTextBlockLike[] }[]
  >(`*[_type == "product" && sku == $sku]{ _id, description }`, { sku });
  if (!docs.length) {
    console.warn(`✗ ${sku}: no product found, skipped`);
    return;
  }
  for (const doc of docs) {
    if (!Array.isArray(doc.description)) {
      console.warn(
        `✗ ${sku}: description isn't a portable-text array, skipped`,
      );
      continue;
    }
    let changed = false;
    const fixed = doc.description.map((block) => {
      if (block._type !== "block" || !Array.isArray(block.children)) {
        return block;
      }
      return {
        ...block,
        children: block.children.map(
          (span: { _type: string; text?: string }) => {
            if (span._type !== "span" || typeof span.text !== "string") {
              return span;
            }
            const newText = span.text
              .replace(/&nbsp;/g, " ")
              .replace(/bedroom\.The/g, "bedroom. The");
            if (newText !== span.text) changed = true;
            return { ...span, text: newText };
          },
        ),
      };
    });
    if (!changed) {
      console.log(`- ${sku}: description already correct, left alone`);
      continue;
    }
    await client.patch(doc._id).set({ description: fixed }).commit();
    console.log(`✓ ${sku}: description typos fixed`);
  }
}

interface PortableTextBlockLike {
  _type: string;
  children?: { _type: string; text?: string }[];
}

async function main() {
  await fixTitleTypo();
  await fixDescriptionTypo();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("fix-content-typos failed:", err);
  process.exit(1);
});
