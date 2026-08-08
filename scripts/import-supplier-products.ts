/**
 * Supplier product importer — Sanity drafts from a supplier's own data.
 *
 * Deliberately does NOT scrape. Aosom's storefront sits behind Akamai bot
 * protection that returns 403 to automated requests (robots.txt included), and
 * working around that is both off the table and unmaintainable. So this reads
 * data you already legitimately have, in whichever of three shapes you can get:
 *
 *   --csv <file>    A delimited export from the trade portal. Headers are
 *                   resolved by name, so column order does not matter.
 *   --html <dir>    Product pages saved from your own browser (File > Save).
 *                   Read via JSON-LD `Product` structured data, which almost
 *                   every ecommerce platform emits — far steadier than CSS
 *                   selectors, which change with every theme tweak.
 *   --json <file>   A hand-built array of { title, description, images, sku }.
 *
 * Dry-run by default: prints exactly what it would create and writes nothing.
 * Pass --apply to commit. Everything lands as a DRAFT.
 *
 * Prices are never written, per instruction. Where the source has one it is
 * printed in the dry-run so you can judge which products are competitive
 * before importing. The product schema requires a positive price, so each
 * draft stays invalid in Studio until you set it — which is the intended
 * guard, not an oversight: it makes publishing without a price impossible.
 *
 * Usage:
 *   pnpm tsx --env-file=.env.local scripts/import-supplier-products.ts \
 *     --html ./aosom-pages --category pergolas
 *   ... then re-run with --apply
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@sanity/client";

interface SourceProduct {
  title: string;
  description?: string;
  images: string[];
  sku?: string;
  brand?: string;
  /** Printed for your pricing decision; never written to Sanity. */
  price?: string;
  sourceUrl?: string;
  /** Absolute paths to images already on disk, for the --images mode. */
  localFiles?: string[];
}

/* ------------------------------------------------------------------ args -- */

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}
const flag = (name: string) => process.argv.includes(`--${name}`);

const csvPath = arg("csv");
const htmlDir = arg("html");
const jsonPath = arg("json");
const imagesDir = arg("images");
const noImages = flag("no-images");
const categorySlug = arg("category");
const limit = Number(arg("limit") ?? "500");
const apply = flag("apply");

/* ------------------------------------------------------------------- csv -- */

/**
 * Quote-aware splitter. A naive `split(",")` is what previously read an
 * unquoted `£1,299.99` as two columns and shifted every field after it,
 * importing an RRP of £1.
 */
function splitRow(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

const canon = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Exact header match first, then substring — longest candidate wins, so
 * "Product Name" beats a stray "Name" when both are present. */
function findColumn(headers: string[], candidates: string[]): number {
  for (const c of candidates) {
    const i = headers.findIndex((h) => canon(h) === canon(c));
    if (i !== -1) return i;
  }
  let best = -1;
  let bestLen = 0;
  for (const c of candidates) {
    headers.forEach((h, i) => {
      if (canon(h).includes(canon(c)) && canon(h).length > bestLen) {
        best = i;
        bestLen = canon(h).length;
      }
    });
  }
  return best;
}

function fromCsv(path: string): SourceProduct[] {
  const text = readFileSync(path, "utf8").replace(/^﻿/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) throw new Error(`${path} is empty`);

  const delimiter = (lines[0]!.match(/\t/g) ?? []).length > 0 ? "\t" : ",";
  const headers = splitRow(lines[0]!, delimiter);

  const col = {
    title: findColumn(headers, ["product name", "title", "name", "item name"]),
    desc: findColumn(headers, ["description", "long description", "details"]),
    sku: findColumn(headers, ["sku", "product code", "item code", "model"]),
    brand: findColumn(headers, ["brand", "manufacturer"]),
    price: findColumn(headers, ["rrp", "retail price", "price", "unit rrp"]),
    url: findColumn(headers, ["url", "product url", "link"]),
    images: findColumn(headers, ["images", "image urls", "image", "photo"]),
  };
  if (col.title === -1)
    throw new Error(
      `No title column found. Headers seen: ${headers.join(" | ")}`,
    );

  const out: SourceProduct[] = [];
  lines.slice(1).forEach((line, n) => {
    const cells = splitRow(line, delimiter);
    // Refuse a shifted row outright rather than importing misaligned fields.
    if (cells.length !== headers.length) {
      console.warn(
        `  ! line ${n + 2}: ${cells.length} cells vs ${headers.length} headers — skipped`,
      );
      return;
    }
    const pick = (i: number) => (i === -1 ? undefined : cells[i] || undefined);
    const title = pick(col.title);
    if (!title) return;
    out.push({
      title,
      description: pick(col.desc),
      sku: pick(col.sku),
      brand: pick(col.brand),
      price: pick(col.price),
      sourceUrl: pick(col.url),
      images: (pick(col.images) ?? "")
        .split(/[|,;\s]+/)
        .filter((u) => /^https?:\/\//.test(u)),
    });
  });
  return out;
}

/* ------------------------------------------------------------------ html -- */

/** Pull every JSON-LD block and return the first object whose @type is Product. */
function productFromJsonLd(html: string): SourceProduct | null {
  const blocks = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];
  for (const [, raw] of blocks) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw!.trim());
    } catch {
      continue;
    }
    const queue: unknown[] = [parsed];
    while (queue.length) {
      const node = queue.shift();
      if (Array.isArray(node)) {
        queue.push(...node);
        continue;
      }
      if (!node || typeof node !== "object") continue;
      const o = node as Record<string, unknown>;
      if (Array.isArray(o["@graph"])) queue.push(...o["@graph"]);
      const type = o["@type"];
      const isProduct = Array.isArray(type)
        ? type.includes("Product")
        : type === "Product";
      if (!isProduct || typeof o.name !== "string") continue;

      const image = o.image;
      const images = (
        Array.isArray(image) ? image : image ? [image] : []
      ).flatMap((i) =>
        typeof i === "string"
          ? [i]
          : i &&
              typeof i === "object" &&
              typeof (i as { url?: unknown }).url === "string"
            ? [(i as { url: string }).url]
            : [],
      );
      const offers = (Array.isArray(o.offers) ? o.offers[0] : o.offers) as
        Record<string, unknown> | undefined;
      const brand = o.brand as Record<string, unknown> | string | undefined;

      return {
        title: o.name,
        description:
          typeof o.description === "string" ? o.description : undefined,
        images: images.filter((u) => /^https?:\/\//.test(u)),
        sku: typeof o.sku === "string" ? o.sku : undefined,
        brand:
          typeof brand === "string"
            ? brand
            : typeof brand?.name === "string"
              ? brand.name
              : undefined,
        price: offers?.price != null ? String(offers.price) : undefined,
        sourceUrl: typeof o.url === "string" ? o.url : undefined,
      };
    }
  }
  return null;
}

function fromHtmlDir(dir: string): SourceProduct[] {
  const out: SourceProduct[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (!statSync(full).isFile() || !/\.html?$/i.test(entry)) continue;
    const found = productFromJsonLd(readFileSync(full, "utf8"));
    if (found) out.push(found);
    else console.warn(`  ! ${entry}: no JSON-LD Product block found — skipped`);
  }
  return out;
}

/* ------------------------------------------------------------ categorise -- */

/**
 * Keyword to category-slug rules, applied to the product title when no
 * --category is given. Ordered: the first match wins, so the more specific
 * rules must come first — "outdoor floor lamp" has to reach the outdoor rule
 * before the generic lighting one, and a "desk lamp" is lighting rather than a
 * desk.
 *
 * Every slug here is a real category in the dataset. A title matching nothing
 * is reported rather than guessed at, because filing a product into the wrong
 * room is worse than leaving it for a human — it puts a ceiling fan in the
 * garden and quietly makes the catalogue untrustworthy.
 */
const CATEGORY_RULES: { pattern: RegExp; slug: string }[] = [
  // Lighting first, and deliberately so. A lamp is a lamp wherever it stands:
  // "Solar Lamp Post, Street Light with Planter" was landing in planters and
  // "Solar Rattan Floor Lamp" in garden-furniture, because a descriptive word
  // further along the title matched an outdoor rule first. What someone is
  // shopping for there is a light.
  {
    pattern:
      /lamp post|street light|\blamp\b|lantern|\bsconce\b|ceiling fan|chandelier|pendant|flush mount|floor light/i,
    slug: "lighting",
  },

  // Then outdoor structures and furniture.
  { pattern: /pergola|gazebo|canopy/i, slug: "pergolas" },
  { pattern: /fire ?pit|patio heater|chiminea|log burner/i, slug: "fire-pits" },
  {
    pattern: /water (feature|fountain)|fountain|waterfall|pond/i,
    slug: "water-features",
  },
  {
    pattern: /privacy screen|trellis|fence panel|garden screen/i,
    slug: "privacy-screens",
  },
  { pattern: /planter|plant stand|grow bag|raised bed/i, slug: "planters" },
  {
    pattern: /(garden|outdoor|patio).*(shed|storage|deck box)|shed/i,
    slug: "outdoor-storage",
  },
  // Cooking outdoors beats furniture for the same reason lighting does. Most
  // BBQ trolleys list their side tables in the title, so "4 Burner Gas BBQ
  // Grill Outdoor … Trolley with Side Table" was landing in garden-furniture
  // while the charcoal ones went to outdoor-kitchens — the same product type
  // split across two categories by an incidental word.
  {
    pattern: /bbq|barbecue|pizza oven|grill|smoker/i,
    slug: "outdoor-kitchens",
  },
  {
    pattern:
      /(rattan|garden|patio|outdoor).*(sofa|chair|table|bench|lounger|parasol|swing|furniture)/i,
    slug: "garden-furniture",
  },
  // Indoor
  { pattern: /computer desk|writing desk|\bdesk\b/i, slug: "desks" },
  { pattern: /bedside (table|cabinet)|nightstand/i, slug: "bedside-tables" },
  { pattern: /coffee table/i, slug: "coffee-tables" },
  { pattern: /\brug\b|runner rug/i, slug: "rugs" },
  { pattern: /towel rail|towel radiator/i, slug: "towel-rails" },
  { pattern: /mirror/i, slug: "bathroom-mirrors" },
  { pattern: /bookcase|shelving unit|\bshelves\b|shelf/i, slug: "shelving" },
  {
    pattern: /wardrobe|chest of drawers|drawer unit|sideboard|cabinet/i,
    slug: "living-room-storage",
  },
  // Catch-all for anything light-shaped the named rules above did not claim.
  { pattern: /\blight(ing)?\b|\bLED\b/i, slug: "lighting" },
];

function inferCategory(title: string): string | null {
  return CATEGORY_RULES.find((r) => r.pattern.test(title))?.slug ?? null;
}

/**
 * Cross-listing. A product has one primary `category` and any number of
 * `additionalCategories` ("Also shown in these categories"), and the category
 * query matches either — so a lamp can sit in Lighting *and* turn up when
 * someone browses Bedroom, without being duplicated as two documents.
 *
 * This matters more than it sounds: a shopper who opens Bedroom → Bedroom
 * Lighting and finds it empty concludes we don't sell bedside lamps, while
 * eight of them sit one department away under the generic Lighting heading.
 * Cross-listing also makes those room categories count as stocked, so they
 * enter the sitemap and stop being noindexed.
 *
 * Room is taken from the title where the supplier states it ("for Living Room,
 * Bedroom") and inferred from the fixture type where it doesn't — a bedside
 * lamp belongs to a bedroom whether or not the word appears.
 */
const ROOM_LIGHTING_RULES: { pattern: RegExp; slug: string }[] = [
  {
    pattern:
      /living ?room|lounge|floor lamp|standing lamp|arc (tree )?lamp|tripod|chandelier|flush mount|pendant|ceiling (light|fan)/i,
    slug: "living-room-lighting",
  },
  {
    pattern: /bedroom|bedside|nightstand|chandelier|ceiling fan/i,
    slug: "bedroom-lighting",
  },
  {
    pattern: /office|study|desk lamp|task (lamp|light)|reading lamp/i,
    slug: "office-lighting",
  },
  {
    pattern: /kitchen|under.?cabinet|island pendant/i,
    slug: "kitchen-lighting",
  },
  {
    pattern: /bathroom|vanity (light|lamp)|mirror light/i,
    slug: "bathroom-lighting",
  },
];

/**
 * An outdoor light gets no room cross-listing. "Solar Rattan Floor Lamp" would
 * otherwise match the floor-lamp rule and be offered to someone shopping for a
 * living room, which is worse than not appearing at all. There is currently no
 * garden-lighting category to send these to, so they stay in Lighting alone.
 */
const OUTDOOR_LIGHT =
  /solar|outdoor|garden|patio|pathway|path light|lamp post|street light|bollard|driveway/i;

function inferAdditionalCategories(title: string, primary: string): string[] {
  if (primary !== "lighting") return [];
  if (OUTDOOR_LIGHT.test(title)) return [];
  return ROOM_LIGHTING_RULES.filter((r) => r.pattern.test(title))
    .map((r) => r.slug)
    .filter((slug) => slug !== primary);
}

/* ---------------------------------------------------------------- images -- */

/**
 * A folder of saved product images, where the filename carries the title —
 * which is what a browser's "Save Image As" gives you, since it names the file
 * after the page title.
 *
 * Titles are recovered by stripping the extension and the site's own suffix.
 * Colons become slashes: macOS stores a "/" in a filename as ":", so
 * "Trolley w: Warming Rack" was "Trolley w/ Warming Rack" on the page, and
 * "Auto On:Off" was "Auto On/Off".
 *
 * This yields a title and one image and nothing else — no SKU, no description,
 * no dimensions. That is a deliberately thin import for filling a category
 * quickly; everything else has to be added in Studio.
 */
function fromImagesDir(dir: string): SourceProduct[] {
  const out: SourceProduct[] = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (!statSync(full).isFile()) continue;
    if (!/\.(png|jpe?g|webp|avif)$/i.test(entry)) continue;

    const title = entry
      .replace(/\.(png|jpe?g|webp|avif)$/i, "")
      .replace(/\s*[|–—-]\s*Aosom(\s+UK)?\s*$/i, "")
      .replace(/:/g, "/")
      .replace(/\s+/g, " ")
      .trim();

    if (!title) {
      console.warn(`  ! ${entry}: no title left after cleaning — skipped`);
      continue;
    }
    // localFiles, not images: these are on disk, not fetchable URLs.
    out.push({ title, images: [], localFiles: [full] });
  }
  return out;
}

/* ----------------------------------------------------------------- sanity -- */

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/\|.*$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);

async function main() {
  const sources = csvPath
    ? fromCsv(csvPath)
    : htmlDir
      ? fromHtmlDir(htmlDir)
      : imagesDir
        ? fromImagesDir(imagesDir)
        : jsonPath
          ? (JSON.parse(readFileSync(jsonPath, "utf8")) as SourceProduct[])
          : null;

  if (!sources) {
    console.error(
      "Give one input: --csv <file> | --html <dir> | --images <dir> | --json <file>\n" +
        "Plus --category <sanity-category-slug>. Add --apply to write.",
    );
    process.exit(1);
  }
  // --category forces one category for everything; without it each title is
  // matched against CATEGORY_RULES. Either way the mapping is printed before
  // anything is written.
  const resolved = sources.map((p) => {
    const slug = categorySlug ?? inferCategory(p.title);
    return {
      product: p,
      slug,
      extras: slug ? inferAdditionalCategories(p.title, slug) : [],
    };
  });
  const unmatched = resolved.filter((r) => !r.slug);
  if (unmatched.length) {
    console.log(`\n${unmatched.length} title(s) matched no category rule:\n`);
    for (const u of unmatched)
      console.log(`  ? ${u.product.title.slice(0, 70)}`);
    console.log(
      "\nThese are skipped rather than guessed at. Either pass --category to\n" +
        "place them all in one category, or tell me the right one for each.\n",
    );
  }

  type Picked = { product: SourceProduct; slug: string; extras: string[] };
  const picked = resolved
    .filter((r): r is Picked => Boolean(r.slug))
    .slice(0, limit);

  console.log(
    `\n${picked.length} product(s) to import, grouped by category:\n`,
  );
  const byCategory = new Map<string, Picked[]>();
  for (const row of picked) {
    byCategory.set(row.slug, [...(byCategory.get(row.slug) ?? []), row]);
  }
  for (const [slug, items] of [...byCategory].sort()) {
    console.log(`  ${slug}  (${items.length})`);
    for (const { product: item, extras } of items) {
      const imageCount = noImages
        ? 0
        : item.images.length + (item.localFiles?.length ?? 0);
      console.log(
        `    - ${item.title.slice(0, 66)}${imageCount ? `  [${imageCount} img]` : ""}`,
      );
      // Printed under the product, not as its own group, so it stays obvious
      // which category owns the product and which merely show it.
      if (extras.length)
        console.log(`        also shows in: ${extras.join(", ")}`);
    }
    console.log("");
  }

  if (!apply) {
    console.log(
      "\nDry run — nothing written. Re-run with --apply once the list looks right.\n" +
        "Prices above are from the source and are NOT imported; each draft stays\n" +
        "invalid in Studio until you set a price, which is intentional.\n",
    );
    return;
  }

  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) throw new Error("SANITY_API_WRITE_TOKEN is not set.");
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
    token,
    useCdn: false,
  });

  // Resolve every distinct category once, and fail loudly on a bad slug rather
  // than silently importing products with no category.
  const slugs = [...new Set(picked.flatMap((r) => [r.slug, ...r.extras]))];
  const categoryIds = new Map<string, string>();
  for (const slug of slugs) {
    const found = await client.fetch<{ _id: string } | null>(
      `*[_type=="category" && slug.current==$slug][0]{_id}`,
      { slug },
    );
    if (!found) throw new Error(`No category with slug "${slug}".`);
    categoryIds.set(slug, found._id);
  }

  let created = 0;
  let skipped = 0;
  for (const { product: p, slug, extras } of picked) {
    const base = slugify(p.sku ? `${p.title}-${p.sku}` : p.title);
    const id = `drafts.product-import-${base}`;
    if (await client.fetch<boolean>(`defined(*[_id==$id][0]._id)`, { id })) {
      console.log(`  = exists, skipped: ${p.title.slice(0, 50)}`);
      skipped++;
      continue;
    }

    // Upload each image as a Sanity asset. A supplier CDN may refuse an
    // automated fetch; when it does, the product is still created and the
    // failure is named rather than swallowed.
    const gallery: Record<string, unknown>[] = [];

    // --no-images: the saved files are full-page screenshots (2648x18298 and
    // similar), not product photography. Uploading one as the product image
    // would put a squashed screengrab on the tile and the detail page, which
    // looks broken. Better to import the title and add real photos later.
    for (const file of (noImages ? [] : (p.localFiles ?? [])).slice(0, 8)) {
      try {
        const asset = await client.assets.upload("image", readFileSync(file), {
          filename: file.split("/").pop() || "image.png",
        });
        gallery.push({
          _type: "image",
          _key: asset._id.slice(-12),
          asset: { _type: "reference", _ref: asset._id },
        });
      } catch (err) {
        console.warn(
          `    ! local image failed (${file}): ${(err as Error).message}`,
        );
      }
    }

    for (const url of (noImages ? [] : p.images).slice(0, 8)) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const asset = await client.assets.upload(
          "image",
          Buffer.from(await res.arrayBuffer()),
          { filename: url.split("/").pop() || "image.jpg" },
        );
        gallery.push({
          _type: "image",
          _key: asset._id.slice(-12),
          asset: { _type: "reference", _ref: asset._id },
        });
      } catch (err) {
        console.warn(
          `    ! image failed (${url.slice(0, 60)}): ${(err as Error).message}`,
        );
      }
    }

    await client.createIfNotExists({
      _id: id,
      _type: "product",
      title: p.title,
      slug: { _type: "slug", current: slugify(p.title) },
      category: { _type: "reference", _ref: categoryIds.get(slug)! },
      ...(extras.length
        ? {
            additionalCategories: extras.map((extra, index) => ({
              _type: "reference",
              _key: `additional-category-${index}`,
              _ref: categoryIds.get(extra)!,
            })),
          }
        : {}),
      ...(p.description ? { description: p.description } : {}),
      ...(p.sku ? { sku: p.sku } : {}),
      ...(p.sourceUrl ? { sourceUrl: p.sourceUrl } : {}),
      ...(gallery.length ? { gallery } : {}),
      stockStatus: "Coming Soon",
      currency: "GBP",
    });
    console.log(
      `  + [${slug}${extras.length ? ` +${extras.length}` : ""}] ${p.title.slice(0, 46)}  (${gallery.length} images)`,
    );
    created++;
  }

  console.log(
    `\nDone. ${created} draft(s) created, ${skipped} already existed.\n` +
      "They are DRAFTS with no price — set price (and check the category) in\n" +
      "Studio, then publish.\n",
  );
}

void main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
