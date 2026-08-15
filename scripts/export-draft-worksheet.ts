/**
 * Exports every unpublished draft to a CSV with the facts we hold and the facts a
 * description needs, so the gap can be closed in one pass instead of ninety.
 *
 * Damien asked whether all the drafts could be given unique, SEO-maximised
 * descriptions in the format he has been writing by hand, leaving prices as his only
 * remaining job. The honest answer needed an audit first, and the audit is why this
 * file exists.
 *
 * **What the 98 drafts actually hold:** 96 have images, 91 have dimensions, 91 name a
 * supplier. And then: **0 have material, colour, style or room tags, 5 have any
 * specs, 4 have a SKU.** Nothing carries a finish, a construction, an assembly note
 * or an origin.
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
  dimensions: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
    unit?: string | null;
  } | null;
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
  dimensions
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

  const header = [
    "Collection",
    "Product",
    "Category",
    "Supplier",
    "Dimensions (held)",
    "Images",
    "Has description",
    "Price (YOURS)",
    "Material / finish (NEEDED)",
    "Assembly (NEEDED)",
    "Indoor / outdoor (NEEDED for lights + garden)",
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
          row.images,
          row.hasDescription ? "yes" : "",
          row.price ?? "",
          "",
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
  console.log(
    `\n${rows.length} unpublished drafts in ${groups.size} collections.\n` +
      `${needing} need a description; ${rows.filter((r) => r.price === null).length} need a price.\n\n` +
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
