/**
 * Makes one real visualiser render and writes it to a file, so the output can be
 * looked at instead of assumed.
 *
 * The rebuild it verifies: the request used to send the customer's photo plus a text
 * list of product *names*, so the model invented a plausible teak table from the words
 * and the shopper was looking at furniture they could not buy. It now sends the scene
 * and each product's own pack shot as separate input images. That is a claim about how
 * the output looks, and a claim about how output looks can only be settled by looking.
 *
 * It builds its request with the same `src/lib/visualiser/request.ts` the site uses,
 * so this exercises the real code path rather than an approximation of it.
 *
 * **It costs money.** One render is roughly 3–10p at current per-token pricing. It
 * needs `OPENAI_API_KEY` in `.env.local`, which is deliberately not committed.
 *
 *   pnpm tsx --env-file=.env.local scripts/check-visualiser.ts <photo.jpg>
 *   pnpm tsx --env-file=.env.local scripts/check-visualiser.ts <photo.jpg> camden-round-side-table,rutland-side-table
 *
 * Writes .image-work/visualiser-check.png (gitignored) and prints which model
 * answered, the size asked for, and how many reference images went with it.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@sanity/client";
import sharp from "sharp";

import {
  buildEditForm,
  buildPrompt,
  FALLBACK_IMAGE_MODEL,
  fetchReferenceImages,
  IMAGE_MODEL,
  isModelUnavailable,
  outputSize,
} from "../src/lib/visualiser/request";

const photoPath = process.argv[2];
const slugsArg = process.argv[3];

if (!photoPath) {
  console.error(
    "Usage: pnpm tsx --env-file=.env.local scripts/check-visualiser.ts <photo.jpg> [slug,slug]",
  );
  process.exit(1);
}

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error(
    "OPENAI_API_KEY is not set. Add it to .env.local — this script spends real money and cannot run without it.",
  );
  process.exit(1);
}

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  useCdn: false,
});

/** Outdoor products with a photograph, which is what the tool offers by default. */
const DEFAULT_SLUGS_QUERY = /* groq */ `
*[_type == "product" && !(_id in path("drafts.**"))
  && category->department->slug.current == "outdoor-living"
  && count(gallery) > 0][0...2]{ "slug": slug.current }.slug`;

async function main() {
  const slugs = slugsArg
    ? slugsArg.split(",").filter(Boolean)
    : await sanity.fetch<string[]>(DEFAULT_SLUGS_QUERY);

  if (!slugs.length) {
    console.error("No products to render. Pass slugs explicitly.");
    process.exit(1);
  }

  const products = await sanity.fetch<
    { slug: string; name: string; image: string | null }[]
  >(
    `*[_type == "product" && !(_id in path("drafts.**")) && slug.current in $slugs]{
      "slug": slug.current, "name": title, "image": gallery[0].asset->url
    }`,
    { slugs },
  );

  const missing = slugs.filter((s) => !products.some((p) => p.slug === s));
  for (const slug of missing) console.log(`  !  no such product: ${slug}`);
  if (!products.length) process.exit(1);

  const scene = await readFile(photoPath!);
  const meta = await sharp(scene).metadata();
  const size = outputSize(meta.width ?? 0, meta.height ?? 0);

  const references = await fetchReferenceImages(products);
  const prompt = buildPrompt(products);

  console.log(`\nScene      ${photoPath} (${meta.width}×${meta.height})`);
  console.log(`Size       ${size}`);
  console.log(
    `Products   ${products.length} · reference images attached: ${references.length}`,
  );
  for (const product of products)
    console.log(
      `           ${references.some((r) => r.slug === product.slug) ? "photo" : "NAME ONLY"}  ${product.name}`,
    );
  console.log(`\nPrompt\n${prompt}\n`);

  const send = (model: string) => {
    console.log(`Requesting ${model}…`);
    return fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: buildEditForm({
        model,
        scene,
        sceneType: meta.format === "png" ? "image/png" : "image/jpeg",
        references,
        prompt,
        size,
      }),
    });
  };

  const started = Date.now();
  let model = IMAGE_MODEL;
  let response = await send(model);
  if (!response.ok) {
    const detail = await response.text();
    if (!isModelUnavailable(response.status, detail)) {
      console.error(`\nFailed: ${response.status}\n${detail}\n`);
      process.exit(1);
    }
    console.log(
      `${IMAGE_MODEL} is not available to this account, falling back.\n${detail}`,
    );
    model = FALLBACK_IMAGE_MODEL;
    response = await send(model);
    if (!response.ok) {
      console.error(
        `\nFallback failed: ${response.status}\n${await response.text()}\n`,
      );
      process.exit(1);
    }
  }

  const data = (await response.json()) as {
    data?: { b64_json?: string }[];
    usage?: { total_tokens?: number };
  };
  const base64 = data.data?.[0]?.b64_json;
  if (!base64) {
    console.error("No image in the response.");
    process.exit(1);
  }

  const outputDir = path.join(process.cwd(), ".image-work");
  await mkdir(outputDir, { recursive: true });
  const file = path.join(outputDir, "visualiser-check.png");
  await writeFile(file, Buffer.from(base64, "base64"));

  console.log(
    `\nDone in ${Math.round((Date.now() - started) / 1000)}s with ${model}` +
      (data.usage?.total_tokens ? ` · ${data.usage.total_tokens} tokens` : "") +
      `\nWritten to ${file}\n` +
      `\nJudge it on one question: is that the actual product, or something that looks a bit like it?\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
