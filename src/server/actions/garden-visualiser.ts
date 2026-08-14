"use server";

import "server-only";

import crypto from "node:crypto";

import { cookies } from "next/headers";
import sharp from "sharp";

import { env } from "@/env";
import {
  getProductsByDepartment,
  getProductsBySlugs,
} from "@/lib/sanity/queries";
import {
  buildEditForm,
  buildPrompt,
  FALLBACK_IMAGE_MODEL,
  fetchReferenceImages,
  IMAGE_MODEL,
  isModelUnavailable,
  outputSize,
} from "@/lib/visualiser/request";
import {
  curateSet,
  OUTDOOR_DEPARTMENTS,
  outdoorPool,
  type SelectableProduct,
} from "@/lib/visualiser/selection";

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
  /** Only the products the vision model managed to locate in the result. */
  hotspots?: VisualiserHotspot[];
  /** Every product that went into the render, located or not. */
  products?: VisualiserProduct[];
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
 * A curated set for "let Kaiku design it for me".
 *
 * This used to shuffle the department's products and take three, which is what
 * produced Damien's verdict on a real render — *"it just dumps random products"* — and
 * put an indoor folding shelf on a decked terrace with nothing to sit on. Selection is
 * now by role, and for an outdoor scene the pool spans every outdoor department so a
 * garden can actually be shown a sauna. The reasoning is in
 * src/lib/visualiser/selection.ts.
 *
 * Prefers purchasable stock, but falls back to whatever the departments hold rather
 * than showing nothing.
 */
async function pickAutoProducts(
  departmentSlug: string,
): Promise<VisualiserProduct[]> {
  const outdoor = (OUTDOOR_DEPARTMENTS as readonly string[]).includes(
    departmentSlug,
  );

  // For an outdoor scene the pool is every outdoor department, not just the one the
  // visitor tapped. Picking "Outdoor Living" used to make the five outdoor saunas and
  // the cold plunge ineligible, because they sit under their own departments — so the
  // most transformative and most valuable things in the catalogue could never appear
  // in a garden. That was the tool's best trick, switched off by a filter.
  const departments = outdoor
    ? (OUTDOOR_DEPARTMENTS as readonly string[])
    : [departmentSlug];
  const fetched = await Promise.all(
    departments.map((slug) => getProductsByDepartment(slug)),
  );

  const seen = new Set<string>();
  const products = fetched.flat().filter((product) => {
    if (seen.has(product.slug)) return false;
    seen.add(product.slug);
    return true;
  });

  const purchasable = products.filter((p) => p.stockStatus !== "Coming Soon");
  const available = purchasable.length ? purchasable : products;

  const selectable: SelectableProduct[] = available.map((p) => ({
    slug: p.slug,
    name: p.name,
    category: p.category,
    price: p.price,
    image: p.image,
    roomTags: p.roomTags,
    departmentSlug: p.departmentSlug,
  }));

  const pool = outdoor ? outdoorPool(selectable) : selectable;

  // Variety without randomness: the set is curated by role, and `rotate` shifts which
  // candidate fills each role so a second attempt is not identical. Shuffling the
  // whole pool is what produced "it just dumps random products".
  const rotate = Math.floor(Math.random() * 3);
  const curated = curateSet(pool, { max: 3, rotate });

  return curated
    .map((choice) => available.find((p) => p.slug === choice.slug))
    .filter((p): p is (typeof available)[number] => Boolean(p))
    .map(toVisualiserProduct);
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

  // The photograph's own shape, so the result is not squeezed into a square. Read
  // with sharp rather than trusted from the client, which sends no dimensions.
  let size = "1024x1024";
  try {
    const meta = await sharp(imageBuffer).metadata();
    size = outputSize(meta.width ?? 0, meta.height ?? 0);
  } catch (err) {
    console.error("visualiseGarden: could not read photo dimensions", err);
  }

  const references = await fetchReferenceImages(products);

  const send = (model: string) =>
    fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: buildEditForm({
        model,
        scene: imageBuffer,
        sceneType: mimeType,
        references,
        prompt: buildPrompt(products),
        size,
      }),
    });

  let response = await send(IMAGE_MODEL);
  if (!response.ok) {
    const detail = await response.text();
    if (!isModelUnavailable(response.status, detail)) {
      console.error(
        "visualiseGarden: image edit failed",
        response.status,
        detail,
      );
      return {
        ok: false,
        error: "Something went wrong generating your image. Please try again.",
      };
    }
    console.error(
      `visualiseGarden: ${IMAGE_MODEL} unavailable, falling back to ${FALLBACK_IMAGE_MODEL}`,
      detail,
    );
    response = await send(FALLBACK_IMAGE_MODEL);
    if (!response.ok) {
      console.error(
        "visualiseGarden: fallback model also failed",
        response.status,
        await response.text(),
      );
      return {
        ok: false,
        error: "Something went wrong generating your image. Please try again.",
      };
    }
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

  // `products` is returned alongside the hotspots, and the UI renders it as a strip
  // under the image. Hotspot positions come from a vision model asked for x/y
  // percentages, which it is not reliable at — so a product used to vanish from the
  // page entirely whenever the model failed to locate it. Now the marker is a bonus
  // and the strip is the guarantee.
  return {
    ok: true,
    imageDataUrl: resultImageDataUrl,
    hotspots,
    products,
  };
}
