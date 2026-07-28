"use server";

import "server-only";

import crypto from "node:crypto";

import { siteConfig } from "@/config/site";
import { env } from "@/env";
import { getCategories } from "@/lib/sanity/queries/category";
import { getAuthorizedAdmin } from "@/server/auth/admin";
import { logProductImportToSheet } from "@/server/integrations/google-sheets";
import { getSanityWriteClient } from "@/server/sanity/write-client";

export interface ImportProductResult {
  ok: boolean;
  error?: string;
  title?: string;
  studioUrl?: string;
  url?: string;
}

// Kept low relative to the 60s maxDuration set on the import page's route:
// each URL is a sequential page fetch + AI extraction + up to
// MAX_GALLERY_IMAGES image uploads, so a larger batch risks the whole
// request getting cut off mid-way with no clear signal about which URLs
// actually completed. Lower than it used to be now that a single product
// can pull down many more images than before.
const MAX_BATCH_URLS = 3;

const FETCH_TIMEOUT_MS = 15_000;
const MAX_HTML_BYTES = 2_000_000;
const MAX_PROMPT_CHARS = 6_000;
// Every distinct product photo found is uploaded — this cap only exists to
// stop a pathological page (e.g. a marketplace listing with hundreds of
// unrelated thumbnails) from turning one import into an enormous upload
// batch, not to artificially limit a normal product gallery.
const MAX_GALLERY_IMAGES = 20;

interface ExtractedFields {
  title?: string;
  tagline?: string;
  summary?: string;
  // 2-4 paragraphs rather than one blob, so the Studio's rich-text
  // description reads like a considered product page instead of a single
  // dense sentence-block.
  descriptionParagraphs?: string[];
  price?: number;
  currency?: string;
  sku?: string;
  brand?: string | null;
  badges?: string[];
  highlights?: string[];
  specs?: { label: string; value: string }[];
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: "mm" | "cm" | "m";
  };
  weight?: { value?: number; unit?: "kg" | "g" };
  deliveryLeadTime?: string | null;
  // Only ever filled from real, specific policy text the page actually
  // states — the prompt instructs the model to return null rather than
  // invent generic filler, matching this project's no-fabricated-copy rule.
  deliveryNotes?: string | null;
  warrantyNotes?: string | null;
  categorySlug?: string | null;
}

/** Blocks obvious loopback/private hosts. Not exhaustive SSRF protection —
 * proportionate for a single-admin, authenticated internal tool, not a
 * public-facing input. */
function isSafeUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    /^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    return null;
  }
  return url;
}

async function fetchHtml(url: URL): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; KaikuHomeImporter/1.0; +https://kaikuhome.com)",
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`Fetch failed with status ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer.slice(0, MAX_HTML_BYTES)).toString("utf-8");
}

interface PageSignals {
  title?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  // Every distinct product photo we could find — a page can (and often
  // does) list several og:image tags and/or a JSON-LD image array, not
  // just one. Deduped, resolved to absolute URLs, capped at
  // MAX_GALLERY_IMAGES.
  imageUrls: string[];
  jsonLdPrice?: string;
  jsonLdCurrency?: string;
  jsonLdBrand?: string;
  jsonLdAvailability?: string;
  jsonLdGtin?: string;
  bodyText: string;
}

function extractSignals(html: string, pageUrl: URL): PageSignals {
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
  const metaDescription = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
  )?.[1];
  const ogTitle = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i,
  )?.[1];
  const ogDescription = html.match(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i,
  )?.[1];
  const ogImages = [
    ...html.matchAll(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/gi,
    ),
  ]
    .map((match) => match[1])
    .filter((value): value is string => Boolean(value));

  // WooCommerce (an extremely common storefront platform) exposes its full
  // product photo gallery through this attribute on the gallery's thumbnail
  // elements, separately from og:image/JSON-LD, which — depending on the
  // SEO plugin's config — often only carry a single share-preview image.
  const wooGalleryImages = [
    ...html.matchAll(/data-large_image(?:_src)?=["']([^"']*)["']/gi),
  ]
    .map((match) => match[1])
    .filter((value): value is string => Boolean(value));

  const jsonLdImages: string[] = [];
  let jsonLdPrice: string | undefined;
  let jsonLdCurrency: string | undefined;
  let jsonLdBrand: string | undefined;
  let jsonLdAvailability: string | undefined;
  let jsonLdGtin: string | undefined;
  const jsonLdBlocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const match of jsonLdBlocks) {
    try {
      const parsed: unknown = JSON.parse(match[1] ?? "");
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const candidate of candidates) {
        if (
          typeof candidate === "object" &&
          candidate !== null &&
          "@type" in candidate &&
          (candidate as { "@type"?: unknown })["@type"] === "Product"
        ) {
          const product = candidate as Record<string, unknown>;
          const image = product.image;
          if (typeof image === "string") {
            jsonLdImages.push(image);
          } else if (Array.isArray(image)) {
            for (const entry of image) {
              if (typeof entry === "string") jsonLdImages.push(entry);
            }
          }
          const brandField = product.brand;
          if (!jsonLdBrand) {
            if (typeof brandField === "string") jsonLdBrand = brandField;
            else if (
              typeof brandField === "object" &&
              brandField !== null &&
              typeof (brandField as Record<string, unknown>).name === "string"
            ) {
              jsonLdBrand = (brandField as Record<string, unknown>)
                .name as string;
            }
          }
          const gtinField =
            product.gtin13 ?? product.gtin ?? product.gtin12 ?? product.gtin8;
          if (!jsonLdGtin && typeof gtinField === "string") {
            jsonLdGtin = gtinField;
          }
          const offers = product.offers as Record<string, unknown> | undefined;
          if (offers && !jsonLdPrice) {
            if (
              typeof offers.price === "string" ||
              typeof offers.price === "number"
            ) {
              jsonLdPrice = String(offers.price);
            }
            if (typeof offers.priceCurrency === "string") {
              jsonLdCurrency = offers.priceCurrency;
            }
            if (typeof offers.availability === "string") {
              jsonLdAvailability = offers.availability;
            }
          }
        }
      }
    } catch {
      // Malformed JSON-LD on the source page — skip it, not fatal.
    }
  }

  // JSON-LD images first — when present they're usually the product's own
  // curated photo set, in order, rather than og:image's single share-preview
  // pick. WooCommerce gallery attributes last since they're closer to raw
  // markup and more likely to include a stray duplicate.
  const resolvedImageUrls = [...jsonLdImages, ...ogImages, ...wooGalleryImages]
    .map((raw) => {
      try {
        return new URL(raw, pageUrl).toString();
      } catch {
        return null;
      }
    })
    .filter((value): value is string => Boolean(value));
  const imageUrls = Array.from(new Set(resolvedImageUrls)).slice(
    0,
    MAX_GALLERY_IMAGES,
  );

  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_PROMPT_CHARS);

  return {
    title,
    metaDescription,
    ogTitle,
    ogDescription,
    imageUrls,
    jsonLdPrice,
    jsonLdCurrency,
    jsonLdBrand,
    jsonLdAvailability,
    jsonLdGtin,
    bodyText,
  };
}

async function extractProductFields(
  signals: PageSignals,
  categories: { slug: string; name: string }[],
): Promise<ExtractedFields | null> {
  const categoryList = categories.map((c) => `${c.slug}: ${c.name}`).join("\n");

  const prompt = `You are extracting furniture/home-product data from a scraped supplier page for Kaiku Home, a premium Scandinavian/Japandi furniture retailer, to fill in as much of a detailed product record as the page genuinely supports. Return ONLY strict JSON matching this shape.

Critical rule: only fill a field when the page actually states it. Use null (or omit) for anything you can't find or aren't sure of — never invent plausible-sounding filler (a generic warranty period, a made-up delivery window, a guessed brand name). A missing field is fine; a fabricated one is not.

{
  "title": string,
  "tagline": string (short, punchy, one line),
  "summary": string (1-2 sentences),
  "descriptionParagraphs": string[] (2-4 short paragraphs, plain text, genuinely descriptive — draw on every real detail the page gives you: materials, construction, use case, what makes it worth buying. Not padded filler.),
  "price": number (numeric value only, no currency symbol),
  "currency": string (ISO 4217, e.g. "GBP"),
  "sku": string,
  "brand": string (the manufacturer/brand name as stated on the page, or null if not clearly stated — this may differ from the site you're scraping, which could be a reseller),
  "badges": string[] (max 4, very short neutral tags, e.g. "2-3 person", "Weatherproof" — distinct from highlights, just quick-scan labels),
  "highlights": string[] (max 6, short phrases),
  "specs": [{"label": string, "value": string}] (max 12 — pull every real spec the page lists: materials, capacity, power, dimensions if given as a table, etc.),
  "dimensions": {"length": number, "width": number, "height": number, "unit": "mm"|"cm"|"m"},
  "weight": {"value": number, "unit": "kg"|"g"},
  "deliveryLeadTime": string (e.g. "3-6 weeks" — only if the page states an actual lead time, else null),
  "deliveryNotes": string (1-2 sentences faithfully summarizing the page's ACTUAL stated delivery/shipping policy for this product — else null, do not default to something generic),
  "warrantyNotes": string (1-2 sentences faithfully summarizing the page's ACTUAL stated warranty terms — else null, do not default to something generic),
  "categorySlug": one of these exact slugs, or null if none fit well:
${categoryList}
}

Page signals:
Title: ${signals.title ?? signals.ogTitle ?? ""}
Meta/OG description: ${signals.metaDescription ?? signals.ogDescription ?? ""}
JSON-LD price: ${signals.jsonLdPrice ?? ""} ${signals.jsonLdCurrency ?? ""}
JSON-LD brand: ${signals.jsonLdBrand ?? ""}
Page text excerpt: ${signals.bodyText}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    console.error(
      "extractProductFields: OpenAI request failed",
      response.status,
    );
    return null;
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    return JSON.parse(content) as ExtractedFields;
  } catch {
    return null;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

let blockKeyCounter = 0;
function textBlock(text: string) {
  blockKeyCounter += 1;
  return {
    _type: "block",
    _key: `block-${blockKeyCounter}`,
    style: "normal",
    children: [
      { _type: "span", _key: `span-${blockKeyCounter}`, text, marks: [] },
    ],
    markDefs: [],
  };
}

type WriteClient = NonNullable<ReturnType<typeof getSanityWriteClient>>;

/** Deterministic id from the name, so re-running an import for the same
 * brand/supplier reuses the existing document (createIfNotExists is a
 * no-op if it's already there) instead of creating duplicates. */
async function getOrCreateBrand(
  writeClient: WriteClient,
  name: string,
): Promise<string> {
  const trimmed = name.trim();
  const id = `brand-${slugify(trimmed)}`;
  await writeClient.createIfNotExists({
    _id: id,
    _type: "brand",
    name: trimmed,
    slug: { _type: "slug", current: slugify(trimmed) },
  });
  return id;
}

async function getOrCreateSupplier(
  writeClient: WriteClient,
  name: string,
): Promise<string> {
  const trimmed = name.trim();
  const id = `supplier-${slugify(trimmed)}`;
  await writeClient.createIfNotExists({
    _id: id,
    _type: "supplier",
    name: trimmed,
  });
  return id;
}

const STOCK_STATUS_BY_AVAILABILITY: Record<string, string> = {
  "https://schema.org/InStock": "In Stock",
  "http://schema.org/InStock": "In Stock",
  "https://schema.org/OutOfStock": "Out of Stock",
  "http://schema.org/OutOfStock": "Out of Stock",
  "https://schema.org/BackOrder": "Backorder",
  "http://schema.org/BackOrder": "Backorder",
  "https://schema.org/PreOrder": "Made to Order",
  "http://schema.org/PreOrder": "Made to Order",
};

export async function importProductFromUrl(
  url: string,
  supplierName: string,
): Promise<ImportProductResult> {
  if (!(await getAuthorizedAdmin())) {
    return { ok: false, error: "Unauthorized.", url };
  }

  if (!env.OPENAI_API_KEY) {
    return {
      ok: false,
      error: "This tool isn't available right now — OPENAI_API_KEY isn't set.",
      url,
    };
  }
  const writeClient = getSanityWriteClient();
  if (!writeClient) {
    return {
      ok: false,
      error:
        "This tool isn't available right now — SANITY_API_WRITE_TOKEN isn't set.",
      url,
    };
  }

  const safeUrl = isSafeUrl(url);
  if (!safeUrl) {
    return {
      ok: false,
      error: "Please enter a valid http(s) product URL.",
      url,
    };
  }

  try {
    const html = await fetchHtml(safeUrl);
    const signals = extractSignals(html, safeUrl);
    const categories = await getCategories();
    const fields = await extractProductFields(
      signals,
      categories.map((c) => ({ slug: c.slug, name: c.name })),
    );

    const title =
      fields?.title?.trim() ||
      signals.title ||
      signals.ogTitle ||
      "Untitled import";

    // Every array item Sanity stores needs its own unique `_key` — without
    // one, Studio can't render or edit the item at all and just shows a
    // "Missing keys" error, even though the image data underneath it is
    // fine. Fetched in parallel (up to MAX_GALLERY_IMAGES at once, all from
    // the same page so this is well within normal browser-load behaviour)
    // rather than one at a time — sequential uploads of up to 6 images per
    // URL, across a 5-URL batch, risked blowing the import page's 60s
    // serverless timeout well before every URL finished.
    type GalleryImage = {
      _type: "image";
      _key: string;
      asset: { _type: "reference"; _ref: string };
    };
    const galleryResults = await Promise.all(
      signals.imageUrls.map(
        async (imageUrl, index): Promise<GalleryImage | null> => {
          try {
            const imageResponse = await fetch(imageUrl, {
              signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            });
            if (!imageResponse.ok) return null;
            const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
            const asset = await writeClient.assets.upload("image", imageBuffer);
            return {
              _type: "image",
              _key: `gallery-${index}`,
              asset: { _type: "reference", _ref: asset._id },
            };
          } catch (err) {
            console.error("importProductFromUrl: image upload failed", err);
            return null;
          }
        },
      ),
    );
    const gallery = galleryResults.filter(
      (image): image is GalleryImage => image !== null,
    );

    const matchedCategory = fields?.categorySlug
      ? categories.find((c) => c.slug === fields.categorySlug)
      : undefined;

    // Supplier is whatever the admin typed in for this batch (deterministic,
    // no guessing needed). Brand is the manufacturer as stated on the page
    // itself, which can genuinely differ from the supplier/reseller site —
    // prefer the AI's read of the page, fall back to JSON-LD's own brand
    // field if the AI didn't find one.
    const [supplierId, brandId] = await Promise.all([
      getOrCreateSupplier(writeClient, supplierName),
      (async () => {
        const brandName = fields?.brand?.trim() || signals.jsonLdBrand?.trim();
        return brandName ? getOrCreateBrand(writeClient, brandName) : null;
      })(),
    ]);

    const stockStatus = signals.jsonLdAvailability
      ? STOCK_STATUS_BY_AVAILABILITY[signals.jsonLdAvailability]
      : undefined;

    const uniqueSuffix = crypto.randomBytes(4).toString("hex");
    const baseId = `product-import-${slugify(title)}-${uniqueSuffix}`;
    const draftId = `drafts.${baseId}`;

    await writeClient.create({
      _id: draftId,
      _type: "product",
      title,
      slug: { _type: "slug", current: slugify(title) },
      ...(matchedCategory
        ? {
            category: {
              _type: "reference",
              _ref: `category-${matchedCategory.slug}`,
            },
          }
        : {}),
      ...(brandId ? { brand: { _type: "reference", _ref: brandId } } : {}),
      supplier: { _type: "reference", _ref: supplierId },
      ...(fields?.tagline?.trim() ? { tagline: fields.tagline.trim() } : {}),
      ...(fields?.summary?.trim() ? { summary: fields.summary.trim() } : {}),
      ...(fields?.descriptionParagraphs?.length
        ? {
            description: fields.descriptionParagraphs
              .map((p) => p.trim())
              .filter(Boolean)
              .map((p) => textBlock(p)),
          }
        : {}),
      ...(typeof fields?.price === "number" ? { price: fields.price } : {}),
      ...(fields?.currency?.trim() ? { currency: fields.currency.trim() } : {}),
      ...(fields?.sku?.trim() ? { sku: fields.sku.trim() } : {}),
      ...(signals.jsonLdGtin?.trim()
        ? { gtin: signals.jsonLdGtin.trim() }
        : {}),
      ...(fields?.badges?.length
        ? { badges: fields.badges.map((b) => b.trim()) }
        : {}),
      ...(fields?.highlights?.length
        ? { highlights: fields.highlights.map((h) => h.trim()) }
        : {}),
      ...(fields?.specs?.length
        ? {
            specs: fields.specs.map((s, i) => ({
              _type: "productSpec",
              _key: `spec-${i}`,
              label: s.label.trim(),
              value: s.value.trim(),
            })),
          }
        : {}),
      ...(fields?.dimensions ? { dimensions: fields.dimensions } : {}),
      ...(fields?.weight ? { weight: fields.weight } : {}),
      ...(fields?.deliveryLeadTime?.trim()
        ? { deliveryLeadTime: fields.deliveryLeadTime.trim() }
        : {}),
      ...(fields?.deliveryNotes?.trim()
        ? { deliveryNotes: fields.deliveryNotes.trim() }
        : {}),
      ...(fields?.warrantyNotes?.trim()
        ? { warrantyNotes: fields.warrantyNotes.trim() }
        : {}),
      ...(stockStatus ? { stockStatus } : {}),
      ...(gallery.length ? { gallery } : {}),
      sourceUrl: safeUrl.toString(),
    });

    // "Intent" links are structure-independent — unlike a /structure/...
    // deep link, they don't need to match the nested Catalog > Products
    // path defined in structure.ts, so they keep working if that nesting
    // ever changes.
    const studioPath = `/studio/intent/edit/id=${baseId};type=product`;

    // Awaited (not fire-and-forget) because a serverless function can be
    // frozen the instant it returns a response, which would otherwise kill
    // an in-flight Sheets write before it completes. A Sheets failure still
    // can't undo the Sanity draft that already succeeded — the function
    // swallows its own errors, so this never throws.
    await logProductImportToSheet({
      title,
      price: typeof fields?.price === "number" ? fields.price : undefined,
      currency: fields?.currency,
      sku: fields?.sku,
      categoryName: matchedCategory?.name,
      supplierName,
      sourceUrl: safeUrl.toString(),
      studioUrl: `${siteConfig.url}${studioPath}`,
    });

    return {
      ok: true,
      title,
      studioUrl: studioPath,
      url,
    };
  } catch (err) {
    console.error("importProductFromUrl: failed", err);
    return {
      ok: false,
      error:
        "Couldn't import that page — it may be blocking automated requests, or its layout wasn't recognisable.",
      url,
    };
  }
}

/**
 * Imports a batch of supplier product URLs sequentially — one at a time,
 * not in parallel — so a single slow/rate-limited supplier site doesn't get
 * hammered with concurrent requests, and so the OpenAI extraction calls stay
 * within reasonable rate limits too. Each URL's auth check is a fast no-op
 * after the first (same session), so the per-call overhead is negligible.
 */
export async function importProductsFromUrls(
  urls: string[],
  supplierName: string,
): Promise<ImportProductResult[]> {
  const trimmed = urls.map((u) => u.trim()).filter(Boolean);
  const capped = trimmed.slice(0, MAX_BATCH_URLS);

  const results: ImportProductResult[] = [];
  for (const url of capped) {
    results.push(await importProductFromUrl(url, supplierName));
  }
  return results;
}
