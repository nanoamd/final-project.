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
import { pathToFileURL } from "node:url";

import { createClient } from "@sanity/client";

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: "cm" | "mm";
}

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

  /* Everything below is read from the saved page beyond the JSON-LD basics.
   * A supplier page carries far more than name and images — the Abberley's
   * carries its dimensions, weight, materials, colourways, packed size and lead
   * time — and leaving it behind means re-typing all of it into Studio by hand,
   * 50 times over. */

  dimensions?: ProductDimensions;
  weightKg?: number;
  /** Spec-sheet rows, already label/value shaped. */
  specs?: { label: string; value: string }[];
  /** e.g. "7–10 days", en dash, matching normalise-lead-times.ts output. */
  leadTime?: string;
  /** Colourways the supplier lists, for a Colour option. */
  colours?: string[];
  /** True when the page states delivery is included in the price. */
  freeDelivery?: boolean;
  /** "In Stock" / "Out of Stock", read from the supplier's own stock line. */
  stockStatus?: "In Stock" | "Out of Stock";
  /** Units the supplier holds. Absent when the page gives no number. */
  stockQuantity?: number;
  /** Why the description needs a human read before publishing, if it does. */
  tradeLanguage?: string[];
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
/**
 * When a saved page matches a product already listed, fill in the fields that
 * product is missing instead of skipping it. Never creates a second document,
 * never overwrites a field that already has a value, and never touches price,
 * title or slug.
 */
const fillExisting = flag("fill-existing");

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

/* ------------------------------------------------- html: the rest of it -- */

/** Tags out, entities decoded, whitespace collapsed. */
export function plainText(fragment: string): string {
  return fragment
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/gi, "'")
    .replace(/&eacute;/gi, "é")
    .replace(/&pound;/gi, "£")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * "110W x 50D x 40H cm" → { length: 110, width: 50, height: 40, unit: "cm" }.
 *
 * W maps to length and D to width, which is the convention the catalogue already
 * uses: the Abberley was entered by hand as length 110, width 50, height 40 from
 * a page reading "110W x 50D x 40H cm". Matching it matters, because the product
 * page prints these in a fixed order.
 */
export function parseDimensions(raw: string): ProductDimensions | null {
  const unit = /\bmm\b/i.test(raw) ? "mm" : /\bcm\b/i.test(raw) ? "cm" : null;
  if (!unit) return null;
  const axis = (letter: string) => {
    const m = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${letter}\\b`, "i").exec(raw);
    return m ? Number(m[1]) : null;
  };
  const length = axis("W");
  const width = axis("D");
  const height = axis("H");
  if (length === null || width === null || height === null) return null;
  return { length, width, height, unit };
}

/** "25 kg" / "25kg" / "gross weight 30kg" → the number, in kg. */
export function parseWeightKg(raw: string): number | null {
  const m = /(\d+(?:\.\d+)?)\s*kg\b/i.exec(raw);
  if (m) return Number(m[1]);
  const g = /(\d+(?:\.\d+)?)\s*g\b/i.exec(raw);
  return g ? Number(g[1]) / 1000 : null;
}

/** WooCommerce's additional-information table, as label/value pairs. */
export function attributeRows(
  html: string,
): { label: string; value: string }[] {
  const cells = [
    ...html.matchAll(
      /<t[hd][^>]*class="[^"]*woocommerce-product-attributes-item__(label|value)[^"]*"[^>]*>([\s\S]*?)<\/t[hd]>/gi,
    ),
  ].map((m) => ({ kind: m[1]!.toLowerCase(), text: plainText(m[2]!) }));

  const rows: { label: string; value: string }[] = [];
  for (let i = 0; i < cells.length - 1; i++) {
    if (cells[i]!.kind === "label" && cells[i + 1]!.kind === "value") {
      const label = cells[i]!.text;
      const value = cells[i + 1]!.text;
      if (label && value) rows.push({ label, value });
      i++;
    }
  }
  return rows;
}

/**
 * The description panel, not the JSON-LD `description`.
 *
 * The JSON-LD field holds the meta description — 148 characters of search copy
 * ("made for trade professionals... exclusive trade pricing") — while the panel
 * holds the real product description. Importing the former is how a competitor's
 * trade pitch ends up on a retail product page.
 */
export function descriptionFromHtml(html: string): string | null {
  const panel =
    /<div[^>]*class="[^"]*woocommerce-Tabs-panel--description[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(
      html,
    );
  if (!panel) return null;

  /**
   * Paragraph boundaries kept, as blank lines for toPortableText to split on.
   *
   * Running plainText over the whole panel collapsed every `\n` to a space, so 33
   * of the 74 D.I. Designs descriptions arrived as one wall of text when the
   * supplier had written three or four paragraphs. The paragraphs are the only
   * structure these descriptions have — there are no real headings in any of the
   * 74, just a generic "Description" label above the copy, which is dropped
   * because the product page already labels the section.
   */
  const blocks = [...panel[1]!.matchAll(/<(p|h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map(([, , inner]) => plainText(inner!))
    .filter((text) => text && !/^(description|details|overview)$/i.test(text));

  const text = blocks.length
    ? blocks.join("\n\n")
    : plainText(panel[1]!).replace(/^Description\s*/i, "");
  return text.length > 40 ? text : null;
}

/**
 * Wording that gives away a trade supplier's own audience. None of it belongs on
 * a consumer storefront — "ideal for hotel lobbies, a show home lounge, or a
 * rental property" tells a shopper they are not the customer.
 *
 * Flagged rather than stripped. Cutting sentences automatically would mangle
 * copy, and every one of these needs a human read anyway.
 */
const TRADE_LANGUAGE =
  /\b(trade (?:professionals?|pricing|price|only|customers?|account)|wholesale|hotel(?: lobb(?:y|ies))?|show ?home|showroom|rental propert(?:y|ies)|contract (?:furniture|use)|bulk (?:order|buy)|B2B|RRP)\b/gi;

export function tradeLanguageIn(text: string): string[] {
  return [
    ...new Set(
      [...text.matchAll(TRADE_LANGUAGE)].map((m) => m[0].toLowerCase()),
    ),
  ];
}

/** "ready to ship within 7-10 days" → "7–10 days", the form the page expects. */
export function leadTimeFromHtml(html: string): string | null {
  const text = plainText(html);
  const m =
    /(?:ready to ship|dispatch(?:ed)?|delivery|ships?)\D{0,40}?(\d+)\s*[-–—]\s*(\d+)\s*(working\s+)?(day|days|week|weeks)\b/i.exec(
      text,
    );
  if (!m) return null;
  const unit = m[4]!.toLowerCase().replace(/s$/, "") + "s";
  return `${m[1]}–${m[2]} ${unit}`;
}

/**
 * Whether the page says delivery is included. Deliberately narrow: it must say
 * delivery or shipping is free or included, not merely mention delivery. A false
 * positive here writes a £0 carriage cost and overstates the margin, which is the
 * mistake the margin report exists to catch.
 */
export function freeDeliveryStated(html: string): boolean {
  const text = plainText(html);
  return /\b(free (?:uk |mainland |standard )*(?:delivery|shipping|carriage)|(?:delivery|shipping|carriage) (?:is )?(?:included|free)(?: in the price)?|includes? (?:free )?(?:delivery|shipping|carriage)|price includes delivery)\b/i.test(
    text,
  );
}

/**
 * The supplier's live stock line: "24 in stock", "Out of stock".
 *
 * Worth reading rather than defaulting everything to "Coming Soon". Eight of the
 * 74 pages are out of stock, and a customer ordering one of those starts a
 * conversation that ends in a refund. The quantity also feeds the checkout guard
 * in createCheckoutSession, which already refuses an order for more units than
 * stockQuantity.
 *
 * Prices are hidden behind "Login to view price" on these pages, but stock is
 * not — so this is available even when the trade price is not.
 *
 * A snapshot, not a feed: it is true as of when the page was saved. That is
 * still better than a guess, and better than "Coming Soon" on something with 52
 * units on a shelf.
 */
export function stockFromHtml(
  html: string,
): { status: "In Stock" | "Out of Stock"; quantity?: number } | null {
  const lines = [
    ...html.matchAll(
      /<p[^>]*class="[^"]*\bstock\b[^"]*"[^>]*>([\s\S]*?)<\/p>/gi,
    ),
  ].map((m) => plainText(m[1]!));
  for (const line of lines) {
    if (/out of stock/i.test(line)) return { status: "Out of Stock" };
    const n = /^(\d+)\s+in stock/i.exec(line);
    if (n) return { status: "In Stock", quantity: Number(n[1]) };
    if (/in stock/i.test(line)) return { status: "In Stock" };
  }
  return null;
}

/**
 * Wraps plain text as Portable Text blocks.
 *
 * `description` on the product schema is `richText`, an array of blocks — and the
 * importer was writing a bare string into it. 72 of the 74 D.I. Designs drafts
 * landed that way, which Studio shows as an unreadable field and the product page
 * cannot render at all, because PortableText is handed a string where it expects
 * an array.
 */
export function toPortableText(text: string): Record<string, unknown>[] {
  return text
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para, index) => ({
      _type: "block",
      _key: `imported-${index}`,
      style: "normal",
      markDefs: [],
      children: [
        {
          _type: "span",
          _key: `imported-${index}-0`,
          text: para,
          marks: [],
        },
      ],
    }));
}

/**
 * A short summary, derived from the description.
 *
 * This is not cosmetic: `summary` is the field the Google Merchant feed sends as
 * `<description>` (see MERCHANT_FEED_QUERY), so a product without one is
 * submitted to Google with an empty description and disapproved. 72 of the 74
 * imports had none, because the importer never wrote it.
 *
 * Prefers the first sentences that carry no trade language, so the copy Google
 * sees does not tell a shopper the product is "designed for trade professionals".
 * Falls back to the opening sentence when every sentence is like that — better a
 * flagged summary than an empty one, and those products are already listed as
 * needing a rewrite.
 */
export function deriveSummary(description: string, maxChars = 300): string {
  const sentences = description
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const clean = sentences.filter((s) => tradeLanguageIn(s).length === 0);
  const pool = clean.length ? clean : sentences;

  let out = "";
  for (const sentence of pool) {
    if (out && (out + " " + sentence).length > maxChars) break;
    out = out ? `${out} ${sentence}` : sentence;
    if (out.length >= maxChars) break;
  }
  // A single sentence longer than the cap: trim at a word boundary rather than
  // mid-word, and drop any trailing punctuation the cut left dangling.
  if (out.length > maxChars) {
    out = out
      .slice(0, maxChars)
      .replace(/\s+\S*$/, "")
      .replace(/[,;:]$/, "");
  }
  return out;
}

/** Splits "Brown, Oak" into colourways. */
export function parseColours(raw: string): string[] {
  return raw
    .split(/\s*[,/|]\s*/)
    .map((c) => c.trim())
    .filter((c) => c.length > 1 && c.length < 30);
}

/** Everything the saved page holds beyond the JSON-LD basics. */
export function detailsFromHtml(html: string): Partial<SourceProduct> {
  const rows = attributeRows(html);
  const find = (name: RegExp) =>
    rows.find((r) => name.test(r.label))?.value ?? null;

  const dimensionText = find(/^dimensions?$/i);
  const weightText = find(/^weight$/i);
  const colourText = find(/^colou?rs?$/i);
  const description = descriptionFromHtml(html);

  // Packed size and gross weight sit in the Shipping prose rather than the
  // table, and both matter: gross weight is what a courier bills on.
  const text = plainText(html);
  const packing =
    /Packing Dimensions\s*([^;<]+?)(?:;|\s*gross)/i.exec(text)?.[1]?.trim() ??
    null;
  const grossWeight =
    /gross weight\s*(\d+(?:\.\d+)?\s*kg)/i.exec(text)?.[1]?.trim() ?? null;

  const specs = [
    ...rows.filter((r) => !/^(dimensions?|weight)$/i.test(r.label)),
    ...(dimensionText ? [{ label: "Dimensions", value: dimensionText }] : []),
    ...(weightText ? [{ label: "Weight", value: weightText }] : []),
    ...(packing ? [{ label: "Packed size", value: packing }] : []),
    ...(grossWeight ? [{ label: "Packed weight", value: grossWeight }] : []),
  ];

  return {
    ...(description ? { description } : {}),
    ...(dimensionText && parseDimensions(dimensionText)
      ? { dimensions: parseDimensions(dimensionText)! }
      : {}),
    ...(weightText && parseWeightKg(weightText) !== null
      ? { weightKg: parseWeightKg(weightText)! }
      : {}),
    ...(specs.length ? { specs } : {}),
    ...(leadTimeFromHtml(html) ? { leadTime: leadTimeFromHtml(html)! } : {}),
    ...(colourText && parseColours(colourText).length > 1
      ? { colours: parseColours(colourText) }
      : {}),
    ...(freeDeliveryStated(html) ? { freeDelivery: true } : {}),
    ...(() => {
      const stock = stockFromHtml(html);
      if (!stock) return {};
      return {
        stockStatus: stock.status,
        ...(stock.quantity !== undefined
          ? { stockQuantity: stock.quantity }
          : {}),
      };
    })(),
    ...(description && tradeLanguageIn(description).length
      ? { tradeLanguage: tradeLanguageIn(description) }
      : {}),
  };
}

function fromHtmlDir(dir: string): SourceProduct[] {
  const out: SourceProduct[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (!statSync(full).isFile() || !/\.html?$/i.test(entry)) continue;
    const html = readFileSync(full, "utf8");
    const found = productFromJsonLd(html);
    if (!found) {
      console.warn(`  ! ${entry}: no JSON-LD Product block found — skipped`);
      continue;
    }

    /**
     * Images alongside the page, if webarchive-to-html.sh put them there.
     *
     * Preferred over the URLs in the JSON-LD, and not as an optimisation:
     * didesigns.co.uk answers automated image requests with a 202 and a
     * 241-byte CAPTCHA page, so downloading them from here produces four
     * kilobytes of HTML uploaded as a product photo. The copy inside the
     * webarchive is the only one that works.
     *
     * Sorted by filename because the extractor numbers them in the order the
     * page listed them, which is the order the gallery should open in.
     */
    const imageDir = full.replace(/\.html?$/i, ".images");
    let localFiles: string[] | undefined;
    try {
      if (statSync(imageDir).isDirectory()) {
        const files = readdirSync(imageDir)
          .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
          .sort()
          .map((f) => join(imageDir, f));
        if (files.length) localFiles = files;
      }
    } catch {
      // No sibling directory — fall back to the URLs and let the fetch fail
      // loudly per image rather than silently here.
    }

    // The page's own detail wins over the JSON-LD summary, description included.
    out.push({
      ...found,
      ...detailsFromHtml(html),
      ...(localFiles ? { localFiles, images: [] } : {}),
    });
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
  //
  // Sofas sit below the outdoor rule on purpose: a rattan or patio sofa is
  // garden furniture and is claimed above, so only what is left reaches here.
  // Sofa beds and corner sofas are the same category, and a "sofa table" is not
  // a sofa — hence the negative lookahead rather than a bare /sofa/.
  {
    pattern:
      /\bsofa(?! table)\b|settee|couch|chaise ?longue|loveseat|snuggler|\barmchair\b|\baccent chair\b|\bclub chair\b|\bocc?asional chair\b/i,
    slug: "sofas",
  },
  { pattern: /computer desk|writing desk|\bdesk\b/i, slug: "desks" },
  // "Hampton Ivory Square Bedside" — the supplier drops "table" on some titles,
  // so requiring it sent a bedside cabinet to no category at all.
  { pattern: /\bbedside\b|nightstand/i, slug: "bedside-tables" },
  { pattern: /coffee table/i, slug: "coffee-tables" },
  // Console before the side-table rule: a "1 Drawer Black Console Table" is a
  // console, and nothing in the side-table pattern should get first refusal.
  { pattern: /console table/i, slug: "console-tables" },
  // End, occasion and nest tables are one shopping intent, so one category.
  // "Occasion table" and "occasional table" are both in use — D.I. Designs say
  // "Leckford Black Ribbed Occasion Table" — so the "al" has to be optional.
  {
    pattern:
      /end table|occasion(al)? table|nest (of )?tables?|\d+ nest tables?|side table/i,
    slug: "side-tables",
  },
  {
    pattern: /\btv (unit|stand|cabinet|console)\b|media unit/i,
    slug: "tv-units",
  },
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
 * An outdoor light gets Garden Lighting and no room at all. "Solar Rattan Floor
 * Lamp" matches the floor-lamp rule above, and offering it to someone
 * furnishing a living room is worse than not appearing: it reads as a shop that
 * does not know its own stock. The two sets are therefore exclusive, not
 * additive.
 *
 * Garden Lighting is created by scripts/add-garden-lighting-category.ts. If it
 * is missing this degrades to Lighting alone rather than failing the import.
 */
const OUTDOOR_LIGHT =
  /solar|outdoor|garden|patio|pathway|path light|lamp post|street light|bollard|driveway/i;

function inferAdditionalCategories(title: string, primary: string): string[] {
  if (primary !== "lighting") return [];
  if (OUTDOOR_LIGHT.test(title)) return ["garden-lighting"];
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

/** Every write failure ends in the same place: replace the token. Say how. */
const TOKEN_HELP = (reason: string) =>
  `Nothing was imported — ${reason}.

Get a new one:
  1. https://sanity.io/manage → project Kaiku → API → Tokens
  2. Add API token → name it "import" → permission Editor → Save
  3. Copy it (shown once) into .env.local as:
       SANITY_API_WRITE_TOKEN=<paste>
  4. Re-run this command.

The token is a secret: it must stay in .env.local and never go in a
NEXT_PUBLIC_ variable, which is inlined into the browser bundle.`;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/\|.*$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);

/**
 * Strips the supplier's own SEO tail and puts ours on instead.
 *
 * A supplier's `<title>`-derived JSON-LD name carries their branding: D.I.
 * Designs send "Abberley Brown Coffee Table | Trade Furniture | DI Designs".
 * Imported raw that is what appears on our category tiles, in the Merchant feed
 * and in Google's results — a competitor's name on our own product page, and a
 * different shape from the rest of the catalogue, which is uniformly
 * "<product> | Kaiku".
 *
 * Only pipe-delimited tail segments are removed, and only the ones that are
 * plainly branding rather than product information. "Coffee Table in Brown" and
 * "30 x 20 x 5cm" are kept; "Trade Furniture", "DI Designs" and "Free UK
 * Delivery" are not. Anything unrecognised is kept, because dropping a real
 * detail from a title is worse than leaving a stray word in one.
 */
const TAIL_NOISE =
  /^(trade|wholesale|trade furniture|wholesale furniture|free (uk )?delivery|uk delivery|next day delivery|buy online|shop now|home|di ?designs?|d\.?i\.? designs?|didesigns(\.co\.uk)?)$/i;

/**
 * Words that carry no identity, so two titles differing only in these are the
 * same product. "in", "with" and the colour-order words are what make "Abberley
 * Brown Coffee Table" and "Abberley Coffee Table in Brown" look different.
 */
const NOISE_WORDS = new Set([
  "in",
  "with",
  "and",
  "the",
  "a",
  "for",
  "of",
  "kaiku",
  "trade",
  "furniture",
]);

/**
 * A word-set fingerprint, for recognising the same product under a different
 * word order. Deliberately not fuzzy beyond that: it compares the exact set of
 * significant words, so "2 Tier" and "3 Tier" stay different products, as do
 * "Brown" and "Grey" colourways — which is the behaviour that matters, because a
 * false match silently skips a product that should have been imported.
 */
export function titleFingerprint(title: string): string {
  return [
    ...new Set(
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w && !NOISE_WORDS.has(w)),
    ),
  ]
    .sort()
    .join(" ");
}

export function cleanSupplierTitle(raw: string, ownSuffix = "Kaiku"): string {
  const parts = raw
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean);
  // Drop branding from the end inwards, never from the front: the first segment
  // is the product name even when it happens to read like a brand.
  while (parts.length > 1 && TAIL_NOISE.test(parts[parts.length - 1]!))
    parts.pop();
  // An existing "| Kaiku" is not duplicated — this runs on re-imports too.
  if (parts[parts.length - 1]?.toLowerCase() === ownSuffix.toLowerCase())
    parts.pop();
  return `${parts.join(" | ")} | ${ownSuffix}`;
}

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

  // Before anything else, so the cleaned title is what gets categorised, slugged
  // and printed in the dry run — the supplier's branding never reaches Sanity.
  for (const p of sources) {
    const cleaned = cleanSupplierTitle(p.title);
    if (cleaned !== p.title)
      console.log(
        `  ~ title: ${p.title.slice(0, 62)}\n           → ${cleaned}`,
      );
    p.title = cleaned;
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

  const token = process.env.SANITY_API_WRITE_TOKEN;
  // The dry run needs the same client, so that "already in the catalogue" is
  // known before anything is written rather than discovered halfway through a
  // 30-product --apply.
  if (!token && apply)
    throw new Error(TOKEN_HELP("SANITY_API_WRITE_TOKEN is not set"));
  if (!token) {
    console.log(
      "\nNo SANITY_API_WRITE_TOKEN, so the duplicate check is skipped — products\n" +
        "already in the catalogue will not be flagged below.\n",
    );
  }
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
    token,
    useCdn: false,
  });

  /**
   * Prove the token works before doing anything else. The token that was in
   * .env.local was revoked after it leaked into a public env var, so the most
   * likely reason an import "does nothing" is a dead token — and without this
   * check that surfaces 40 lines later as `Unauthorized: Session not found`,
   * which reads like a bug in the script rather than a credential to replace.
   */
  if (token) {
    try {
      await client.fetch<number>(`count(*[_type=="category"])`);
    } catch (err) {
      const message = (err as Error).message;
      throw new Error(
        TOKEN_HELP(
          /unauthor|session not found|permission/i.test(message)
            ? "the write token was rejected by Sanity"
            : `Sanity would not answer: ${message}`,
        ),
      );
    }
  }

  /**
   * Which of these are already here. Run for the dry run too, because the whole
   * point of the dry run is to see the outcome before committing to it — and
   * with 20-30 saved pages from a supplier we already list, duplicates are the
   * likeliest thing to go wrong.
   */
  const alreadyListed = new Map<
    string,
    { _id: string; title: string; how: string }
  >();
  if (token) {
    // One pass over the catalogue, then match in memory: three cheap keys
    // beat a query per product per key, and the fingerprint cannot be a GROQ
    // filter anyway.
    const catalogue = await client.fetch<
      {
        _id: string;
        title: string;
        slug: string | null;
        supplierSku: string | null;
      }[]
    >(`*[_type == "product"]{_id, title, "slug": slug.current, supplierSku}`);
    const byFingerprint = new Map(
      catalogue.map((c) => [titleFingerprint(c.title), c]),
    );
    const bySlug = new Map(
      catalogue.flatMap((c) => (c.slug ? [[c.slug, c] as const] : [])),
    );
    const bySupplierSku = new Map(
      catalogue.flatMap((c) =>
        c.supplierSku ? [[c.supplierSku.toLowerCase(), c] as const] : [],
      ),
    );

    for (const { product: p } of picked) {
      // Supplier code first: it is the only key that is exact by construction.
      // The slug and the fingerprint are for the products listed before this
      // field existed, which carry no supplier code to match on.
      const hit = p.sku ? bySupplierSku.get(p.sku.toLowerCase()) : undefined;
      const found = hit
        ? { ...hit, how: `supplier code ${p.sku}` }
        : (() => {
            const bySlugHit = bySlug.get(slugify(p.title));
            if (bySlugHit) return { ...bySlugHit, how: "slug" };
            const fp = byFingerprint.get(titleFingerprint(p.title));
            return fp ? { ...fp, how: "same words in the title" } : null;
          })();
      if (found) alreadyListed.set(p.title, found);
    }
    if (alreadyListed.size)
      console.log(
        `${alreadyListed.size} of these ${alreadyListed.size === 1 ? "is" : "are"} already in the catalogue and will be skipped:\n` +
          [...alreadyListed]
            .map(
              ([title, doc]) =>
                `  = ${title.slice(0, 40).padEnd(42)}${doc._id.slice(0, 34).padEnd(36)}(${doc.how})`,
            )
            .join("\n") +
          "\n",
      );
  }

  // What the pages said about delivery. Grouped rather than printed per product,
  // because the useful question is which products need a carriage figure and
  // which have already answered it.
  const toImport = picked.filter((r) => !alreadyListed.has(r.product.title));
  const freeDelivery = toImport.filter((r) => r.product.freeDelivery);
  if (toImport.length) {
    console.log(
      `Delivery: ${freeDelivery.length} of ${toImport.length} page(s) state it is included in the price` +
        ` (imported as £0 carriage).\n` +
        `          ${toImport.length - freeDelivery.length} say nothing, so carriage is left unset rather than\n` +
        `          assumed free — the margin report reads that as unknown.\n`,
    );
  }

  // Copy written for a trade audience. Not stripped, because cutting sentences
  // automatically mangles them, and each needs reading anyway.
  const tradeCopy = toImport.filter((r) => r.product.tradeLanguage?.length);
  if (tradeCopy.length) {
    console.log(
      `${tradeCopy.length} description(s) are written for trade buyers and need rewording\n` +
        `before publishing — a shopper reading "ideal for hotel lobbies" learns they\n` +
        `are not the customer:\n` +
        tradeCopy
          .map(
            ({ product }) =>
              `  ! ${product.title.slice(0, 44).padEnd(46)}${product.tradeLanguage!.join(", ")}`,
          )
          .join("\n") +
        "\n",
    );
  }

  // What was actually recovered from the pages, so a thin extraction is obvious
  // before 50 half-empty drafts land in Studio.
  if (toImport.length) {
    const got = (pick: (p: SourceProduct) => unknown) =>
      toImport.filter((r) => {
        const v = pick(r.product);
        return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null;
      }).length;
    console.log(
      `Extracted from ${toImport.length} page(s):  ` +
        [
          `description ${got((p) => p.description)}`,
          `dimensions ${got((p) => p.dimensions)}`,
          `weight ${got((p) => p.weightKg)}`,
          `specs ${got((p) => p.specs)}`,
          `lead time ${got((p) => p.leadTime)}`,
          `colours ${got((p) => p.colours)}`,
        ].join(" · ") +
        "\n",
    );
  }

  if (!apply) {
    // --fill-existing does its work inside the creation loop below, which the
    // dry run never reaches. Preview it here instead: fillMissingFields only
    // commits when --apply is set, so calling it now reports without writing.
    if (fillExisting && alreadyListed.size) {
      console.log(`Already listed — what --apply would fill in:\n`);
      let wouldFill = 0;
      for (const [title, doc] of alreadyListed) {
        const source = picked.find((r) => r.product.title === title)!.product;
        const names = await fillMissingFields(doc._id, source);
        if (names.length) {
          console.log(
            `  ~ ${title.slice(0, 42).padEnd(44)}${names.join(", ")}`,
          );
          wouldFill++;
        } else {
          console.log(
            `  = ${title.slice(0, 42).padEnd(44)}nothing missing, would be left alone`,
          );
        }
      }
      console.log(
        `\n  ${wouldFill} of ${alreadyListed.size} would gain something. Price, title and slug\n` +
          `  are never touched.\n`,
      );
    }

    console.log(
      `Dry run — nothing written. ${toImport.length} would be created` +
        `${fillExisting && alreadyListed.size ? `, ${alreadyListed.size} filled in` : ""}.\n` +
        "Re-run with --apply once the list looks right. Prices above are from the\n" +
        "source and are NOT imported; each draft stays invalid in Studio until you\n" +
        "set a price, which is intentional.\n",
    );
    return;
  }

  // Resolve every distinct category once, and fail loudly on a bad slug rather
  // than silently importing products with no category.
  const slugs = [...new Set(picked.flatMap((r) => [r.slug, ...r.extras]))];
  const primarySlugs = new Set(picked.map((r) => r.slug));
  const categoryIds = new Map<string, string>();
  for (const slug of slugs) {
    const found = await client.fetch<{ _id: string } | null>(
      `*[_type=="category" && slug.current==$slug][0]{_id}`,
      { slug },
    );
    // A missing primary category means the product has nowhere to live, so stop.
    // A missing cross-listing target only costs it a second shelf, so drop that
    // one and carry on — an import of 33 products should not fail because one
    // optional category has not been created yet.
    if (!found) {
      if (primarySlugs.has(slug))
        throw new Error(`No category with slug "${slug}".`);
      console.warn(
        `  ! no "${slug}" category — importing without that cross-listing`,
      );
      continue;
    }
    categoryIds.set(slug, found._id);
  }
  for (const row of picked) {
    row.extras = row.extras.filter((slug) => categoryIds.has(slug));
  }

  /**
   * Adds only what is absent. Reads the document first and builds a patch from
   * the empty fields alone, so running it twice changes nothing the second time
   * and a value entered by hand is never replaced by a supplier's.
   *
   * `price`, `title` and `slug` are deliberately absent from this list. A
   * supplier page carries their trade price and their SEO title, and the slug is
   * a live URL — filling any of those from a page would be the wrong direction.
   */
  async function fillMissingFields(
    id: string,
    p: SourceProduct,
  ): Promise<string[]> {
    const doc = await client.fetch<Record<string, unknown> | null>(
      `*[_id == $id][0]{
        supplierSku, description, summary, dimensions, weight, deliveryLeadTime,
        shippingCost, sourceUrl, stockQuantity,
        "specs": count(specs), "options": count(options), "gallery": count(gallery),
        // Coming Soon counts as empty here: it is the importer's fallback, not a
        // decision, so the supplier's real stock line should replace it. Any
        // other value was chosen by hand and is left alone.
        "stockStatus": select(stockStatus == "Coming Soon" => null, stockStatus)
      }`,
      { id },
    );
    if (!doc) return [];

    const empty = (key: string) => {
      const v = doc[key];
      return v === null || v === undefined || v === "" || v === 0;
    };
    const patch: Record<string, unknown> = {};
    const names: string[] = [];
    const add = (name: string, key: string, value: unknown) => {
      if (!empty(key)) return;
      patch[key] = value;
      names.push(name);
    };

    if (p.sku) add("supplier code", "supplierSku", p.sku);
    if (p.description) {
      // A bare string counts as empty here, so the 72 drafts written before this
      // was Portable Text get repaired rather than skipped as "already set".
      if (!Array.isArray(doc.description)) {
        patch.description = toPortableText(p.description);
        names.push("description (as rich text)");
      }
      add("summary", "summary", deriveSummary(p.description));
    }
    if (p.dimensions)
      add("dimensions", "dimensions", {
        _type: "dimensions",
        ...p.dimensions,
      });
    if (p.weightKg !== undefined)
      add("weight", "weight", {
        _type: "weight",
        unit: "kg",
        value: p.weightKg,
      });
    if (p.leadTime) add("lead time", "deliveryLeadTime", p.leadTime);
    if (p.sourceUrl) add("source URL", "sourceUrl", p.sourceUrl);
    // Only when the page says delivery is included. `empty()` treats 0 as empty,
    // which is right here: a 0 already meaning "carriage is in the cost" is
    // simply rewritten to the same 0.
    if (p.freeDelivery) add("free delivery", "shippingCost", 0);
    if (p.stockStatus) add("stock status", "stockStatus", p.stockStatus);
    if (p.stockQuantity !== undefined)
      add("stock quantity", "stockQuantity", p.stockQuantity);

    if (p.specs?.length && !doc.specs) {
      patch.specs = p.specs.map((s, index) => ({
        _type: "productSpec",
        _key: `spec-${index}`,
        label: s.label,
        value: s.value,
      }));
      names.push(`${p.specs.length} specs`);
    }
    if (p.colours?.length && !doc.options) {
      patch.options = [
        {
          _type: "productOption",
          _key: "option-colour",
          label: "Colour",
          values: p.colours,
        },
      ];
      names.push("colour option");
    }

    if (!names.length) return [];
    if (apply) await client.patch(id).set(patch).commit();
    return names;
  }

  let created = 0;
  let skipped = 0;
  let enriched = 0;
  for (const { product: p, slug, extras } of picked) {
    const base = slugify(p.sku ? `${p.title}-${p.sku}` : p.title);
    const id = `drafts.product-import-${base}`;
    const ownDraftExists = await client.fetch<boolean>(
      `defined(*[_id==$id][0]._id)`,
      { id },
    );
    if (ownDraftExists) {
      // This branch used to short-circuit before --fill-existing was considered,
      // so a product this importer had created itself could never be filled in —
      // which is exactly the case that matters when the extractor learns to read
      // a new field and 73 existing drafts need it.
      if (fillExisting) {
        const filled = await fillMissingFields(id, p);
        if (filled.length) {
          console.log(
            `  ~ filled ${filled.join(", ")}\n      on ${id} (${p.title.slice(0, 40)})`,
          );
          enriched++;
        } else {
          console.log(`  = nothing missing: ${p.title.slice(0, 44)}`);
          skipped++;
        }
        continue;
      }
      console.log(
        `  = exists, skipped: ${p.title.slice(0, 44)}` +
          `  (--fill-existing would add any detail it is missing)`,
      );
      skipped++;
      continue;
    }

    // A previous import's own ID is not the only way a product can already be
    // here. The D.I. Designs tables listed by hand are `product-di-*`, and the
    // check above would happily create a second draft of a table already on
    // sale. Matched by slug and SKU above, across published and draft documents
    // whatever their ID.
    const existing = alreadyListed.get(p.title);
    if (existing) {
      // Never a second document. With --fill-existing the page's detail is used
      // to fill fields the listed product is missing — which is the useful thing
      // to do when a saved page covers something already on sale, since the hand
      // built listings have no dimensions, weight, specs or supplier code.
      //
      // Only ever fills what is empty. Nothing already entered is overwritten,
      // and price, title and slug are never touched at all: those are yours, and
      // a supplier page would happily replace your retail price with their trade
      // one.
      if (fillExisting) {
        const filled = await fillMissingFields(existing._id, p);
        if (filled.length) {
          console.log(
            `  ~ filled ${filled.join(", ")}\n      on ${existing._id} (${p.title.slice(0, 40)})`,
          );
          enriched++;
        } else {
          console.log(
            `  = nothing missing on ${existing._id} (${p.title.slice(0, 40)})`,
          );
          skipped++;
        }
        continue;
      }
      console.log(
        `  = already in the catalogue, skipped: ${p.title.slice(0, 44)}\n` +
          `      matches ${existing._id} (${existing.title.slice(0, 44)})` +
          `\n      (--fill-existing would add any detail it is missing)`,
      );
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
      // Portable Text, not a bare string: `description` is a richText array, and
      // writing a string there leaves a field Studio cannot show and the product
      // page cannot render. `summary` is derived because it is what the Merchant
      // feed sends to Google as the product description.
      ...(p.description
        ? {
            description: toPortableText(p.description),
            summary: deriveSummary(p.description),
          }
        : {}),
      // The supplier's code goes in supplierSku, not sku. `sku` is ours
      // (KK-CT-ABB-BRN-001) and is what reaches Google and an invoice, so it is
      // left unset for you to assign — the audit's "no SKU" finding is then the
      // reminder to do it. Writing the supplier's code into `sku` is what
      // previously meant every imported product had to have it overwritten by
      // hand, and left nothing behind to recognise a re-import by.
      ...(p.sku ? { supplierSku: p.sku } : {}),
      ...(p.sourceUrl ? { sourceUrl: p.sourceUrl } : {}),
      ...(p.dimensions
        ? { dimensions: { _type: "dimensions", ...p.dimensions } }
        : {}),
      ...(p.weightKg !== undefined
        ? { weight: { _type: "weight", unit: "kg", value: p.weightKg } }
        : {}),
      ...(p.specs?.length
        ? {
            specs: p.specs.map((s, index) => ({
              _type: "productSpec",
              _key: `spec-${index}`,
              label: s.label,
              value: s.value,
            })),
          }
        : {}),
      ...(p.leadTime ? { deliveryLeadTime: p.leadTime } : {}),
      // Only written when the page actually says so. Left unset otherwise, which
      // the margin report reads as unknown rather than as free — an invented £0
      // would overstate the margin on every product carrying it.
      ...(p.freeDelivery ? { shippingCost: 0 } : {}),
      ...(p.colours?.length
        ? {
            options: [
              {
                _type: "productOption",
                _key: "option-colour",
                // `label`, not `name` — see productOption in schemaTypes.
                label: "Colour",
                values: p.colours,
              },
            ],
          }
        : {}),
      ...(gallery.length ? { gallery } : {}),
      // The supplier's own stock line where the page gave one, and "Coming Soon"
      // only as a genuine fallback. Defaulting everything to Coming Soon put
      // that label on items with 52 units on a shelf, and left the eight
      // out-of-stock ones looking orderable.
      stockStatus: p.stockStatus ?? "Coming Soon",
      ...(p.stockQuantity !== undefined
        ? { stockQuantity: p.stockQuantity }
        : {}),
      currency: "GBP",
    });
    console.log(
      `  + [${slug}${extras.length ? ` +${extras.length}` : ""}] ${p.title.slice(0, 46)}  (${gallery.length} images)`,
    );
    created++;
  }

  console.log(
    `\nDone. ${created} draft(s) created, ${skipped} already existed` +
      `${enriched ? `, ${enriched} existing product(s) filled in` : ""}.\n` +
      "New ones are DRAFTS with no price — set price (and check the category) in\n" +
      "Studio, then publish.\n" +
      (enriched
        ? "Products that were filled in keep whatever price and title they had.\n"
        : ""),
  );
}

/**
 * Only when run as a script. The test imports cleanSupplierTitle and
 * titleFingerprint from this file, and without the guard main() runs on import
 * and exits the test process.
 */
const runDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (runDirectly) {
  void main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
