/**
 * Builds the image-edit request the visualiser sends, and nothing else.
 *
 * Split out of the server action for two reasons. The action is `"use server"` and
 * imports `server-only`, so nothing outside a Next request can touch it — which meant
 * the one part of this feature most worth checking against the real API could not be
 * checked at all. And these functions are pure, so they can be tested without
 * spending money on a render.
 *
 * `scripts/check-visualiser.ts` and `src/server/actions/garden-visualiser.ts` both
 * build their request from here, so a live check exercises the same code the site
 * runs rather than an approximation of it.
 *
 * **What was wrong with the request before.** It sent the customer's photo and a text
 * list of product *names* — "Reclaimed Teak Dining Table 180cm" — and nothing else.
 * The model had never seen the product, so it invented a plausible teak table from
 * the words, and the shopper ended up looking at furniture they could not buy with a
 * "buy this" card pinned to it. OpenAI's edits endpoint accepts multiple input
 * images, so the scene goes in first and each product's own pack shot goes in behind
 * it. That is the difference between "a table like that" and "that table".
 */

/**
 * `gpt-image-2` processes every image input at high fidelity automatically, which is
 * what a request carrying real product photographs wants, and it removes the fidelity
 * setting as one more thing to get wrong. The fallback is the model this tool shipped
 * with, so an account without access to the newer one still gets a working tool.
 */
export const IMAGE_MODEL = "gpt-image-2";
export const FALLBACK_IMAGE_MODEL = "gpt-image-1-mini";

/** Reference photographs are asked for at this width on the Sanity CDN. */
export const REFERENCE_WIDTH = 768;

export interface VisualiserProductRef {
  slug: string;
  name: string;
  image?: string | null;
}

export interface ReferenceImage {
  slug: string;
  blob: Blob;
}

/**
 * The instruction, written for a request that carries reference photographs.
 *
 * It has two jobs the old prompt did not: say which image is which, and insist the
 * products are reproduced rather than reinterpreted. The "add to the scene, do not
 * redecorate it" line is kept from the original, because an edit model will happily
 * resurface someone's patio if you let it.
 */
export function buildPrompt(products: VisualiserProductRef[]): string {
  const list = products
    .map((product, index) => `Image ${index + 2}: ${product.name}`)
    .join("\n");

  return [
    "Image 1 is a photograph of a real outdoor space. The images after it are photographs of real products.",
    "",
    list,
    "",
    "Place every product from images 2 onwards into the scene in image 1. Reproduce each product exactly as photographed — same shape, same materials, same colour, same proportions. Do not substitute a similar item and do not restyle them.",
    "Place them at true-to-life scale for the space, standing on the ground, matching the scene's perspective and the direction of its light, each casting a soft shadow where it meets the ground.",
    "Keep everything already in image 1 unchanged: the lawn, patio, paving, decking, fencing, planting, building and sky stay exactly as they are. Add to the scene, do not redecorate it.",
    "Every product must be fully visible and unobstructed.",
    "No text, labels, signage, watermarks, price tags or writing of any kind anywhere in the image.",
  ].join("\n");
}

/**
 * The output size closest to the shape of the photograph the visitor uploaded.
 *
 * The first version asked for `1024x1024` regardless, so a phone photo of a garden —
 * 4:3 or 16:9 — came back cropped and stretched. Handing somebody a distorted picture
 * of their own garden is a quick way to lose their trust in everything else on the
 * page.
 *
 * Three sizes rather than the full modern list, because these are the ones both the
 * current model and the fallback accept.
 */
export function outputSize(width: number, height: number): string {
  if (!width || !height) return "1024x1024";
  const ratio = width / height;
  if (ratio >= 1.2) return "1536x1024";
  if (ratio <= 0.83) return "1024x1536";
  return "1024x1024";
}

/**
 * Downloads each product's lead photograph to send as a reference.
 *
 * A product whose image cannot be fetched is dropped from the references rather than
 * failing the whole render. It is still named in the prompt, which is the old, worse
 * behaviour — but for one product instead of all of them.
 */
export async function fetchReferenceImages(
  products: VisualiserProductRef[],
): Promise<ReferenceImage[]> {
  const references = await Promise.all(
    products.map(async (product) => {
      if (!product.image) return null;
      try {
        const response = await fetch(
          `${product.image}?w=${REFERENCE_WIDTH}&fit=max&fm=png`,
        );
        if (!response.ok) {
          console.error(
            "fetchReferenceImages: failed",
            product.slug,
            response.status,
          );
          return null;
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        return {
          slug: product.slug,
          blob: new Blob([new Uint8Array(buffer)], { type: "image/png" }),
        };
      } catch (err) {
        console.error("fetchReferenceImages: threw", product.slug, err);
        return null;
      }
    }),
  );
  return references.filter((r): r is ReferenceImage => r !== null);
}

/**
 * The multipart body for `POST /v1/images/edits`.
 *
 * The scene is appended first and the products follow, in the order the prompt refers
 * to them. `image[]` repeated is how the REST API takes more than one image — the
 * singular `image` field only ever carries one, which is what the old request used.
 */
export function buildEditForm({
  model,
  scene,
  sceneType,
  references,
  prompt,
  size,
  quality = "medium",
}: {
  model: string;
  scene: Buffer;
  sceneType: string;
  references: ReferenceImage[];
  prompt: string;
  size: string;
  quality?: "low" | "medium" | "high";
}): FormData {
  const form = new FormData();
  form.append("model", model);
  form.append(
    "image[]",
    new Blob([new Uint8Array(scene)], { type: sceneType }),
    "scene",
  );
  for (const reference of references)
    form.append("image[]", reference.blob, `${reference.slug}.png`);
  form.append("prompt", prompt);
  form.append("size", size);
  // "high" regularly took ~60s in testing, at or past the serverless limit. Now that
  // the model can see the real products, quality is no longer what holds the output
  // back, so "medium" stays.
  form.append("quality", quality);
  return form;
}

/**
 * Whether a failed response means "this account cannot use that model".
 *
 * Worth retrying, and invisible otherwise: the tool would simply stop working on the
 * day the preferred model changed, with a generic error for every visitor. Anything
 * else is a real failure and should not be retried.
 */
export function isModelUnavailable(status: number, body: string): boolean {
  return (status === 400 || status === 404) && /model/i.test(body);
}
