"use server";

import "server-only";

import crypto from "node:crypto";

import { env } from "@/env";
import { getCategories } from "@/lib/sanity/queries/category";
import { createClient } from "@/lib/supabase/server";
import { getSanityWriteClient } from "@/server/sanity/write-client";

export interface ImportProductResult {
  ok: boolean;
  error?: string;
  title?: string;
  studioUrl?: string;
}

const FETCH_TIMEOUT_MS = 15_000;
const MAX_HTML_BYTES = 2_000_000;
const MAX_PROMPT_CHARS = 6_000;

interface ExtractedFields {
  title?: string;
  tagline?: string;
  summary?: string;
  description?: string;
  price?: number;
  currency?: string;
  sku?: string;
  highlights?: string[];
  specs?: { label: string; value: string }[];
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: "mm" | "cm" | "m";
  };
  weight?: { value?: number; unit?: "kg" | "g" };
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
  ogImage?: string;
  jsonLdImage?: string;
  jsonLdPrice?: string;
  jsonLdCurrency?: string;
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
  const ogImageRaw = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i,
  )?.[1];
  const ogImage = ogImageRaw
    ? new URL(ogImageRaw, pageUrl).toString()
    : undefined;

  let jsonLdImage: string | undefined;
  let jsonLdPrice: string | undefined;
  let jsonLdCurrency: string | undefined;
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
          if (!jsonLdImage) {
            if (typeof image === "string") jsonLdImage = image;
            else if (Array.isArray(image) && typeof image[0] === "string")
              jsonLdImage = image[0];
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
          }
        }
      }
    } catch {
      // Malformed JSON-LD on the source page — skip it, not fatal.
    }
  }
  if (jsonLdImage) {
    try {
      jsonLdImage = new URL(jsonLdImage, pageUrl).toString();
    } catch {
      jsonLdImage = undefined;
    }
  }

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
    ogImage,
    jsonLdImage,
    jsonLdPrice,
    jsonLdCurrency,
    bodyText,
  };
}

async function extractProductFields(
  signals: PageSignals,
  categories: { slug: string; name: string }[],
): Promise<ExtractedFields | null> {
  const categoryList = categories.map((c) => `${c.slug}: ${c.name}`).join("\n");

  const prompt = `You are extracting furniture/home-product data from a scraped supplier page for Kaiku Home, a premium Scandinavian/Japandi furniture retailer. Return ONLY strict JSON matching this shape (omit fields you can't determine, use null rather than guessing):

{
  "title": string,
  "tagline": string,
  "summary": string (1-2 sentences),
  "description": string (2-4 sentences, plain text),
  "price": number (numeric value only, no currency symbol),
  "currency": string (ISO 4217, e.g. "GBP"),
  "sku": string,
  "highlights": string[] (max 6, short phrases),
  "specs": [{"label": string, "value": string}] (max 10),
  "dimensions": {"length": number, "width": number, "height": number, "unit": "mm"|"cm"|"m"},
  "weight": {"value": number, "unit": "kg"|"g"},
  "categorySlug": one of these exact slugs, or null if none fit well:
${categoryList}
}

Page signals:
Title: ${signals.title ?? signals.ogTitle ?? ""}
Meta/OG description: ${signals.metaDescription ?? signals.ogDescription ?? ""}
JSON-LD price: ${signals.jsonLdPrice ?? ""} ${signals.jsonLdCurrency ?? ""}
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

export async function importProductFromUrl(
  url: string,
): Promise<ImportProductResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminEmail = env.ADMIN_EMAIL;
  const authorized =
    !!user?.email &&
    !!adminEmail &&
    user.email.toLowerCase() === adminEmail.toLowerCase();
  if (!authorized) {
    return { ok: false, error: "Unauthorized." };
  }

  if (!env.OPENAI_API_KEY) {
    return {
      ok: false,
      error: "This tool isn't available right now — OPENAI_API_KEY isn't set.",
    };
  }
  const writeClient = getSanityWriteClient();
  if (!writeClient) {
    return {
      ok: false,
      error:
        "This tool isn't available right now — SANITY_API_WRITE_TOKEN isn't set.",
    };
  }

  const safeUrl = isSafeUrl(url);
  if (!safeUrl) {
    return { ok: false, error: "Please enter a valid http(s) product URL." };
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

    const imageUrl = signals.jsonLdImage ?? signals.ogImage;
    let gallery: {
      _type: "image";
      asset: { _type: "reference"; _ref: string };
    }[] = [];
    if (imageUrl) {
      try {
        const imageResponse = await fetch(imageUrl, {
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        if (imageResponse.ok) {
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
          const asset = await writeClient.assets.upload("image", imageBuffer);
          gallery = [
            { _type: "image", asset: { _type: "reference", _ref: asset._id } },
          ];
        }
      } catch (err) {
        console.error("importProductFromUrl: image upload failed", err);
      }
    }

    const matchedCategory = fields?.categorySlug
      ? categories.find((c) => c.slug === fields.categorySlug)
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
      ...(fields?.tagline ? { tagline: fields.tagline } : {}),
      ...(fields?.summary ? { summary: fields.summary } : {}),
      ...(fields?.description
        ? { description: [textBlock(fields.description)] }
        : {}),
      ...(typeof fields?.price === "number" ? { price: fields.price } : {}),
      ...(fields?.currency ? { currency: fields.currency } : {}),
      ...(fields?.sku ? { sku: fields.sku } : {}),
      ...(fields?.highlights?.length ? { highlights: fields.highlights } : {}),
      ...(fields?.specs?.length
        ? {
            specs: fields.specs.map((s, i) => ({
              _type: "productSpec",
              _key: `spec-${i}`,
              label: s.label,
              value: s.value,
            })),
          }
        : {}),
      ...(fields?.dimensions ? { dimensions: fields.dimensions } : {}),
      ...(fields?.weight ? { weight: fields.weight } : {}),
      ...(gallery.length ? { gallery } : {}),
      sourceUrl: safeUrl.toString(),
    });

    return {
      ok: true,
      title,
      studioUrl: `/studio/structure/product;${baseId}`,
    };
  } catch (err) {
    console.error("importProductFromUrl: failed", err);
    return {
      ok: false,
      error:
        "Couldn't import that page — it may be blocking automated requests, or its layout wasn't recognisable.",
    };
  }
}
