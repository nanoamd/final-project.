/**
 * The last of the catalogue defects found in the 2 September audit.
 *
 *   1. Ten titles with a doubled separator — "Tabletop Water Feature - -
 *      Cascading Pots" — where a size was dropped out of the middle of the
 *      pattern its siblings use, and one with a double space after a trademark
 *      symbol. These show in the grid tile, on the product page and in the meta
 *      title, so they are visible in three places at once. The doubled dash is
 *      collapsed rather than having a size invented back into it: the dimension
 *      the siblings quote cannot be told from the data with certainty, and a
 *      wrong size in a title is worse than a missing one.
 *
 *   2. 31 products whose gallery images carry no alt text at all. Alt text is
 *      what a screen reader announces and what Google Images indexes; an empty
 *      alt on a shopping photo is both an accessibility failure and a wasted
 *      ranking signal.
 *
 *   3. Five summaries that are still supplier marketing — "a perfect addition
 *      for those seeking contemporary accent lighting", "Enhance your outdoor
 *      space with this Solar Post Lamp". These are the five the earlier
 *      de-marketing pass missed, found because their meta description could not
 *      be rebuilt from them without carrying the marketing across.
 *
 *   4. One product with two spec rows sharing the label "Material" (Aluminium
 *      and Polyester). Merged into one row rather than dropped, because both
 *      values are true.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-titles-alt-and-last-summaries.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-titles-alt-and-last-summaries.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");
const token = process.env.SANITY_API_WRITE_TOKEN;
if (apply && !token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — refusing to --apply.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

/** Summary and meta description, written by hand from each product's own data. */
const SUMMARIES: { id: string; summary: string; meta: string }[] = [
  {
    id: "premier-housewares-5511825",
    summary:
      "A table lamp in papier mache and iron with a curved monochrome stripe, 30cm in diameter and 50cm tall. Arrives assembled. Shade weight and base are balanced for a side table rather than a floor.",
    meta: "A papier mache and iron table lamp with curved monochrome stripes, 30cm across and 50cm tall. Arrives assembled.",
  },
  {
    id: "premier-housewares-5529564",
    summary:
      "A side table with a black marble top on an iron frame, 34 x 34cm and 47cm tall. Arrives in one carton at 10.42kg — the marble is the weight, so position it before you load it.",
    meta: "A side table with a black marble top on an iron frame, 34 x 34cm and 47cm tall. One carton, 10.42kg.",
  },
  {
    id: "product-aosom-b30-006",
    summary:
      "A solar bollard lantern in black ABS, 1.77m tall on a 26.5cm base, weighing 1.5kg. Switches itself on at dusk with a push-button override and a built-in timer, and runs about six hours on a full charge. Rechargeable battery included, no wiring needed. Waterproof and made for outdoor use. Assembly required.",
    meta: "A 1.77m solar bollard lantern in black ABS. Comes on at dusk, runs about six hours on a charge, battery included, no wiring.",
  },
  {
    id: "product-aw-waterf-17",
    summary:
      "A tabletop water feature with a silver Buddha cascade and a crystal ball, 35 x 25 x 20cm and 2.3kg. Handcrafted, so each one varies slightly. Includes a pump — keep it submerged and top the water up regularly.",
    meta: "A tabletop water feature with a silver Buddha cascade and crystal ball, 35 x 25 x 20cm and 2.3kg. Pump included.",
  },
  {
    id: "product-import-alto-shelf-unit-with-glass-shelves",
    summary:
      "An open shelf unit with glass shelves, 80cm wide, 27cm deep and 179cm tall, weighing 10kg. Tall and shallow, so it holds books and display pieces against a wall without taking floor. Fix it to the wall — at 179cm with a 27cm footprint it is a tipping risk otherwise.",
    meta: "An open shelf unit with glass shelves, 80 x 27cm and 179cm tall, weighing 10kg. Shallow enough to sit against a wall.",
  },
];

/** Merged spec rows, replacing two rows that shared one label. */
const SPEC_MERGES: {
  id: string;
  specs: { _key: string; _type: string; label: string; value: string }[];
} = {
  id: "premier-housewares-2404467",
  specs: [
    {
      _key: "spec-0",
      _type: "productSpec",
      label: "Dimensions",
      value: "w60 x d72 x h86",
    },
    {
      _key: "spec-1",
      _type: "productSpec",
      label: "Material",
      value: "Aluminium, Polyester",
    },
    {
      _key: "spec-3",
      _type: "productSpec",
      label: "Cart Weight (kg)",
      value: "11.8",
    },
  ],
};

/** "Name | Kaiku" with the brand and any bracketed suffix stripped, for alt text. */
function baseName(title: string): string {
  return (
    title
      .split("|")[0]
      ?.trim()
      .replace(/\s*[-–—]\s*[-–—]\s*/g, " — ")
      .replace(/\s{2,}/g, " ")
      .trim() ?? title
  );
}

async function main() {
  const results: Record<string, unknown>[] = [];
  const transaction = client.transaction();
  let queued = 0;

  // 1. Titles with a doubled separator or a doubled space.
  const products = await client.fetch<{ _id: string; title: string }[]>(
    `*[_type=="product" && !(_id in path("drafts.**"))]{_id,title}`,
  );
  let titleFixes = 0;
  for (const p of products) {
    const fixed = p.title
      // "Feature - - Cascading Pots" -> "Feature - Cascading Pots"
      .replace(/\s[-–—]\s+[-–—]\s/g, " - ")
      .replace(/\s{2,}/g, " ")
      .replace(/\s*\|\s*\|\s*/g, " | ")
      .replace(/\s*\|\s*$/, "")
      .trim();
    if (fixed === p.title) continue;
    results.push({ id: p._id, field: "title", was: p.title, now: fixed });
    titleFixes += 1;
    if (apply) {
      transaction.patch(p._id, (patcher) => patcher.set({ title: fixed }));
      queued += 1;
    }
  }

  // 2. Gallery alt text.
  const noAlt = await client.fetch<
    {
      _id: string;
      title: string;
      gallery?: { _key: string; alt?: string; optionValue?: string }[];
    }[]
  >(
    `*[_type=="product" && !(_id in path("drafts.**")) && count(gallery[!defined(alt) || alt==""])>0]{_id,title,gallery[]{_key,alt,optionValue}}`,
  );
  let altFixes = 0;
  let altImages = 0;
  for (const p of noAlt) {
    const gallery = p.gallery ?? [];
    // The corrected title, since the title fix above may have changed it.
    const raw =
      (results.find((r) => r.id === p._id && r.field === "title")?.now as
        string | undefined) ?? p.title;
    const name = baseName(raw);
    const patch: Record<string, string> = {};
    gallery.forEach((image, index) => {
      if (image.alt?.trim()) return;
      // The first photograph is the product; the rest are further views of it,
      // and a colour variant says which colour so the alt matches what is shown.
      const alt = image.optionValue?.trim()
        ? `${name} in ${image.optionValue.trim()}`
        : index === 0
          ? name
          : `${name}, view ${index + 1}`;
      patch[`gallery[_key=="${image._key}"].alt`] = alt;
      altImages += 1;
    });
    if (Object.keys(patch).length === 0) continue;
    results.push({
      id: p._id,
      field: "gallery alt",
      now: `${Object.keys(patch).length} of ${gallery.length}`,
      sample: Object.values(patch)[0],
    });
    altFixes += 1;
    if (apply) {
      transaction.patch(p._id, (patcher) => patcher.set(patch));
      queued += 1;
    }
  }

  // 3. The five remaining marketing summaries.
  let summaryFixes = 0;
  for (const item of SUMMARIES) {
    const doc = await client.fetch<{ summary?: string } | null>(
      `*[_id == $id][0]{summary}`,
      { id: item.id },
    );
    if (!doc) {
      console.error(`NOT FOUND: ${item.id}`);
      continue;
    }
    results.push({
      id: item.id,
      field: "summary + seo.metaDescription",
      was: doc.summary?.slice(0, 90),
      now: item.summary,
      metaLen: item.meta.length,
    });
    summaryFixes += 1;
    if (apply) {
      transaction.patch(item.id, (patcher) =>
        patcher.set({
          summary: item.summary,
          "seo.metaDescription": item.meta,
        }),
      );
      queued += 1;
    }
  }

  // 4. The merged spec rows.
  const specDoc = await client.fetch<{ specs?: unknown[] } | null>(
    `*[_id == $id][0]{specs}`,
    { id: SPEC_MERGES.id },
  );
  if (specDoc) {
    results.push({
      id: SPEC_MERGES.id,
      field: "specs",
      was: `${specDoc.specs?.length ?? 0} rows`,
      now: `${SPEC_MERGES.specs.length} rows, Material merged`,
    });
    if (apply) {
      transaction.patch(SPEC_MERGES.id, (patcher) =>
        patcher.set({ specs: SPEC_MERGES.specs }),
      );
      queued += 1;
    }
  }

  console.log(`Titles repaired:            ${titleFixes}`);
  console.log(`Products given alt text:    ${altFixes} (${altImages} images)`);
  console.log(`Summaries rewritten:        ${summaryFixes}`);
  console.log(`Spec lists merged:          ${specDoc ? 1 : 0}`);
  const badMeta = SUMMARIES.filter(
    (s) => s.meta.length > 160 || s.meta.length < 70,
  );
  console.log(`Meta descriptions out of range: ${badMeta.length}`);

  console.log("\nSample:");
  for (const r of results.slice(0, 3)) console.log(`  ${JSON.stringify(r)}`);
  for (const r of results.filter((r) => r.field === "gallery alt").slice(0, 3))
    console.log(`  ${JSON.stringify(r)}`);

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} documents patched.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-fix-titles-alt-and-last-summaries.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
