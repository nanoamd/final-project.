"use server";

import "server-only";

import crypto from "node:crypto";

import { cookies } from "next/headers";

import { env } from "@/env";
import {
  getProductsByDepartment,
  getProductsBySlugs,
} from "@/lib/sanity/queries";

const WEEKLY_LIMIT = 3;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const COOKIE_NAME = "gv_u";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_PRODUCTS = 4;
// Non-critical fallback — worst case a visitor without RATE_LIMIT_SECRET set
// can reset their own usage count by clearing cookies. Not a security boundary.
const FALLBACK_SECRET = "kaiku-garden-visualiser-fallback-secret";

export interface VisualiserProduct {
  slug: string;
  name: string;
  category: string;
  image?: string | null;
  price: number;
  currency: string;
}

export interface VisualiserHotspot {
  slug: string;
  name: string;
  category: string;
  image?: string | null;
  price: number;
  currency: string;
  /** Percentage (0-100) position within the generated image. */
  x: number;
  y: number;
}

export interface VisualiseGardenResult {
  ok: boolean;
  imageDataUrl?: string;
  hotspots?: VisualiserHotspot[];
  error?: string;
}

export type VisualiserSelection =
  | { mode: "manual"; productSlugs: string[] }
  | { mode: "auto"; departmentSlug: string };

function sign(payload: string) {
  const secret = env.RATE_LIMIT_SECRET ?? FALLBACK_SECRET;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function currentWeek() {
  return Math.floor(Date.now() / WEEK_MS);
}

async function readUsage(): Promise<number> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return 0;

  const [countStr, weekStr, sig] = raw.split(".");
  if (!countStr || !weekStr || !sig) return 0;
  if (sig !== sign(`${countStr}.${weekStr}`)) return 0;
  if (Number(weekStr) !== currentWeek()) return 0;

  return Number(countStr) || 0;
}

async function writeUsage(count: number) {
  const store = await cookies();
  const payload = `${count}.${currentWeek()}`;
  store.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WEEK_MS / 1000,
  });
}

/**
 * A small, real selection for "let Kaiku design it for me" — scoped to the
 * room the visitor actually picked (not the whole catalog, which today skews
 * heavily toward whichever department was most recently updated) and
 * randomised so repeat visits to the same room see variety rather than the
 * same fixed set every time. Prefers purchasable stock, but falls back to
 * whatever's in the department rather than showing nothing.
 */
async function pickAutoProducts(
  departmentSlug: string,
): Promise<VisualiserProduct[]> {
  const products = await getProductsByDepartment(departmentSlug);
  const purchasable = products.filter((p) => p.stockStatus !== "Coming Soon");
  const pool = purchasable.length ? purchasable : products;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map(toVisualiserProduct);
}

function toVisualiserProduct(p: {
  slug: string;
  name: string;
  category: string;
  image?: string | null;
  price: number;
  currency: string;
}): VisualiserProduct {
  return {
    slug: p.slug,
    name: p.name,
    category: p.category,
    image: p.image,
    price: p.price,
    currency: p.currency,
  };
}

function buildPrompt(products: VisualiserProduct[]) {
  const list = products.map((p) => `- ${p.name}`).join("\n");
  return `Add the following real products into this garden photo, placed naturally and realistically at true-to-life scale:\n${list}\n\nDo not alter, resurface, regrow, or replace any existing element already in the photo — the lawn, patio, paving, decking, fencing, planting and sky must stay exactly as they are; only add the listed items on top of or within the existing scene. Keep the existing layout, lighting and perspective realistic and unchanged elsewhere. Each product should be clearly visible, identifiable and not partially hidden. Do not include any text, labels, signage, watermarks, or writing of any kind anywhere in the image.`;
}

/**
 * Uses a cheap vision-capable chat model to locate each product within the
 * generated image, since the image-generation model itself returns no
 * coordinates. Best-effort — a product missing from the response just gets
 * no hotspot rather than failing the whole generation.
 */
async function locateHotspots(
  imageDataUrl: string,
  products: VisualiserProduct[],
): Promise<Map<string, { x: number; y: number }>> {
  const positions = new Map<string, { x: number; y: number }>();
  if (!products.length) return positions;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Find these products in the image and return their center point as a percentage of image width/height (0-100, 0 = left/top). Products: ${products.map((p) => p.name).join(", ")}. Respond with strict JSON: {"items": [{"name": "<exact product name>", "x": <number>, "y": <number>}]}. Omit any product you can't locate.`,
              },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("locateHotspots: OpenAI request failed", response.status);
      return positions;
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return positions;

    const parsed = JSON.parse(content) as {
      items?: { name?: string; x?: number; y?: number }[];
    };
    for (const item of parsed.items ?? []) {
      const match = products.find(
        (p) => p.name.toLowerCase() === item.name?.toLowerCase(),
      );
      if (match && typeof item.x === "number" && typeof item.y === "number") {
        positions.set(match.slug, {
          x: Math.min(97, Math.max(3, item.x)),
          y: Math.min(97, Math.max(3, item.y)),
        });
      }
    }
  } catch (err) {
    console.error("locateHotspots: request threw", err);
  }

  return positions;
}

/**
 * Generates an AI-redesigned version of an uploaded garden photo with real
 * products from the catalog added in, then locates each one in the result so
 * the UI can render tap-to-reveal product cards. Usage is capped per visitor
 * via a signed, httpOnly cookie (not surfaced beyond a generic message).
 *
 * Takes a FormData (photo file + JSON-encoded selection) rather than a
 * base64 string argument — Next's server-action argument serialization has
 * an internal size/nesting limit that a several-MB base64 string trips,
 * independent of the `serverActions.bodySizeLimit` config. FormData with a
 * real File/Blob is transported as binary instead and doesn't hit it.
 */
export async function visualiseGarden(
  formData: FormData,
): Promise<VisualiseGardenResult> {
  try {
    return await runVisualiseGarden(formData);
  } catch (err) {
    console.error("visualiseGarden: threw", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

async function runVisualiseGarden(
  formData: FormData,
): Promise<VisualiseGardenResult> {
  if (!env.OPENAI_API_KEY) {
    return {
      ok: false,
      error: "This tool isn't available right now — check back soon.",
    };
  }

  const used = await readUsage();
  if (used >= WEEKLY_LIMIT) {
    return {
      ok: false,
      error:
        "You've used all your free visualisations for now — check back soon.",
    };
  }

  const selectionRaw = formData.get("selection");
  const selection =
    typeof selectionRaw === "string"
      ? (JSON.parse(selectionRaw) as VisualiserSelection)
      : null;
  if (!selection) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  const products =
    selection.mode === "auto"
      ? await pickAutoProducts(selection.departmentSlug)
      : (
          await getProductsBySlugs(
            selection.productSlugs.slice(0, MAX_PRODUCTS),
          )
        ).map(toVisualiserProduct);

  if (!products.length) {
    return { ok: false, error: "Choose at least one product to add." };
  }

  const photo = formData.get("photo");
  if (!(photo instanceof File) || !photo.type.startsWith("image/")) {
    return { ok: false, error: "Please upload a valid photo." };
  }
  if (photo.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Please upload a photo under 8MB." };
  }
  const imageBuffer = Buffer.from(await photo.arrayBuffer());
  const mimeType = photo.type;

  const form = new FormData();
  form.append("model", "gpt-image-1-mini");
  form.append(
    "image",
    new Blob([new Uint8Array(imageBuffer)], { type: mimeType }),
    "garden",
  );
  form.append("prompt", buildPrompt(products));
  form.append("size", "1024x1024");
  // "high"/"auto" quality regularly took ~60s in testing, right at the edge
  // of (and in production, sometimes past) serverless function time limits.
  // "medium" is markedly faster while still producing a convincing composite.
  form.append("quality", "medium");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: form,
  });

  if (!response.ok) {
    console.error(
      "visualiseGarden: image edit request failed",
      response.status,
      await response.text(),
    );
    return {
      ok: false,
      error: "Something went wrong generating your image. Please try again.",
    };
  }

  const data = (await response.json()) as { data?: { b64_json?: string }[] };
  const resultBase64 = data.data?.[0]?.b64_json;
  if (!resultBase64) {
    return {
      ok: false,
      error: "Something went wrong generating your image. Please try again.",
    };
  }

  const resultImageDataUrl = `data:image/png;base64,${resultBase64}`;
  const positions = await locateHotspots(resultImageDataUrl, products);

  const hotspots: VisualiserHotspot[] = products
    .filter((p) => positions.has(p.slug))
    .map((p) => ({ ...p, ...positions.get(p.slug)! }));

  await writeUsage(used + 1);

  return { ok: true, imageDataUrl: resultImageDataUrl, hotspots };
}
