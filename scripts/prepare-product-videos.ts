/**
 * Prepares supplier product videos for the site: finds the branded end card,
 * trims it, re-encodes for the web and writes a poster frame.
 *
 * Supplier footage is not web-ready. A typical Aosom MP4 is 30-60 MB, 1080p or
 * larger, and ends on two or three seconds of logo. Uploaded as-is that is a
 * 40 MB download sitting on a product page.
 *
 * HOW THE END CARD IS FOUND, in order — each falls through to the next:
 *
 *   1. freezedetect. A logo card is a still frame. ffmpeg reports frozen
 *      sections directly, and if one starts in the last third and runs to the
 *      end, its start is the cut. This is the reliable signal, because a still
 *      tail is exactly what an outro is.
 *
 *   2. Scene detection. Where the outro animates, the hard cut into it scores
 *      high on ffmpeg's scene metric. The last such cut inside the final eight
 *      seconds is taken as the boundary.
 *
 *   3. Nothing. The video is re-encoded untrimmed and reported as needing a
 *      look. Guessing a duration would silently cut real footage.
 *
 * --trim <seconds> overrides all of it and cuts that much off the end.
 *
 * A logo burnt into a corner for the whole video is a different problem and
 * this does not touch it: ffmpeg's delogo filter blurs a rectangle, which looks
 * worse than the watermark. Ask the supplier for unbranded masters — most trade
 * programmes have them, which saves this step entirely.
 *
 * Requires ffmpeg (brew install ffmpeg). Reads nothing but the input folder and
 * writes only into --out; never touches the originals.
 *
 * Dry run by default — probes every file and prints what it would do:
 *   pnpm tsx scripts/prepare-product-videos.ts --in ~/Desktop/aosom-videos
 *   pnpm tsx scripts/prepare-product-videos.ts --in ~/Desktop/aosom-videos --apply
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}
const inputDir = arg("in");
const outDir = arg("out") ?? "./videos-web";
const apply = process.argv.includes("--apply");
const forcedTrim = arg("trim") ? Number(arg("trim")) : undefined;
/** Longest end card worth believing in. Beyond this it is probably content. */
const MAX_TRIM = 12;
/** Target width. 1280 is plenty for a gallery box ~700px wide on a 2x screen. */
const WIDTH = 1280;

if (!inputDir) {
  console.error(
    "Usage: prepare-product-videos.ts --in <folder> [--out <folder>]\n" +
      "                                [--trim <seconds>] [--apply]",
  );
  process.exit(1);
}

/**
 * Returns stdout AND stderr together, because ffmpeg writes everything worth
 * reading to stderr — including the freezedetect and showinfo lines this script
 * exists to parse. Reading only stdout is why the first version of this
 * detected nothing at all on footage that plainly had an end card.
 *
 * spawnSync rather than execFileSync so a non-zero exit still yields the output;
 * ffmpeg exits non-zero for warnings that do not prevent a usable result.
 */
function run(command: string, args: string[]): { out: string; ok: boolean } {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  return {
    out: `${result.stdout ?? ""}\n${result.stderr ?? ""}`,
    ok: result.status === 0,
  };
}

/** For the encode steps, where a failure must not pass silently. */
function runOrThrow(command: string, args: string[]): string {
  const { out, ok } = run(command, args);
  if (!ok)
    throw new Error(out.trim().split("\n").slice(-3).join(" ").slice(0, 200));
  return out;
}

function ffmpegAvailable(): boolean {
  try {
    return run("ffmpeg", ["-version"]).ok;
  } catch {
    return false;
  }
}

function duration(file: string): number {
  const out = execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=nw=1:nk=1",
      file,
    ],
    { encoding: "utf8" },
  );
  return Number(out.trim());
}

/**
 * A frozen tail. `-60dB` is ffmpeg's own default noise floor for the filter and
 * catches a static card even with faint compression noise; `d=0.8` ignores the
 * momentary stillness of a slow pan.
 */
function freezeStart(file: string, total: number): number | null {
  const output = run("ffmpeg", [
    "-hide_banner",
    "-i",
    file,
    "-vf",
    "freezedetect=n=-60dB:d=0.8",
    "-map",
    "0:v:0",
    "-f",
    "null",
    "-",
  ]).out;
  const starts = [...output.matchAll(/freeze_start:\s*([\d.]+)/g)].map((m) =>
    Number(m[1]),
  );
  const ends = [...output.matchAll(/freeze_end:\s*([\d.]+)/g)].map((m) =>
    Number(m[1]),
  );
  if (!starts.length) return null;

  const start = starts[starts.length - 1]!;
  // Only a freeze that runs to the end of the file is an end card. One that
  // finishes mid-video is a held shot, and cutting there would lose footage.
  const closed = ends.length >= starts.length;
  if (closed && ends[ends.length - 1]! < total - 0.5) return null;
  if (start < total * 0.66) return null;
  if (total - start > MAX_TRIM) return null;
  return start;
}

/** The last hard cut in the closing seconds, for an outro that animates. */
function lastSceneCut(file: string, total: number): number | null {
  const output = run("ffmpeg", [
    "-hide_banner",
    "-i",
    file,
    "-vf",
    "select='gt(scene,0.4)',showinfo",
    "-map",
    "0:v:0",
    "-f",
    "null",
    "-",
  ]).out;
  const times = [...output.matchAll(/pts_time:([\d.]+)/g)].map((m) =>
    Number(m[1]),
  );
  const late = times.filter((t) => t > total - 8 && t < total - 0.5);
  return late.length ? late[late.length - 1]! : null;
}

function encode(input: string, output: string, endAt: number | null) {
  const args = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    input,
    ...(endAt !== null ? ["-t", endAt.toFixed(2)] : []),
    "-vf",
    `scale='min(${WIDTH},iw)':-2`,
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-crf",
    "24",
    "-preset",
    "slow",
    "-pix_fmt",
    "yuv420p",
    // Puts the moov atom at the front, so the browser can start playing before
    // the whole file has arrived. Without it a 3 MB file behaves like a 3 MB
    // download that must finish first.
    "-movflags",
    "+faststart",
    "-c:a",
    "aac",
    "-b:a",
    "96k",
    "-ac",
    "2",
    output,
  ];
  runOrThrow("ffmpeg", args);
}

/** A frame one second in — the very first frame is often black. */
function poster(input: string, output: string) {
  runOrThrow("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-ss",
    "1",
    "-i",
    input,
    "-frames:v",
    "1",
    "-vf",
    `scale='min(${WIDTH},iw)':-2`,
    "-q:v",
    "3",
    output,
  ]);
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function main() {
  if (!ffmpegAvailable()) {
    console.error(
      "ffmpeg is not installed.\n\n  brew install ffmpeg\n\n" +
        "Everything else here depends on it.",
    );
    process.exit(1);
  }
  if (!existsSync(inputDir!)) {
    console.error(`No such folder: ${inputDir}`);
    process.exit(1);
  }

  const files = readdirSync(inputDir!)
    .filter((f) => /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(f))
    .sort();

  if (!files.length) {
    console.error(`No video files in ${inputDir}.`);
    process.exit(1);
  }
  if (apply) mkdirSync(outDir, { recursive: true });

  console.log(`\n${files.length} video(s) in ${inputDir}\n`);
  let unresolved = 0;

  for (const file of files) {
    const input = join(inputDir!, file);
    const stem = basename(file, extname(file));
    const total = duration(input);
    const sourceSize = statSync(input).size;

    let endAt: number | null = null;
    let how = "";
    if (forcedTrim !== undefined) {
      endAt = Math.max(0, total - forcedTrim);
      how = `--trim ${forcedTrim}s`;
    } else {
      const freeze = freezeStart(input, total);
      if (freeze !== null) {
        endAt = freeze;
        how = "still end card";
      } else {
        const cut = lastSceneCut(input, total);
        if (cut !== null) {
          endAt = cut;
          how = "scene change";
        } else {
          how = "no end card found — left full length";
          unresolved++;
        }
      }
    }

    const trimmed = endAt === null ? 0 : total - endAt;
    console.log(
      `  ${stem.slice(0, 52)}\n` +
        `    ${total.toFixed(1)}s, ${mb(sourceSize)} → ` +
        `${endAt === null ? total.toFixed(1) : endAt.toFixed(1)}s` +
        `${trimmed ? ` (cut ${trimmed.toFixed(1)}s: ${how})` : ` (${how})`}`,
    );

    if (!apply) continue;

    const videoOut = join(outDir, `${stem}.mp4`);
    const posterOut = join(outDir, `${stem}-poster.jpg`);
    try {
      encode(input, videoOut, endAt);
      poster(videoOut, posterOut);
      console.log(
        `    → ${videoOut}  ${mb(statSync(videoOut).size)}` +
          `  (was ${mb(sourceSize)})`,
      );
    } catch (err) {
      console.error(`    ! failed: ${(err as Error).message.slice(0, 160)}`);
    }
  }

  if (unresolved)
    console.log(
      `\n${unresolved} video(s) had no detectable end card. Watch the last few\n` +
        "seconds and re-run those with --trim <seconds> if they need it.",
    );
  console.log(
    apply
      ? `\nDone. Upload each pair in Studio: Product → Merchandising → Product video.\n`
      : `\nDry run — nothing written. Re-run with --apply to write into ${outDir}.\n`,
  );
}

main();
