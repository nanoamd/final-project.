/**
 * How much of a supplier's catalogue we have actually used, and where the unused
 * products sit against our empty categories.
 *
 * Written because "I'm struggling for suppliers" and "I have no products in fire pits"
 * are not always the same problem. Hill Interiors lists 1,662 items; Kaiku has taken a
 * couple of hundred. Before applying to anyone new it is worth knowing whether the
 * account we already hold covers the gap — a supplier we are already trading with needs
 * no application, no minimum order and no credit check.
 *
 * Matching is by slugified title against the supplier's sitemap, the same way
 * scripts/enrich-from-supplier.ts pairs them, so "used" means we hold that exact item.
 *
 * Read-only, and works from the cached sitemap — no requests to the supplier.
 *
 *   pnpm tsx --env-file=.env.local scripts/supplier-coverage.ts
 *   pnpm tsx --env-file=.env.local scripts/supplier-coverage.ts fire pit lantern
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

/** The empty or nearly empty categories worth filling, and the words that find them. */
const GAPS: Record<string, string[]> = {
  "fire-pits": [
    "fire pit",
    "firepit",
    "fire bowl",
    "brazier",
    "chiminea",
    "log burner",
  ],
  rugs: ["rug", "runner", "doormat", "floor mat"],
  "water-features": ["water feature", "fountain", "bird bath", "cascade"],
  "privacy-screens": ["screen", "trellis", "room divider", "partition"],
  "towel-rails": ["towel rail", "towel ladder", "towel stand", "towel rack"],
  "bathroom-accessories": [
    "soap dispenser",
    "toothbrush",
    "bath mat",
    "bathroom",
    "wash stand",
  ],
  "bathroom-lighting": ["bathroom light", "vanity light"],
  "outdoor-kitchens": [
    "outdoor kitchen",
    "bbq",
    "barbecue",
    "pizza oven",
    "grill",
  ],
  "kitchen-furniture": [
    "bar stool",
    "kitchen island",
    "butcher",
    "kitchen trolley",
  ],
  decor: [
    "wall clock",
    "mirror",
    "lantern",
    "candle",
    "vase",
    "wall art",
    "canvas",
  ],
};

async function main() {
  const xml = await readFile(
    path.join(process.cwd(), ".image-work/supplier-sitemap.xml"),
    "utf8",
  );
  const supplier = [
    ...new Set(
      [...xml.matchAll(/<loc>[^<]*\/item\/([^/<]+)\/?<\/loc>/g)].map(
        (m) => m[1]!,
      ),
    ),
  ];

  const ours = await client.fetch<string[]>(
    `*[_type == "product" && defined(title)].title`,
  );
  const held = new Set(
    ours.map((title) =>
      title
        .replace(/\s*\|\s*Kaiku.*$/i, "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    ),
  );

  const unused = supplier.filter((slug) => !held.has(slug));
  console.log(
    `\nHill Interiors lists ${supplier.length} items. We hold ${supplier.length - unused.length}.\n` +
      `${unused.length} are unused — an account we already have.\n`,
  );

  const terms = process.argv.slice(2);
  const readable = (slug: string) => slug.replace(/-/g, " ");

  if (terms.length) {
    const needle = terms.join(" ").toLowerCase();
    const hits = unused.filter((slug) => readable(slug).includes(needle));
    console.log(`"${needle}" — ${hits.length} unused item(s):\n`);
    for (const slug of hits.slice(0, 60)) console.log(`  ${readable(slug)}`);
    return;
  }

  console.log("Against the categories that are empty or nearly so:\n");
  for (const [category, words] of Object.entries(GAPS)) {
    const hits = unused.filter((slug) =>
      words.some((word) => readable(slug).includes(word)),
    );
    console.log(`  ${String(hits.length).padStart(4)}  ${category}`);
    for (const slug of hits.slice(0, 6))
      console.log(`          ${readable(slug)}`);
    if (hits.length > 6) console.log(`          … and ${hits.length - 6} more`);
    console.log();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
