/**
 * Fills the empty `rugs` category from Viva Rugs — a public, documented Shopify
 * storefront whose own `robots.txt` states "Public product... collection... HTML is
 * crawlable" and names an agent-discovery sitemap and MCP endpoint for exactly this
 * kind of reading. Nothing here reads anything the site owner has not already
 * published for machine consumption; see scripts/lib/viva-rugs.ts for the full case.
 *
 * One product document per **design**, not per size. Viva sell each rug in three
 * sizes as three Shopify variants; Kaiku's schema holds one set of dimensions per
 * product, so this imports the design once, using the smallest currently in-stock
 * size as the figure on the page — genuinely how big *that* listing is, rather than
 * a made-up "one size" that matches nothing you could buy.
 *
 * **Titles are rewritten, not copied.** The supplier's own titles are SEO keyword
 * stuffing — "Deep Purple Rug Geometric Large XL Small Soft Modern Room Carpet
 * Abstract Rug" — built to catch every search term at once. `deriveTitle` builds a
 * plain one from the product's own colour and pattern instead, which is also, not
 * incidentally, exactly the kind of individually-written title the standing
 * constraints already ask for everywhere else on the site.
 *
 * **No price is written.** Standing constraint, same as every other importer —
 * Viva's price is printed for reference only, Kaiku's price is Damien's.
 *
 * Every draft is created without a summary or description, for the same reason as
 * scripts/import-hill-decor.ts: Damien is writing those himself. This sets what a
 * description needs to be written from — colour, material, pattern, size, the
 * supplier's own page and photographs — not the description itself.
 *
 *   pnpm tsx --env-file=.env.local scripts/import-viva-rugs.ts
 *   pnpm tsx --env-file=.env.local scripts/import-viva-rugs.ts --limit 20
 *   pnpm tsx --env-file=.env.local scripts/import-viva-rugs.ts --apply
 */
import { createClient } from "@sanity/client";

import {
  colourTagsFrom,
  deriveTitle,
  designFrom,
  dimensionsFrom,
  distinguishingWord,
  fetchProductsPage,
  materialTagFrom,
  representativeVariant,
  type VivaProduct,
} from "./lib/viva-rugs";

const apply = process.argv.includes("--apply");
const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};
const limit = (() => {
  const n = Number(arg("limit"));
  return Number.isFinite(n) ? n : Infinity;
})();
/** Real photographs, not a wall of near-identical styled shots of the same weave. */
const MAX_IMAGES_PER_PRODUCT = 4;

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

function kaikuSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}

async function allProducts(): Promise<VivaProduct[]> {
  const all: VivaProduct[] = [];
  for (let page = 1; ; page += 1) {
    const batch = await fetchProductsPage(page);
    if (!batch.length) break;
    all.push(...batch);
  }
  return all;
}

async function main() {
  const [categoryRow, existingIds] = await Promise.all([
    client.fetch<{ id: string } | null>(
      `*[_type == "category" && !(_id in path("drafts.**")) && slug.current == "rugs"][0]{ "id": _id }`,
    ),
    client.fetch<string[]>(
      `*[_type == "product" && defined(supplierSku) && supplier->name == "Viva Rugs"].supplierSku`,
    ),
  ]);
  if (!categoryRow) {
    console.error('No "rugs" category found — aborting.');
    process.exit(1);
  }
  const knownIds = new Set(existingIds);

  console.log(`\nFetching Viva Rugs' product feed…`);
  const products = await allProducts();
  console.log(
    `${products.length} designs listed.\n${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  const seenSlugs = new Set<string>();
  const unmappedColours = new Set<string>();
  let created = 0;
  let skippedKnown = 0;
  let skippedNoImage = 0;
  let skippedDuplicateTitle = 0;
  let processed = 0;

  for (const product of products) {
    if (processed >= limit) break;
    if (knownIds.has(String(product.id))) {
      skippedKnown += 1;
      continue;
    }
    if (!product.images.length) {
      skippedNoImage += 1;
      continue;
    }
    processed += 1;

    // A collision usually means the Colour/Design facts this product carries are too
    // generic to tell it apart from another rug that shares them exactly — "Modern
    // Plain Rug" against another plain rug whose colour didn't map. Rather than
    // dropping a real, distinct product, one real word from the supplier's own
    // (otherwise-discarded) title is borrowed to tell the two apart — see
    // distinguishingWord's own comment for why that is still an honest title and
    // not invented text.
    let title = deriveTitle(product);
    let slug = kaikuSlug(title);
    while (seenSlugs.has(slug)) {
      const extra = distinguishingWord(product, title);
      if (!extra) {
        skippedDuplicateTitle += 1;
        break;
      }
      title = title.replace(/\s*Rug$/, ` ${extra} Rug`);
      slug = kaikuSlug(title);
    }
    if (seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    const colours = colourTagsFrom(product);
    const material = materialTagFrom(product.body_html);
    const design = designFrom(product.body_html);
    const variant = representativeVariant(product);
    const size = dimensionsFrom(variant.title);

    if (!colours.length) {
      const raw = /Colour:\s*([^\n<]+)/i.exec(product.body_html)?.[1];
      if (raw) unmappedColours.add(raw.trim());
    }

    console.log(
      `  ✓ ${title.slice(0, 44).padEnd(44)} ${size ? `${size.length}x${size.width}cm` : "size ?"}  ` +
        `${material ?? "—"}  ${colours.join("/") || "—"}  ` +
        `£${variant.price} (not written)  ${product.images.length} photo(s)`,
    );

    if (!apply) continue;

    const assetRefs: {
      _key: string;
      _type: "image";
      asset: { _type: "reference"; _ref: string };
    }[] = [];
    for (const [i, image] of product.images
      .slice(0, MAX_IMAGES_PER_PRODUCT)
      .entries()) {
      const response = await fetch(image.src);
      if (!response.ok) continue;
      const buffer = Buffer.from(await response.arrayBuffer());
      const asset = await client.assets.upload("image", buffer, {
        filename: `viva-rug-${product.id}-${i}.jpg`,
      });
      assetRefs.push({
        _key: `img-${i}`,
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      });
    }
    if (!assetRefs.length) continue;

    await client.createIfNotExists({
      _id: `drafts.viva-rug-${product.id}`,
      _type: "product",
      title: `${title} | Kaiku`,
      slug: { _type: "slug", current: slug },
      category: { _type: "reference", _ref: categoryRow.id },
      supplier: { _type: "reference", _ref: "supplier-viva-rugs" },
      supplierSku: String(product.id),
      sourceUrl: `https://vivarugs.co.uk/products/${product.handle}`,
      gallery: assetRefs,
      ...(size
        ? {
            dimensions: {
              _type: "dimensions",
              length: size.length,
              width: size.width,
              unit: "cm",
            },
          }
        : {}),
      ...(material ? { materialTags: [material] } : {}),
      ...(colours.length
        ? { colourTags: colours, primaryColour: colours[0] }
        : {}),
      ...(design ? { badges: [design] } : {}),
      currency: "GBP",
      stockStatus: "In Stock",
    });
    created += 1;
  }

  console.log(
    `\n${created ? `created ${created} drafts. ` : ""}` +
      `${skippedKnown} already listed, ${skippedNoImage} skipped for no photographs, ` +
      `${skippedDuplicateTitle} skipped as a duplicate derived title.\n`,
  );
  if (unmappedColours.size)
    console.log(
      `Colour lines that mapped to nothing: ${[...unmappedColours].slice(0, 15).join(" | ")}`,
    );

  console.log(
    apply
      ? "\nDrafts only — no price was written. Prices and Publish are Damien's.\n"
      : "\nDry run — nothing written. Re-run with --apply.\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
