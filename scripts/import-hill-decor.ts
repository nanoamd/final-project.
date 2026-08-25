/**
 * Fills the five new Decor categories from Hill Interiors — a supplier account already
 * open, with hundreds of unused items in exactly these ranges (see
 * scripts/supplier-coverage.ts: 1,662 items listed, 117 held).
 *
 * Reads each item's own page for its title, code, photographs and specification
 * table — the same facts scripts/enrich-from-supplier.ts already reads for products
 * that exist, extended here with the three things a brand-new product also needs:
 * what to call it (scripts/lib/hill-item.ts), an image to show, and a category to sit
 * in. **The supplier's own description text is never read here, same as there** — see
 * that file's note on why this is not the "supplier data feed" the standing
 * constraints forbid: facts, never prose, and every description still gets written
 * per product, by hand, separately.
 *
 * Robots.txt disallows `/search/`, `/seasonal/`, `/roomsets/`,
 * `/products/store-locator/` and `/item/pdfview/`. It allows `/item/`, matched through
 * the published sitemap rather than the search endpoint — the one thing robots.txt
 * actually rules out. One request at a time with a pause between.
 *
 * **No price is written, ever.** Trade pricing is behind a login this script does not
 * hold, so the supplier's page shows none to a logged-out request anyway — Kaiku's
 * prices are Damien's regardless. Every draft this creates is invalid in Studio (price
 * is a required field) until he sets one, which is the same guard
 * scripts/import-supplier-products.ts relies on.
 *
 * Every draft is created without a summary or description. Damien is writing those
 * himself; this only sets what a description needs to be written *from* — dimensions,
 * weight, material, colour, barcode, the supplier's own code and page, and the
 * photographs — plus a category, so the range exists to write into rather than a
 * pile of drafts nothing points at.
 *
 *   pnpm tsx --env-file=.env.local scripts/import-hill-decor.ts
 *   pnpm tsx --env-file=.env.local scripts/import-hill-decor.ts --bucket vases --limit 10
 *   pnpm tsx --env-file=.env.local scripts/import-hill-decor.ts --apply
 */
import { createClient } from "@sanity/client";

import { parseItemPage } from "./lib/hill-item";
import {
  cachedFetch,
  HILL_UA,
  itemUrls,
  parseFacts,
  slugify,
} from "./lib/hill-supplier";
import { mapColour, mapMaterials, MATERIAL_MAP } from "./lib/supplier-facets";

const apply = process.argv.includes("--apply");
const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};
const onlyBucket = arg("bucket");
const limit = (() => {
  const n = Number(arg("limit"));
  return Number.isFinite(n) ? n : Infinity;
})();

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

/**
 * Matches scripts/create-decor-categories.ts exactly, so an item classified here has
 * somewhere to go.
 *
 * Order matters: "Astor Distressed Mirrored Square Tray" is a decorative tray, not a
 * wall mirror, so `mirrors` excludes anything with "tray" in the title rather than
 * inventing a sixth category for four items. "Wall plaque" is excluded from wall-art
 * when it names a butcher's cut — those are kitchen prints already claimed by
 * scripts/import-supplier-products.ts's category rules — but a plain decorative plaque
 * belongs here.
 */
const BUCKETS: { slug: string; pattern: RegExp }[] = [
  { slug: "wall-clocks", pattern: /wall clock|skeleton clock|mantel clock/i },
  {
    slug: "candles-and-lanterns",
    pattern: /candle|lantern|hurricane|tea ?light|votive/i,
  },
  { slug: "vases", pattern: /\bvase\b|vessel/i },
  {
    slug: "wall-art",
    pattern:
      /canvas|wall art|framed print|art print|\bplaque\b(?!.*(butcher|kitchen))/i,
  },
  { slug: "mirrors", pattern: /mirror(?!.*\btray\b)/i },
];

function classify(title: string): string | null {
  return BUCKETS.find((b) => b.pattern.test(title))?.slug ?? null;
}

/** Sanity's own slug rule: lowercase, hyphenated, capped at 96 characters. */
function kaikuSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}

async function main() {
  const [allTitles, categories, existingSkus] = await Promise.all([
    client.fetch<string[]>(`*[_type == "product" && defined(title)].title`),
    client.fetch<{ slug: string; id: string }[]>(
      `*[_type == "category" && !(_id in path("drafts.**")) && slug.current in $slugs]{ "slug": slug.current, "id": _id }`,
      { slugs: BUCKETS.map((b) => b.slug) },
    ),
    client.fetch<string[]>(
      `*[_type == "product" && defined(supplierSku) && supplier->name match "Hill*"].supplierSku`,
    ),
  ]);

  const categoryId = new Map(categories.map((c) => [c.slug, c.id]));
  for (const bucket of BUCKETS)
    if (!categoryId.has(bucket.slug))
      console.warn(
        `! category "${bucket.slug}" does not exist yet — run create-decor-categories.ts first`,
      );

  const held = new Set(
    allTitles.map((t) => slugify(t.replace(/\s*\|\s*Kaiku.*$/i, ""))),
  );
  const knownSkus = new Set(existingSkus);

  const urls = await itemUrls();
  const candidates = [...urls.entries()]
    .filter(([slug]) => !held.has(slug))
    .map(([slug, url]) => ({
      slug,
      url,
      bucket: classify(slug.replace(/-/g, " ")),
    }))
    .filter((c): c is typeof c & { bucket: string } => c.bucket !== null)
    .filter((c) => !onlyBucket || c.bucket === onlyBucket);

  console.log(
    `\n${candidates.length} unused Hill items classified into a Decor category` +
      `${onlyBucket ? ` (bucket: ${onlyBucket})` : ""}.\n${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  const counts = new Map<string, number>();
  const unmappedColours = new Set<string>();
  const unmappedMaterials = new Set<string>();
  let created = 0;
  let skippedNoImage = 0;
  let skippedKnownSku = 0;
  let processed = 0;

  for (const candidate of candidates) {
    if (processed >= limit) break;
    processed += 1;

    let html: string;
    try {
      html = await cachedFetch(candidate.url, candidate.slug);
    } catch (error) {
      console.log(`  ! ${candidate.slug} — ${(error as Error).message}`);
      continue;
    }

    const page = parseItemPage(html);
    if (!page) {
      console.log(`  ! ${candidate.slug} — could not read title/code`);
      continue;
    }
    if (knownSkus.has(page.code)) {
      skippedKnownSku += 1;
      continue;
    }
    if (!page.images.length) {
      skippedNoImage += 1;
      console.log(`  ✗ ${page.title} — no photographs found`);
      continue;
    }

    const facts = parseFacts(html);
    const colour = mapColour(facts.colour);
    const material = mapMaterials(facts.material);
    if (facts.colour && !colour)
      unmappedColours.add(facts.colour.toLowerCase());
    for (const part of (facts.material ?? "").split(/,\s*/))
      if (part && !MATERIAL_MAP[part.trim().toLowerCase()])
        unmappedMaterials.add(part.trim().toLowerCase());

    counts.set(candidate.bucket, (counts.get(candidate.bucket) ?? 0) + 1);
    console.log(
      `  ✓ [${candidate.bucket.padEnd(20)}] ${page.title.slice(0, 40).padEnd(40)} ` +
        `${page.images.length} photo(s)  ${material.join("/") || "—"}  ${colour ?? "—"}  ` +
        `${facts.weightKg ? `${facts.weightKg}kg` : "—"}`,
    );

    if (!apply) continue;

    const categoryRef = categoryId.get(candidate.bucket);
    if (!categoryRef) continue;

    const assetRefs: {
      _key: string;
      _type: "image";
      asset: { _type: "reference"; _ref: string };
    }[] = [];
    for (const [i, imageUrl] of page.images.entries()) {
      const response = await fetch(imageUrl, {
        headers: { "User-Agent": HILL_UA },
      });
      if (!response.ok) continue;
      const buffer = Buffer.from(await response.arrayBuffer());
      const asset = await client.assets.upload("image", buffer, {
        filename: `hill-${page.code}-${i}.jpg`,
      });
      assetRefs.push({
        _key: `img-${i}`,
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      });
    }
    if (!assetRefs.length) {
      console.log(
        `      ! all photo downloads failed for ${page.code} — not created`,
      );
      continue;
    }

    const dims =
      facts.lengthCm || facts.widthCm || facts.heightCm
        ? {
            _type: "dimensions" as const,
            length: facts.lengthCm,
            width: facts.widthCm,
            height: facts.heightCm,
            unit: "cm" as const,
          }
        : undefined;

    await client.createIfNotExists({
      _id: `drafts.hill-decor-${page.code}`,
      _type: "product",
      title: `${page.title} | Kaiku`,
      slug: { _type: "slug", current: kaikuSlug(page.title) },
      category: { _type: "reference", _ref: categoryRef },
      supplier: { _type: "reference", _ref: "supplier-hill-interiors" },
      supplierSku: page.code,
      sourceUrl: candidate.url,
      gallery: assetRefs,
      ...(dims ? { dimensions: dims } : {}),
      ...(facts.weightKg
        ? { weight: { _type: "weight", value: facts.weightKg, unit: "kg" } }
        : {}),
      ...(facts.barcode ? { gtin: facts.barcode } : {}),
      ...(material.length ? { materialTags: material } : {}),
      ...(colour ? { colourTags: [colour], primaryColour: colour } : {}),
      currency: "GBP",
      stockStatus: "In Stock",
    });
    created += 1;
  }

  console.log(
    `\n${created ? `created ${created} drafts. ` : ""}` +
      `${skippedKnownSku} already listed (matched by supplier code), ` +
      `${skippedNoImage} skipped for no photographs.\n`,
  );
  console.log("By category:");
  for (const [bucket, count] of counts)
    console.log(`  ${String(count).padStart(4)}  ${bucket}`);

  if (unmappedColours.size)
    console.log(
      `\ncolours with no canonical tag: ${[...unmappedColours].join(", ")}`,
    );
  if (unmappedMaterials.size)
    console.log(
      `materials with no canonical tag: ${[...unmappedMaterials].join(", ")}`,
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
