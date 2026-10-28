/**
 * Re-encodes the images in `public/` to the format their content actually
 * calls for.
 *
 * ## Why this is not next/image's job
 *
 * It normally would be, but not here. `next.config.ts` sets
 * `loader: "custom"` pointing at `src/lib/sanity/image-loader.ts`, because
 * Vercel's optimiser answered **HTTP 402 Payment Required** once the account
 * hit its transformation allowance and every new product lost its pictures.
 * Sanity's CDN does that job for product imagery instead — and the loader
 * passes a non-Sanity source **through untouched**.
 *
 * Local files under `public/` are a non-Sanity source. So every one of them is
 * served to every visitor at its original dimensions in its original format,
 * with no resizing and no WebP, by design. The only place left to make them
 * smaller is on disk.
 *
 * ## What was on disk
 *
 * Measured by loading the home page in Chromium at 390x844 and summing
 * `encodedBodySize` across its image requests: **26,973 KB over 94 requests**.
 * 27 MB, to a phone. The worst of it:
 *
 *     7,258 KB  design-philosophy-hero.png   2896x1880  rendered ~700px wide
 *     5,530 KB  sauna-collection-hero.png    1502x1878
 *     2,393 KB  garden-before.jpg            PNG bytes in a .jpg name
 *     2,350 KB  garden-after.jpg             PNG bytes in a .jpg name
 *
 * Both "hero PNGs" are photographs stored losslessly, which is the worst
 * available choice for a photograph, and both garden files are PNGs wearing a
 * `.jpg` extension — so nothing downstream could have guessed their real
 * weight from the filename.
 *
 * ## What it does
 *
 * Re-encodes in place, keeping each file's extension honest:
 *
 *   - `.jpg` / `.jpeg` -> mozjpeg at q82, progressive
 *   - `.webp`          -> webp at q80
 *   - `.png`           -> kept as PNG and only recompressed, because a `.png`
 *                         may be carrying transparency something depends on.
 *                         A photographic PNG is listed for conversion instead
 *                         (see `--convert`), since changing its extension
 *                         means changing the code that references it.
 *
 * Nothing is enlarged, and nothing is resized below `MAX_WIDTH`, which is
 * generous on purpose: the standing instruction is not to change the desktop
 * site unnecessarily, and 1920px still covers a full-bleed hero on a 2x
 * display.
 *
 * Dry run by default. `--apply` writes.
 */
import { readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

/** Wide enough for a full-bleed hero at 2x on a 960px-wide viewport. */
const MAX_WIDTH = 1920;
const JPEG_QUALITY = 82;
const WEBP_QUALITY = 80;

/** Below this there is nothing worth the risk of re-encoding. */
const MIN_BYTES = 120 * 1024;

const ROOT = path.join(process.cwd(), "public");
const APPLY = process.argv.includes("--apply");
/**
 * Also replace a photographic `.png` with a `.webp` and delete the original.
 * Separate from `--apply` because it breaks every reference to the old
 * filename until those are updated, so it is a deliberate two-step: convert,
 * then fix the references the run prints.
 */
const CONVERT = process.argv.includes("--convert-png");

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

function kb(bytes: number): string {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

async function main() {
  let before = 0;
  let after = 0;
  let touched = 0;
  const convert: string[] = [];

  for await (const file of walk(ROOT)) {
    const ext = path.extname(file).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) continue;

    const original = (await stat(file)).size;
    before += original;
    if (original < MIN_BYTES) {
      after += original;
      continue;
    }

    let meta: sharp.Metadata;
    try {
      meta = await sharp(file).metadata();
    } catch {
      console.log(`  skip (unreadable)  ${path.relative(ROOT, file)}`);
      after += original;
      continue;
    }

    const width = meta.width ?? 0;
    const resize =
      width > MAX_WIDTH ? { width: MAX_WIDTH, withoutEnlargement: true } : null;

    /**
     * A photograph stored as PNG cannot be fixed by recompression — it needs a
     * different codec, and a different codec means a different extension,
     * which means touching the code that references it.
     *
     * Tested on the extension, not just the contents: `garden-after.jpg` holds
     * PNG bytes but is already handled, because the pipeline below encodes to
     * whatever the extension claims and so turns it into a real JPEG. Only a
     * file actually *named* `.png` needs the reference change.
     */
    const photographicPng =
      ext === ".png" && !meta.hasAlpha && original > 300 * 1024;

    // The extension decides the output format, not the current contents — a
    // PNG living in a `.jpg` name becomes a real JPEG, which is both smaller
    // and finally honest about what it is.
    const pipeline = sharp(file, { failOn: "none" });
    if (resize) pipeline.resize(resize);
    const encoded =
      ext === ".webp"
        ? pipeline.webp({ quality: WEBP_QUALITY })
        : ext === ".png" && meta.hasAlpha
          ? pipeline.png({ compressionLevel: 9, palette: true })
          : ext === ".png"
            ? pipeline.png({ compressionLevel: 9 })
            : pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });

    const output = await encoded.toBuffer();

    if (photographicPng) {
      const webp = await sharp(file, { failOn: "none" })
        .resize(resize ?? {})
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
      const sibling = file.replace(/\.png$/i, ".webp");
      convert.push(
        `${path.relative(ROOT, file)} -> ${path.relative(ROOT, sibling)}` +
          `  (${kb(original)} -> ${kb(webp.byteLength)} as WebP,` +
          ` vs ${kb(output.byteLength)} recompressed as PNG)`,
      );
      if (APPLY && CONVERT) {
        await sharp(webp).toFile(sibling);
        await rm(file);
        after += webp.byteLength;
        touched += 1;
        continue;
      }
    }

    // Never write a bigger file than the one already there.
    if (output.byteLength >= original) {
      after += original;
      continue;
    }

    after += output.byteLength;
    touched += 1;
    const saved = original - output.byteLength;
    console.log(
      `  ${kb(original).padStart(8)} -> ${kb(output.byteLength).padStart(8)}` +
        `  (-${((saved / original) * 100).toFixed(0)}%)` +
        `${resize ? `  resized ${width}->${MAX_WIDTH}` : ""}` +
        `  ${path.relative(ROOT, file)}`,
    );

    if (APPLY) {
      // Written beside the original and moved into place, so an interrupted
      // run cannot leave a half-written image in public/.
      const tmp = `${file}.tmp`;
      await sharp(output).toFile(tmp);
      await rename(tmp, file);
    }
  }

  console.log(
    `\n${APPLY ? "Rewrote" : "Would rewrite"} ${touched} file(s): ` +
      `${kb(before)} -> ${kb(after)} ` +
      `(-${(((before - after) / before) * 100).toFixed(0)}%)`,
  );

  if (convert.length) {
    console.log(
      `\n${convert.length} photographic PNG(s) are worth a codec change, not ` +
        `just recompression:`,
    );
    for (const file of convert) console.log(`  ${file}`);
    if (!CONVERT) {
      console.log(
        "\nPass --convert-png with --apply to write the .webp and delete the " +
          ".png. Every reference to the old filename then has to be updated, " +
          "which is why it is not part of --apply.",
      );
    }
  }

  if (!APPLY) console.log("\nDry run. Pass --apply to write.");
}

if (process.argv[1]?.endsWith("optimise-public-images.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
