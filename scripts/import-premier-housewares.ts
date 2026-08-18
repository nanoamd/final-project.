/**
 * Fills stock from Premier Housewares — a trade account Damien applied for and was
 * accepted into. Prioritises the outdoor range first: garden-furniture, planters and
 * outdoor-storage are processed before the indoor Decor categories, and the summary
 * reports outdoor counts on their own line, because that is what was asked for
 * ("especially the outdoor selection") even though the account covers the same kind
 * of general homewares range as Hill Interiors.
 *
 * Reads each item's own page for its title, SKU, photographs and specification list
 * — see scripts/lib/premier-housewares.ts for why this is not the "supplier data
 * feed" the standing constraints forbid: facts, never the "Description" tab's prose,
 * and every description on the site still gets written per product, by hand,
 * separately.
 *
 * `robots.txt` disallows only a handful of transactional endpoints (`/cart.php`,
 * `/login.php`, `/search.php`, `/productimage.php`, `/admin/`, …) and names
 * `Claude-Web`/`ClaudeBot`/`anthropic-ai` explicitly with a 10-second crawl delay —
 * honoured here via `PH_DELAY_MS`, not just the faster pace an anonymous User-Agent
 * could get away with. Discovery goes through the site's own two-page product
 * sitemap, the same non-search route scripts/lib/hill-supplier.ts uses.
 *
 * **No price is written, ever.** Trade pricing sits behind `/login.php`, which this
 * script does not hold, so a logged-out page shows none to accidentally import —
 * Kaiku's prices are Damien's regardless. Every draft this creates is invalid in
 * Studio (price is a required field) until he sets one.
 *
 * **No weight is written.** The only weight figure on these pages is "Cart Weight
 * (kg)" — the packed shipping weight, not the item's own — and recording it as the
 * product's weight would be guessing at a number the page never actually gives.
 * Left unset rather than mislabelled, the same call scripts/enrich-from-supplier.ts
 * makes for a delivery lead time nobody has confirmed.
 *
 * Every draft is created without a summary or description. Damien is writing those
 * himself; this only sets what a description needs to be written *from*.
 *
 *   pnpm tsx --env-file=.env.local scripts/import-premier-housewares.ts
 *   pnpm tsx --env-file=.env.local scripts/import-premier-housewares.ts --bucket planters --limit 10
 *   pnpm tsx --env-file=.env.local scripts/import-premier-housewares.ts --apply
 */
import { createClient } from "@sanity/client";

import {
  cachedFetch,
  parseProductPage,
  PH_UA,
  productUrls,
  slugify,
} from "./lib/premier-housewares";
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
 * Outdoor first, on purpose — see the file header. `mirrors` excludes "tray" for
 * the same reason scripts/import-hill-decor.ts does: a handful of decorative
 * hanging trays have "mirror" in the name and are not wall mirrors.
 */
/**
 * "Rattan" alone is not enough for garden-furniture: Premier Housewares uses it
 * for pendant lampshades, mirror frames and baskets just as often as for a
 * chair, so a bare `/rattan/` match put "Jaya Black Rattan Overlapping Pendant
 * Light" in the furniture range on the first dry run. Requiring a furniture
 * noun as well, and excluding titles that are clearly something else (a
 * light, a mirror, a cushion), is what a plain material-word regex can't do
 * alone.
 */
const FURNITURE_NOUN =
  /\b(chair|sofa|table|bench|stool|footstool|set|suite|day ?bed|chaise|swing|hammock|parasol|lounger|shelving)\b/i;
const NOT_FURNITURE =
  /light|lamp|shade|mirror|clock|vase|planter|cushion|rug|throw|pillow|tray|basket/i;

const BUCKETS: {
  slug: string;
  test: (title: string) => boolean;
  outdoor: boolean;
}[] = [
  {
    slug: "garden-furniture",
    test: (t) =>
      /patio|rattan|conservatory|garden|outdoor/i.test(t) &&
      FURNITURE_NOUN.test(t) &&
      !NOT_FURNITURE.test(t),
    outdoor: true,
  },
  {
    slug: "planters",
    test: (t) => /\bplanters?\b|plant stand/i.test(t),
    outdoor: true,
  },
  {
    slug: "outdoor-storage",
    test: (t) => /garden storage|outdoor storage|deck box/i.test(t),
    outdoor: true,
  },
  {
    slug: "wall-clocks",
    test: (t) => /wall clock|mantel clock|skeleton clock/i.test(t),
    outdoor: false,
  },
  {
    slug: "candles-and-lanterns",
    test: (t) => /candle|lantern|hurricane|tea ?light|votive/i.test(t),
    outdoor: false,
  },
  { slug: "vases", test: (t) => /\bvase\b|\burn\b/i.test(t), outdoor: false },
  {
    slug: "wall-art",
    test: (t) => /canvas|wall art|framed print|art print/i.test(t),
    outdoor: false,
  },
  {
    slug: "mirrors",
    test: (t) => /mirror/i.test(t) && !/\btray\b/i.test(t),
    outdoor: false,
  },
];

function classify(title: string): (typeof BUCKETS)[number] | null {
  return BUCKETS.find((b) => b.test(title)) ?? null;
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
      `*[_type == "product" && defined(supplierSku) && supplier->name == "Premier Housewares"].supplierSku`,
    ),
  ]);

  const categoryId = new Map(categories.map((c) => [c.slug, c.id]));
  for (const bucket of BUCKETS)
    if (!categoryId.has(bucket.slug))
      console.warn(`! category "${bucket.slug}" does not exist — skipping it`);

  const held = new Set(
    allTitles.map((t) => slugify(t.replace(/\s*\|\s*Kaiku.*$/i, ""))),
  );
  const knownSkus = new Set(existingSkus);

  const urls = await productUrls();
  const candidates = [...urls.entries()]
    .filter(([slug]) => !held.has(slug))
    .map(([slug, url]) => ({
      slug,
      url,
      bucket: classify(slug.replace(/-/g, " ")),
    }))
    .filter(
      (c): c is typeof c & { bucket: NonNullable<typeof c.bucket> } =>
        c.bucket !== null,
    )
    .filter((c) => !onlyBucket || c.bucket.slug === onlyBucket)
    // Outdoor buckets first, so a --limit run (or an interrupted one) covers the
    // outdoor range before it touches the indoor Decor categories.
    .sort((a, b) => Number(b.bucket.outdoor) - Number(a.bucket.outdoor));

  console.log(
    `\n${candidates.length} unused Premier Housewares items classified` +
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

    const page = parseProductPage(html);
    if (!page) {
      console.log(`  ! ${candidate.slug} — could not read title/SKU`);
      continue;
    }
    if (knownSkus.has(page.sku)) {
      skippedKnownSku += 1;
      continue;
    }
    // The title regex that built `candidates` is deliberately loose (it has to
    // catch "rattan" in a title before the page is even fetched); the
    // supplier's own breadcrumb, only available now, is the authoritative
    // check for whether this is genuinely their outdoor range rather than an
    // indoor rattan chest of drawers or coffee table wearing the same word —
    // see scripts/lib/premier-housewares.ts's note on `categoryPath`.
    if (
      candidate.bucket.slug === "garden-furniture" &&
      !page.categoryPath.some((name) =>
        /conservatory|outdoor|garden/i.test(name),
      )
    ) {
      console.log(
        `  · ${page.title.slice(0, 50)} — not filed under Conservatory and Outdoor (${page.categoryPath.join(" > ") || "no breadcrumb"}), skipped`,
      );
      continue;
    }
    if (!page.images.length) {
      skippedNoImage += 1;
      console.log(`  ✗ ${page.title} — no photographs found`);
      continue;
    }

    const colour = mapColour(page.colour);
    const material = mapMaterials(page.materials.join(", "));
    if (page.colour && !colour) unmappedColours.add(page.colour.toLowerCase());
    for (const part of page.materials)
      if (part && !MATERIAL_MAP[part]) unmappedMaterials.add(part);

    counts.set(
      candidate.bucket.slug,
      (counts.get(candidate.bucket.slug) ?? 0) + 1,
    );
    console.log(
      `  ✓ [${candidate.bucket.slug.padEnd(18)}] ${page.title.slice(0, 40).padEnd(40)} ` +
        `${page.images.length} photo(s)  ${material.join("/") || "—"}  ${colour ?? "—"}`,
    );

    if (!apply) continue;

    const categoryRef = categoryId.get(candidate.bucket.slug);
    if (!categoryRef) continue;

    const assetRefs: {
      _key: string;
      _type: "image";
      asset: { _type: "reference"; _ref: string };
    }[] = [];
    for (const [i, imageUrl] of page.images.entries()) {
      const response = await fetch(imageUrl, {
        headers: { "User-Agent": PH_UA },
      });
      if (!response.ok) continue;
      const buffer = Buffer.from(await response.arrayBuffer());
      const asset = await client.assets.upload("image", buffer, {
        filename: `premier-housewares-${page.sku}-${i}.jpg`,
      });
      assetRefs.push({
        _key: `img-${i}`,
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      });
    }
    if (!assetRefs.length) {
      console.log(
        `      ! all photo downloads failed for ${page.sku} — not created`,
      );
      continue;
    }

    await client.createIfNotExists({
      _id: `drafts.premier-housewares-${page.sku}`,
      _type: "product",
      title: `${page.title} | Kaiku`,
      slug: { _type: "slug", current: kaikuSlug(page.title) },
      category: { _type: "reference", _ref: categoryRef },
      supplier: { _type: "reference", _ref: "supplier-premier-housewares" },
      supplierSku: page.sku,
      sourceUrl: candidate.url,
      gallery: assetRefs,
      ...(page.dimensions
        ? {
            dimensions: {
              _type: "dimensions",
              length: page.dimensions.length,
              width: page.dimensions.width,
              height: page.dimensions.height,
              unit: "cm",
            },
          }
        : {}),
      ...(page.barcode ? { gtin: page.barcode } : {}),
      ...(material.length ? { materialTags: material } : {}),
      ...(colour ? { colourTags: [colour], primaryColour: colour } : {}),
      currency: "GBP",
      stockStatus: "In Stock",
    });
    created += 1;
  }

  console.log(
    `\n${created ? `created ${created} drafts. ` : ""}` +
      `${skippedKnownSku} already listed (matched by supplier SKU), ` +
      `${skippedNoImage} skipped for no photographs.\n`,
  );
  console.log("By category:");
  const outdoorSlugs = new Set(
    BUCKETS.filter((b) => b.outdoor).map((b) => b.slug),
  );
  for (const [bucket, count] of counts)
    console.log(
      `  ${String(count).padStart(4)}  ${bucket}${outdoorSlugs.has(bucket) ? "  (outdoor)" : ""}`,
    );

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
