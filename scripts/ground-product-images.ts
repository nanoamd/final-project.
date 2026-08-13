/**
 * Puts every pack shot on the same white, and puts a shadow under the ones that
 * float.
 *
 * Damien: *"is it possible to make all images look like this? i like the shadow on
 * the floor"* — pointing at the reclaimed teak dining table, which sits on pure
 * white with a soft shadow spreading under its feet.
 *
 * Yes, for pack shots. The catalogue currently has three different looks in it and
 * they are visible side by side in any category grid: some products on pure white
 * with a floor shadow, some on pure white floating with nothing beneath them, and
 * some on a warm or cool grey sweep that reads as a dirty photograph next to a
 * white one. The reasoning and the limits are in scripts/lib/product-shadow.ts.
 *
 * **It writes nothing to Sanity.** It renders to a local folder and builds
 * before/after sheets, because replacing supplier photography on a live catalogue
 * is not a thing to do on my own judgement of my own output. Look at the sheets
 * first; uploading is a separate, later step, and the originals stay in the dataset
 * either way.
 *
 *   pnpm tsx --env-file=.env.local scripts/ground-product-images.ts
 *   pnpm tsx --env-file=.env.local scripts/ground-product-images.ts --limit 12
 *   pnpm tsx --env-file=.env.local scripts/ground-product-images.ts --all-images
 *
 * Output lands in .image-work/ (gitignored): one PNG per processed image, plus
 * sheet-N.png contact sheets pairing before and after.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@sanity/client";
import sharp from "sharp";

import {
  analyse,
  type Analysis,
  isPackShot,
  shadowField,
  standsOnFloor,
  subjectCoverage,
  whiteBalanceGain,
} from "./lib/product-shadow";

const args = process.argv.slice(2);
const limitArg = args.indexOf("--limit");
const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : Infinity;
const allImages = args.includes("--all-images");
/** Comma-separated slugs, for putting a specific handful on one sheet to judge. */
const onlyArg = args.indexOf("--only");
const only =
  onlyArg >= 0
    ? new Set((args[onlyArg + 1] ?? "").split(",").filter(Boolean))
    : null;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

/** Segmentation size. Small on purpose — see the note in product-shadow.ts. */
const ANALYSIS_WIDTH = 320;
/** Working size for the rendered output. Above this, file size stops buying anything. */
const OUTPUT_MAX = 1600;

const outputDir = path.join(process.cwd(), ".image-work");
const cacheDir = path.join(
  process.env.TMPDIR || "/tmp",
  "kaiku-image-shadow-cache",
);

async function fetchImage(url: string, width: number): Promise<Buffer | null> {
  const key = createHash("sha1").update(`${url}@${width}`).digest("hex");
  const file = path.join(cacheDir, `${key}.png`);
  try {
    return await readFile(file);
  } catch {
    const response = await fetch(`${url}?w=${width}&fit=max&fm=png&q=95`);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    await mkdir(cacheDir, { recursive: true });
    await writeFile(file, buffer);
    return buffer;
  }
}

async function raw(png: Buffer) {
  const { data, info } = await sharp(png)
    .flatten({ background: "#ffffff" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

type Verdict =
  | "room"
  | "wall-mounted"
  | "already-grounded"
  | "regraded"
  | "grounded"
  | "unchanged";

interface Result {
  slug: string;
  title: string;
  url: string;
  verdict: Verdict;
  note: string;
  before?: Buffer;
  after?: Buffer;
}

/**
 * Applies the white point correction and the synthesised shadow, in that order.
 *
 * Returns the encoded PNG and what was actually done, so nothing is claimed that
 * did not happen — an image whose backdrop is already white and which already has a
 * shadow comes back untouched and is reported as such.
 */
async function render(
  png: Buffer,
  analysis: Analysis,
  wantShadow: boolean,
): Promise<{ png: Buffer; regraded: boolean; grounded: boolean } | null> {
  const base = await raw(png);
  const { width, height } = base;
  const pixels = width * height;
  const out = Buffer.from(base.data);

  const gain = whiteBalanceGain(analysis.backdrop);
  if (gain) {
    for (let i = 0; i < pixels; i += 1)
      for (let c = 0; c < 3; c += 1) {
        const index = i * 3 + c;
        out[index] = Math.min(
          255,
          Math.round((base.data[index] ?? 0) * gain[c]!),
        );
      }
  }

  let grounded = false;
  if (wantShadow) {
    const field = shadowField({
      subject: analysis.subject,
      analysisWidth: analysis.width,
      analysisHeight: analysis.height,
      width,
      height,
    });
    const coverage = subjectCoverage({
      mask: analysis.mask,
      analysisWidth: analysis.width,
      analysisHeight: analysis.height,
      width,
      height,
    });
    for (let i = 0; i < pixels; i += 1) {
      // The product occludes its own shadow, so the shadow is held off every
      // pixel the mask calls product. This is what makes the pass safe to run on
      // expensive photography: it can only ever change backdrop.
      const alpha = field[i]! * (1 - coverage[i]!);
      if (alpha <= 0) continue;
      grounded = true;
      for (let c = 0; c < 3; c += 1) {
        const index = i * 3 + c;
        out[index] = Math.round((out[index] ?? 0) * (1 - alpha));
      }
    }
  }

  if (!gain && !grounded) return null;

  return {
    png: await sharp(out, { raw: { width, height, channels: 3 } })
      .png({ compressionLevel: 9 })
      .toBuffer(),
    regraded: Boolean(gain),
    grounded,
  };
}

async function main() {
  const products = await client.fetch<
    { slug: string; title: string; urls: string[] | null }[]
  >(
    `*[_type == "product" && !(_id in path("drafts.**")) && defined(slug.current)]{
      "slug": slug.current, title, "urls": gallery[].asset->url
    } | order(title asc)`,
  );

  const jobs: { slug: string; title: string; url: string }[] = [];
  for (const product of products) {
    if (only && !only.has(product.slug)) continue;
    const urls = allImages
      ? (product.urls ?? [])
      : (product.urls ?? []).slice(0, 1);
    for (const url of urls)
      jobs.push({ slug: product.slug, title: product.title, url });
  }
  const selected = jobs.slice(0, Number.isFinite(limit) ? limit : jobs.length);

  console.log(
    `\n${selected.length} image(s) from ${products.length} published products\n`,
  );

  await mkdir(outputDir, { recursive: true });
  const results: Result[] = [];

  for (const job of selected) {
    const small = await fetchImage(job.url, ANALYSIS_WIDTH);
    if (!small) {
      results.push({ ...job, verdict: "unchanged", note: "could not fetch" });
      continue;
    }
    const analysis = analyse(await raw(small));

    if (!isPackShot(analysis)) {
      results.push({
        ...job,
        verdict: "room",
        note: `backdrop ${(analysis.backdrop.share * 100).toFixed(0)}% — photographed in a setting, left alone`,
      });
      continue;
    }

    const floor = standsOnFloor(job.title);
    const wantShadow = !analysis.hasShadow && floor;

    const full = await fetchImage(job.url, OUTPUT_MAX);
    if (!full) {
      results.push({ ...job, verdict: "unchanged", note: "could not fetch" });
      continue;
    }

    const rendered = await render(full, analysis, wantShadow);
    const [r, g, b] = analysis.backdrop.rgb.map((c) => Math.round(c));
    const backdropNote = `sweep rgb(${r}, ${g}, ${b})`;

    if (!rendered) {
      results.push({
        ...job,
        verdict: analysis.hasShadow
          ? "already-grounded"
          : !floor
            ? "wall-mounted"
            : "unchanged",
        note: analysis.hasShadow
          ? `${backdropNote}, already has a shadow`
          : !floor
            ? `${backdropNote}, hangs on a wall — no floor to cast onto`
            : `${backdropNote}, nothing to correct`,
      });
      continue;
    }

    const file = path.join(
      outputDir,
      `${job.slug}-${createHash("sha1").update(job.url).digest("hex").slice(0, 6)}.png`,
    );
    await writeFile(file, rendered.png);

    results.push({
      ...job,
      verdict: rendered.grounded
        ? "grounded"
        : !floor
          ? "wall-mounted"
          : "regraded",
      note: [
        backdropNote,
        rendered.regraded ? "regraded to white" : null,
        rendered.grounded ? "shadow added" : null,
        !floor ? "wall-mounted, no shadow" : null,
      ]
        .filter(Boolean)
        .join(", "),
      before: full,
      after: rendered.png,
    });
  }

  for (const result of results)
    console.log(
      `  ${result.verdict.padEnd(17)} ${result.title.slice(0, 44).padEnd(46)} ${result.note}`,
    );

  const counts = new Map<Verdict, number>();
  for (const result of results)
    counts.set(result.verdict, (counts.get(result.verdict) ?? 0) + 1);
  console.log("");
  for (const [verdict, count] of [...counts].sort((a, b) => b[1] - a[1]))
    console.log(`  ${String(count).padStart(4)}  ${verdict}`);

  // Before/after sheets. Pairs are stacked vertically so the shadow is compared
  // against the same object at the same size, which is the only way to judge
  // whether it looks like a photograph or like a smudge.
  const changed = results.filter((r) => r.before && r.after);
  const CELL = 300;
  const LABEL = 34;
  const PER_SHEET = 4;
  for (let sheet = 0; sheet * PER_SHEET < changed.length; sheet += 1) {
    const batch = changed.slice(sheet * PER_SHEET, (sheet + 1) * PER_SHEET);
    const tiles: sharp.OverlayOptions[] = [];
    for (let i = 0; i < batch.length; i += 1) {
      const entry = batch[i]!;
      for (const [row, buffer] of [
        [0, entry.before!],
        [1, entry.after!],
      ] as const) {
        tiles.push({
          input: await sharp(buffer)
            .resize(CELL, CELL, { fit: "contain", background: "#e8e6e1" })
            .png()
            .toBuffer(),
          left: i * CELL,
          top: LABEL + row * (CELL + LABEL),
        });
      }
    }

    // Labels burnt into the sheet. A pair of near-identical white images is
    // impossible to review if you have to remember which row is which.
    const width = CELL * batch.length;
    const height = LABEL + (CELL + LABEL) * 2;
    const text = (label: string, top: number) =>
      `<text x="12" y="${top + 23}" font-family="Helvetica, Arial, sans-serif" font-size="17" font-weight="600" fill="#3d3a34" letter-spacing="1.5">${label}</text>`;
    tiles.push({
      input: Buffer.from(
        `<svg width="${width}" height="${height}">${text("BEFORE", 0)}${text(
          "AFTER",
          LABEL + CELL,
        )}</svg>`,
      ),
      left: 0,
      top: 0,
    });

    const file = path.join(outputDir, `sheet-${sheet + 1}.png`);
    await writeFile(
      file,
      await sharp({
        create: { width, height, channels: 3, background: "#e8e6e1" },
      })
        .composite(tiles)
        .png()
        .toBuffer(),
    );
    console.log(
      `\n  sheet-${sheet + 1}.png  ${batch
        .map((b) => b.title.split("|")[0]!.trim())
        .join(" · ")}`,
    );
  }

  console.log(
    `\nWritten to ${outputDir}. Nothing has been uploaded — look at the sheets first.\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
