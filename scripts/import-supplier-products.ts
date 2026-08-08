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
  if (!categorySlug) {
    console.error("--category <sanity-category-slug> is required.");
    process.exit(1);
  }

  const picked = sources.slice(0, limit);
  console.log(
    `\n${picked.length} product(s) parsed${sources.length > picked.length ? ` (of ${sources.length})` : ""}\n`,
  );
  for (const p of picked) {
    console.log(`  ${p.title.slice(0, 62)}`);
    const imageCount = p.images.length + (p.localFiles?.length ?? 0);
    console.log(
      `    sku=${p.sku ?? "—"}  images=${imageCount}  source price=${p.price ?? "—"}`,
    );
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

  const category = await client.fetch<{ _id: string } | null>(
    `*[_type=="category" && slug.current==$slug][0]{_id}`,
    { slug: categorySlug },
  );
  if (!category) throw new Error(`No category with slug "${categorySlug}".`);

  let created = 0;
  let skipped = 0;
  for (const p of picked) {
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

    for (const file of (p.localFiles ?? []).slice(0, 8)) {
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

    for (const url of p.images.slice(0, 8)) {
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
      category: { _type: "reference", _ref: category._id },
      ...(p.description ? { description: p.description } : {}),
      ...(p.sku ? { sku: p.sku } : {}),
      ...(p.sourceUrl ? { sourceUrl: p.sourceUrl } : {}),
      ...(gallery.length ? { gallery } : {}),
      stockStatus: "Coming Soon",
      currency: "GBP",
    });
    console.log(`  + ${p.title.slice(0, 52)}  (${gallery.length} images)`);
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
