/**
 * Corrects the colour tags of products whose colour options promise more than
 * the photographs actually show.
 *
 * Damien's rule, verbatim: *"Don't change my colours unless there's colour
 * options but only 1 colour in the images, and if there is only 1 image but
 * there's colours it'll be colours for each colour that 1 colour has. (White and
 * gold for a white table with gold legs)"*
 *
 * Three things follow, and this script does only these three:
 *
 *   1. **A product is only touched when it has colour options and the gallery
 *      photographs at most one of them.** Everything else keeps the colours it
 *      has. That is the "don't change my colours" half of the instruction, and it
 *      is the common case: most products either offer no colour choice at all or
 *      photograph every variant they offer, and both are already right.
 *   2. **For the products it does touch, the photographs are the authority, not
 *      the option list.** A chest offered in White, Black and Brown but only ever
 *      photographed in white is a white chest as far as a shopper filtering by
 *      colour is concerned. Answering a Black filter with a white photograph is
 *      the same broken promise as a filter that finds nothing.
 *   3. **Every colour in the picture counts, not just the main one.** A white
 *      table with gold legs is White *and* Gold. The text-based derivation could
 *      never see that — "Abberley White End Table" says white and stops, and
 *      "Grafton Black Console Table | Industrial Oak Console Table" tagged Oak
 *      onto a console that is black steel in all four photographs.
 *
 * How the pixels are read is in scripts/lib/image-colours.ts. Two choices here
 * are worth stating, because both were arrived at the hard way:
 *
 * **It reads real photographs, not the stored LQIP.** The 20px thumbnail Sanity
 * keeps on every asset is free to read and good enough to tell a catalogue shot
 * from a lifestyle shot, which is what scripts/derive-studio-shots.ts uses it
 * for. It is not good enough for colour: on the thumbnail a black open-frame
 * console reads 76% White, because a thin bar smeared across three pixels is
 * mostly paper. This fetches each image at 96px from the CDN — a few hundred
 * kilobytes for the whole run, cached on disk between runs.
 *
 * **It reads the catalogue shots and skips the lifestyle ones.** A room set
 * contains a sofa, a wall and a plant, none of which are the product; measured
 * on one, 36% of the frame matched nothing in the palette. The `isStudioShot`
 * flags derived earlier are what make this possible.
 *
 * Dry run by default, and it prints the share behind every colour so the
 * decisions can be read before any of them are written:
 *   pnpm tsx --env-file=.env.local scripts/derive-image-colours.ts
 *   pnpm tsx --env-file=.env.local scripts/derive-image-colours.ts --all
 *   pnpm tsx --env-file=.env.local scripts/derive-image-colours.ts --apply
 *
 * Published documents only.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@sanity/client";
import sharp from "sharp";

import {
  colourSwatch,
  colourTagForOptionValue,
} from "../src/lib/catalog/facets";
import {
  type ColourShare,
  coloursInImage,
  hexToOklab,
  type ImageReading,
  labDistance,
  mergeColourShares,
  MIN_COLOUR_SHARE,
  MIN_SUBJECT_SHARE,
  type Swatch,
} from "./lib/image-colours";

const apply = process.argv.includes("--apply");
const showAll = process.argv.includes("--all");

const token = process.env.SANITY_API_WRITE_TOKEN;
if (apply && !token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — refusing to --apply.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  useCdn: false,
  token,
});

interface RawGalleryImage {
  url: string | null;
  optionValue: string | null;
  isStudioShot: boolean | null;
}

interface RawProduct {
  id: string;
  title: string | null;
  slug: string | null;
  primaryColour: string | null;
  colourTags: string[] | null;
  options: { label: string | null; values: string[] | null }[] | null;
  gallery: RawGalleryImage[] | null;
}

/** Long enough that a leg two pixels wide survives, small enough that 439 of
 *  them is a trivial download. */
const SAMPLE_WIDTH = 96;

const cacheDir = path.join(
  process.env.TMPDIR || "/tmp",
  "kaiku-image-colours-cache",
);

/**
 * Fetch an image at sample size and decode it to raw RGB.
 *
 * Cached on disk by URL, so re-running the report — which is the point of a dry
 * run — does not re-download the catalogue each time.
 */
async function sample(url: string) {
  const key = createHash("sha1").update(url).digest("hex");
  const file = path.join(cacheDir, `${key}.png`);
  let png: Buffer;
  try {
    png = await readFile(file);
  } catch {
    const response = await fetch(
      `${url}?w=${SAMPLE_WIDTH}&fit=max&fm=png&q=90`,
    );
    if (!response.ok) return null;
    png = Buffer.from(await response.arrayBuffer());
    await mkdir(cacheDir, { recursive: true });
    await writeFile(file, png);
  }
  try {
    const { data, info } = await sharp(png)
      .resize(SAMPLE_WIDTH, SAMPLE_WIDTH, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#ffffff" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  } catch {
    return null;
  }
}

/**
 * The colour tags a product's option list offers.
 *
 * Only labels naming a colour choice are read: "Size" and "Power" are option
 * labels too, and a size of "Natural" does not exist where a finish of "Natural"
 * does.
 */
const COLOUR_LABEL = /colour|color|finish|shade/i;

function optionColours(product: RawProduct): string[] {
  const tags = new Set<string>();
  for (const option of product.options ?? []) {
    if (!COLOUR_LABEL.test(option.label ?? "")) continue;
    for (const value of option.values ?? []) {
      const tag = colourTagForOptionValue(value);
      if (tag) tags.add(tag);
    }
  }
  return [...tags];
}

/**
 * The distinct variants the gallery photographs, as far as the *data* says.
 *
 * This reads `optionValue`, not pixels, and the distinction it draws is the one
 * that matters in this catalogue: **a multi-value Colour option can mean two
 * completely different things.** On the Abberley chest it is a real choice — White,
 * Black and Brown, each with its own photograph. On the Neatham table it is
 * descriptive: Black, Brass, Gold are the colours of a single piece, not three
 * pieces. Pixels cannot tell those apart, because a white table with gold legs and
 * a table sold in white *or* gold look identical in a photograph of one of them.
 * Which photographs carry an `optionValue` can.
 *
 * 21 products photograph more than one value; 10 photograph one or none, and every
 * one of those ten reads as a description of one object (`[Grey | Oak]` on a
 * grey-aged oak console, `[Brown | Neutral | Taupe]` on a gesso lamp).
 */
function photographedVariants(product: RawProduct): string[] {
  const tags = new Set<string>();
  for (const image of product.gallery ?? []) {
    if (!image.optionValue) continue;
    const tag = colourTagForOptionValue(image.optionValue);
    if (tag) tags.add(tag);
  }
  return [...tags];
}

/**
 * The palette this product's photographs are matched against: the colours it
 * already carries, then the colours it is offered in. Nothing else.
 *
 * **It deliberately does not go looking for colours nobody listed**, and that is
 * a limit worth stating rather than hiding. The first version added Gold, Brass,
 * Bronze and Black to every palette so an unlisted accent could be discovered.
 * It wrecked the results: Bronze is a mid warm brown, so it absorbed shaded
 * timber and shadow everywhere it was offered — 70% of the brass-legged Neatham
 * table, and enough of the aqua resin coffee table to drop Aqua off it entirely.
 * The vocabulary's own spacing says why this cannot work: Oak sits 0.040 from
 * Gold and 0.048 from Brass, closer than Gold sits to Brass. Pale timber and warm
 * metal are one colour band at photographic scale.
 *
 * So the photographs are used for what they can actually settle — *is each colour
 * this product claims really in the picture, and which of the offered ones is* —
 * and the gold legs are found whenever Gold is offered or already tagged, which
 * is the case wherever the catalogue has noticed them.
 *
 * Order matters: near-identical swatches collapse to the first of them, so where
 * the pixels genuinely cannot separate two candidates, the colour Damien already
 * has wins.
 */
function paletteFor(product: RawProduct, offered: string[]): Swatch[] {
  const tags = [...(product.colourTags ?? []), ...offered].filter(
    (tag, index, all) => all.indexOf(tag) === index,
  );

  return tags.flatMap((tag) => {
    const hex = colourSwatch(tag);
    return hex ? [{ tag, hex }] : [];
  });
}

/** Beyond three, the tag list stops describing the piece and starts describing
 *  the lighting. */
const MAX_COLOURS = 3;

/**
 * A tag is never dropped in favour of a colour this close to it.
 *
 * The Neatham table's option list reads Black, Brass, Gold, and — Damien's
 * correction — **that is not three variants a customer chooses between. It is the
 * colours of the one piece**: a black top on brass-gold legs. So all three belong
 * on it, and the reading (Brass 22%, Gold 7%) would have dropped Gold and kept
 * Brass on 15 points of a measurement whose own resolution is coarser than the gap
 * between the two. Gold and Brass are 0.073 apart and nothing else in the
 * vocabulary is inside 0.11, so this threshold protects that pair and nothing it
 * shouldn't.
 */
const AMBIGUOUS_DROP = 0.08;

/** Above this share of unmatched subject, the palette is missing the colour the
 *  product actually is, and anything it did match is the least-wrong answer
 *  rather than the right one. */
const MAX_UNMATCHED = 0.5;

function shorten(text: string | null, length = 54): string {
  if (!text) return "(untitled)";
  return text.length <= length ? text : `${text.slice(0, length - 1)}…`;
}

function shares(colours: ColourShare[]): string {
  return (
    colours.map((c) => `${c.tag} ${Math.round(c.share * 100)}%`).join(", ") ||
    "nothing"
  );
}

function sameSet(a: string[], b: string[]): boolean {
  return (
    a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|")
  );
}

async function main() {
  const products = await client.fetch<RawProduct[]>(
    `*[_type == "product" && !(_id in path("drafts.**")) && count(gallery) > 0]{
      "id": _id, title, "slug": slug.current,
      primaryColour, colourTags,
      "options": options[]{ label, values },
      "gallery": gallery[]{
        "url": asset->url,
        optionValue,
        isStudioShot
      }
    }|order(title asc)`,
  );

  console.log(
    `\n${products.length} published products with a gallery. ${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  const patches: {
    id: string;
    title: string;
    was: string[];
    now: string[];
    primary: string;
  }[] = [];
  const outsideOptions: string[] = [];
  let noOptions = 0;
  let perVariant = 0;
  let unreadable = 0;
  let agreed = 0;

  for (const product of products) {
    const offered = optionColours(product);
    const shot = photographedVariants(product);
    const current = product.colourTags ?? [];

    // A tag naming a colour the product is not offered in, on a product this
    // script will not touch. Reported rather than acted on: his rule says leave
    // these alone, and it is his catalogue.
    if (offered.length && current.some((tag) => !offered.includes(tag)))
      outsideOptions.push(
        `${shorten(product.title, 46)} — tagged ${current.join(", ")}; offered ${offered.join(", ")}`,
      );

    // Rule 1: no colour choice, so the option list cannot be over-promising.
    if (offered.length < 2) {
      noOptions += 1;
      if (showAll)
        console.log(
          `  ·  ${shorten(product.title)}\n      no colour options — left alone (${current.join(", ") || "no tags"})`,
        );
      continue;
    }

    // Rule 1 again: every variant has its own photograph, so the option list is
    // not a promise the pictures fail to keep.
    if (shot.length > 1) {
      perVariant += 1;
      if (showAll)
        console.log(
          `  ·  ${shorten(product.title)}\n      ${shot.length} variants photographed (${shot.join(", ")}) — left alone`,
        );
      continue;
    }

    const gallery = product.gallery ?? [];
    // Catalogue shots only, unless none are flagged — a room set is mostly not
    // the product.
    const catalogue = gallery.filter((image) => image.isStudioShot === true);
    const toRead = (catalogue.length ? catalogue : gallery).filter(
      (image) => image.url,
    );

    const palette = paletteFor(product, offered);
    const readings: ImageReading[] = [];
    for (const image of toRead) {
      const decoded = await sample(image.url!);
      if (!decoded) continue;
      const reading = coloursInImage(decoded, palette);
      if (reading.subjectShare < MIN_SUBJECT_SHARE) continue;
      readings.push(reading);
    }

    if (!readings.length) {
      unreadable += 1;
      console.log(
        `  !  ${shorten(product.title)}\n      no photograph the segmentation could read — left alone`,
      );
      continue;
    }

    const unmatched =
      readings.reduce((sum, r) => sum + r.unmatchedShare * r.subjectShare, 0) /
      readings.reduce((sum, r) => sum + r.subjectShare, 0);
    if (unmatched > MAX_UNMATCHED) {
      unreadable += 1;
      console.log(
        `  ?  ${shorten(product.title)}\n      ${Math.round(unmatched * 100)}% of the product matches none of ${palette
          .map((s) => s.tag)
          .join("/")} — left alone`,
      );
      continue;
    }

    const merged = mergeColourShares(readings);
    const kept = merged
      .filter((c) => c.share >= MIN_COLOUR_SHARE)
      .slice(0, MAX_COLOURS);

    if (!kept.length) {
      unreadable += 1;
      console.log(
        `  ?  ${shorten(product.title)}\n      nothing holds ${Math.round(MIN_COLOUR_SHARE * 100)}% of the product (${shares(merged.slice(0, 4))}) — left alone`,
      );
      continue;
    }

    // A tag the photographs did not confirm, but which is indistinguishable from
    // one they did, stays. See AMBIGUOUS_DROP.
    const confirmed = kept.map((c) => c.tag);
    const protectedTags = current.filter(
      (tag) =>
        !confirmed.includes(tag) &&
        confirmed.some((other) => {
          const a = colourSwatch(tag);
          const b = colourSwatch(other);
          return (
            a &&
            b &&
            labDistance(hexToOklab(a), hexToOklab(b)) <= AMBIGUOUS_DROP
          );
        }),
    );
    const now = [...confirmed, ...protectedTags];

    if (sameSet(now, current)) {
      agreed += 1;
      if (showAll)
        console.log(
          `  =  ${shorten(product.title)}\n      photographs agree with the tags (${shares(kept)})`,
        );
      continue;
    }

    console.log(`  →  ${shorten(product.title)}`);
    console.log(
      `      read from  ${readings.length} of ${gallery.length} image${gallery.length === 1 ? "" : "s"}${
        catalogue.length ? "" : " (none flagged as catalogue shots)"
      }`,
    );
    console.log(`      offered    ${offered.join(", ")}`);
    console.log(`      tagged     ${current.join(", ") || "nothing"}`);
    console.log(`      in photos  ${shares(kept)}`);
    const dropped = merged.filter((c) => !now.includes(c.tag)).slice(0, 3);
    if (dropped.length) console.log(`      below cut  ${shares(dropped)}`);
    const lost = current.filter((tag) => !now.includes(tag));
    if (lost.length) console.log(`      dropping   ${lost.join(", ")}`);
    const added = now.filter((tag) => !current.includes(tag));
    if (added.length) console.log(`      adding     ${added.join(", ")}`);
    if (protectedTags.length)
      console.log(
        `      keeping    ${protectedTags.join(", ")} — too close to call against ${confirmed.join("/")}`,
      );

    patches.push({
      id: product.id,
      title: product.title ?? product.slug ?? product.id,
      was: current,
      now,
      primary: now[0]!,
    });
  }

  console.log(
    `\n${patches.length} products to change.\n` +
      `  ${noOptions} with no colour options — left alone\n` +
      `  ${perVariant} with a photograph per variant — left alone\n` +
      `  ${agreed} where the photographs already agree with the tags\n` +
      `  ${unreadable} the photographs could not answer — left alone`,
  );

  if (outsideOptions.length) {
    console.log(
      `\n${outsideOptions.length} products carry a colour tag they are not offered in.\n` +
        `These are outside the rule, so nothing here is changed — listed because\n` +
        `each one is a filter that shows a shopper the wrong photograph:`,
    );
    for (const line of outsideOptions.slice(0, 25)) console.log(`  ${line}`);
    if (outsideOptions.length > 25)
      console.log(`  … and ${outsideOptions.length - 25} more`);
  }

  if (!apply) {
    console.log("\nDry run — nothing written. Re-run with --apply.\n");
    return;
  }

  for (const patch of patches)
    await client
      .patch(patch.id)
      .set({ colourTags: patch.now, primaryColour: patch.primary })
      .commit({ visibility: "async" });

  console.log(
    `\nRetagged ${patches.length} products from their photographs.\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
