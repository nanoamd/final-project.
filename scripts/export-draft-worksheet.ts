/**
 * Exports every unpublished draft to a CSV holding every fact we have about it, so
 * ninety descriptions can be written without going back to Studio and the supplier's
 * site for each one.
 *
 * **Damien is writing the descriptions himself.** That changes what this sheet is for.
 * It was first built to ask him for the facts a description needs; since then
 * scripts/enrich-from-supplier.ts has filled material, colour, weight and barcode on
 * 91 drafts from the supplier's own specification tables, so asking for them again
 * would waste the one thing the sheet is meant to save. It now hands over what we hold
 * and asks only for what is genuinely still missing.
 *
 * **What the drafts held when this was first written:** 96 had images, 91 had
 * dimensions, 91 named a supplier. And then: **0 had material, colour, style or room
 * tags, 5 had any specs, 4 had a SKU.** Nothing carried a finish, a construction, an
 * assembly note or an origin.
 *
 * His handwritten format asks for exactly those things. A single Reclaimed Teak
 * Sideboard entry states "Material: Reclaimed Solid Teak Wood", "Origin: Handcrafted
 * in Bali, Indonesia", "Assembly: Delivered fully assembled" and "Sustainably made
 * using recycled fishing boat timber". None of that is derivable from a title, a
 * bounding box and a photograph, and a photograph cannot separate solid walnut from
 * walnut veneer, or tell you whether a string of lights is rated for outdoor use.
 *
 * That last one is not pedantry. The hero image for "100 LED Battery Micro Lights
 * Silver Wire 10m" is a coil of wire beside a 3×AA battery box. From it I can say 100
 * LEDs, silver wire, 10m, battery powered. I cannot say warm or cool white, and I
 * cannot say whether it is safe outdoors — which are the two things a buyer of
 * garden lights most needs to know, and the two most likely to cause a return or a
 * complaint if guessed.
 *
 * So: this sheet asks for the few facts that unlock all the rest, grouped by
 * collection so that a family shares one answer.
 *
 * How much that actually saves, measured rather than hoped: the 98 drafts fall into
 * **72 groups**, so only about a quarter of them share a family. Grouping turns ~98
 * answers into ~72, not into twenty — I guessed better than that before running it and
 * the number says otherwise. The Contour, Delphine, Amalfi, Axis, Incia and Lennox
 * ranges are the ones where a single answer covers three or four products; most of the
 * rest are one-offs.
 *
 *   pnpm tsx --env-file=.env.local scripts/export-draft-worksheet.ts
 *
 * Writes .image-work/draft-worksheet.csv (gitignored). Read-only.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

interface Row {
  id: string;
  title: string | null;
  slug: string | null;
  category: string | null;
  supplier: string | null;
  price: number | null;
  images: number;
  hasDescription: boolean;
  words: number;
  dimensions: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
    unit?: string | null;
  } | null;
  weight: { value?: number | null; unit?: string | null } | null;
  materialTags: string[] | null;
  colourTags: string[] | null;
  primaryColour: string | null;
  gtin: string | null;
  sourceUrl: string | null;
}

const QUERY = /* groq */ `
*[_type == "product" && _id in path("drafts.**")
  && !defined(*[_id == string::split(^._id, "drafts.")[1]][0])]{
  "id": _id, title,
  "slug": slug.current,
  "category": category->slug.current,
  "supplier": supplier->name,
  price,
  "images": count(gallery),
  "hasDescription": count(description) > 0,
  // Length is the useful signal, not presence: a stub of two lines and a finished
  // 900-word page both count as "has description".
  "words": round(length(pt::text(description)) / 5.5),
  dimensions, weight, materialTags, colourTags, primaryColour, gtin, sourceUrl
} | order(title asc)`;

/**
 * The collection a product belongs to, from the first word or two of its title.
 *
 * Grouping is the whole point of the sheet: "Capri Collection Outdoor Foot Stool"
 * and "Capri Collection Outdoor Dining Chair" share a frame, a weave and a cushion
 * fabric, so they share one answer. Falls back to the first word, which is right for
 * the Abberley, Alton, Charlton and Hampton ranges too.
 */
function collection(title: string | null): string {
  if (!title) return "(untitled)";
  const clean = title.replace(/\s*\|\s*Kaiku.*$/i, "").trim();
  const collectionMatch = /^([A-Z][a-zA-Z]+)\s+Collection\b/.exec(clean);
  if (collectionMatch) return `${collectionMatch[1]} Collection`;
  const first = clean.split(/\s+/)[0] ?? clean;
  // A leading number is a size or a count, not a family name.
  return /^[\d.]/.test(first) ? clean.slice(0, 28) : first;
}

function dimensionText(row: Row): string {
  const d = row.dimensions;
  if (!d) return "";
  const unit = d.unit ?? "cm";
  const parts = [
    d.length ? `L${d.length}` : null,
    d.width ? `W${d.width}` : null,
    d.height ? `H${d.height}` : null,
  ].filter(Boolean);
  return parts.length ? `${parts.join(" x ")}${unit}` : "";
}

function weightText(row: Row): string {
  const value = row.weight?.value;
  return value ? `${value}${row.weight?.unit ?? "kg"}` : "";
}

/** RFC 4180: quote everything, double any inner quote. Titles contain commas. */
const cell = (value: string | number | null | undefined) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

async function main() {
  const rows = await client.fetch<Row[]>(QUERY);

  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = collection(row.title);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  // Everything before "Price" is a fact we hold, for writing from. Everything after
  // it is still missing, and only the supplier or Damien can supply it.
  const header = [
    "Collection",
    "Product",
    "Category",
    "Supplier",
    "Dimensions",
    "Weight",
    "Material",
    "Colour",
    "Barcode",
    "Supplier page",
    "Images",
    "Description words",
    "Price (YOURS)",
    "Assembly (still needed)",
    "Indoor / outdoor (still needed for lights + garden)",
    "Anything else worth saying",
  ];

  const lines = [header.map(cell).join(",")];

  // Largest families first: the top of the sheet is where the most products get
  // unblocked per answer.
  const ordered = [...groups.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]),
  );

  for (const [name, list] of ordered) {
    for (const row of list) {
      lines.push(
        [
          name,
          (row.title ?? "").replace(/\s*\|\s*Kaiku.*$/i, ""),
          row.category ?? "NO CATEGORY",
          row.supplier ?? "",
          dimensionText(row),
          weightText(row),
          (row.materialTags ?? []).join(", "),
          // primaryColour is what the filter bar swatches; the tags are what it filters.
          [row.primaryColour, ...(row.colourTags ?? [])]
            .filter(Boolean)
            .filter((value, index, all) => all.indexOf(value) === index)
            .join(", "),
          row.gtin ?? "",
          row.sourceUrl ?? "",
          row.images,
          row.hasDescription ? row.words : "",
          row.price ?? "",
          "",
          "",
          "",
        ]
          .map(cell)
          .join(","),
      );
    }
  }

  const dir = path.join(process.cwd(), ".image-work");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "draft-worksheet.csv");
  await writeFile(file, `${lines.join("\n")}\n`, "utf8");

  const needing = rows.filter((row) => !row.hasDescription).length;
  const held = (pick: (row: Row) => unknown) =>
    rows.filter((row) => {
      const value = pick(row);
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    }).length;

  console.log(
    `\n${rows.length} unpublished drafts in ${groups.size} collections.\n` +
      `${needing} need a description; ${rows.filter((r) => r.price === null).length} need a price.\n\n` +
      `Facts the sheet hands you, out of ${rows.length}:\n` +
      `  ${held((r) => r.dimensions?.height)} dimensions   ` +
      `${held((r) => r.weight?.value)} weight   ` +
      `${held((r) => r.materialTags)} material   ` +
      `${held((r) => r.colourTags)} colour   ` +
      `${held((r) => r.gtin)} barcode   ` +
      `${held((r) => r.sourceUrl)} supplier page\n\n` +
      `Largest collections — one answer here covers every product in the group:\n`,
  );
  for (const [name, list] of ordered.slice(0, 15))
    console.log(`  ${String(list.length).padStart(3)}  ${name}`);

  console.log(`\nWritten to ${file}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
