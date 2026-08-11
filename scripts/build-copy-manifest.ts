/**
 * Builds the worklist for the copy rewrite.
 *
 * Pairs every published product with the saved supplier page that documents it, so
 * whoever writes the copy has the specs to verify against rather than guessing at
 * which file matches which product. Matched on the same title fingerprint the
 * importer used, so the pairing is the one that created the product in the first
 * place.
 *
 * Also carries forward what is already stored — dimensions, weight, lead time,
 * specs — because those are not to be reinvented. Lead times in particular are
 * correct as they stand and must be copied, not changed.
 *
 * Writes product-copy/manifest.json.
 *   pnpm tsx --env-file=.env.local scripts/build-copy-manifest.ts
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@sanity/client";

import {
  cleanSupplierTitle,
  titleFingerprint,
} from "./import-supplier-products";

const SUPPLIER_DIR = "supplier-pages/di-designs";
const OUT = "product-copy/manifest.json";

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

/**
 * Words that carry identity, for matching one title against another.
 *
 * Exact fingerprint matching pairs almost nothing here: our titles are written for
 * customers and carry a descriptor and the "| Kaiku" suffix — "Abberley White Chest
 * of Drawers | Luxury 3 Drawer Chest | Kaiku" against the supplier's "Abberley 3
 * Drawer White Chest of Drawers". The words that matter are the same; the order and
 * the padding are not.
 */
function significantWords(title: string): Set<string> {
  const STOP = new Set([
    "the",
    "a",
    "an",
    "and",
    "with",
    "in",
    "of",
    "for",
    "kaiku",
    "luxury",
    "designer",
    "premium",
    "modern",
    "classic",
    "cm",
  ]);
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOP.has(w)),
  );
}

/** Overlap of the smaller set into the larger — tolerant of one title being
 *  longer, which ours almost always is. */
function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared++;
  return shared / Math.min(a.size, b.size);
}

/**
 * What kind of thing a title says it is.
 *
 * Word overlap alone paired "Bentley Coffee Table in Oak" with the saved page for
 * the Bentley Oak *Console* Table — same collection, same timber, almost every word
 * shared, different piece of furniture. Taking dimensions from that page would put
 * a console table's proportions on a coffee table. So a match is rejected outright
 * when the two titles disagree about what the item is, however well the rest scores.
 */
function furnitureType(title: string): string | null {
  const lower = title.toLowerCase();
  // Ordered: the more specific compound wins over the bare noun inside it.
  const TYPES = [
    "coffee table",
    "console table",
    "bedside table",
    "dining table",
    "side table",
    "end table",
    "occasional table",
    "nest",
    "tv unit",
    "chest of drawers",
    "sideboard",
    "mirror",
    "lamp",
    "sofa",
    "armchair",
    "club chair",
    "desk",
    "stool",
    "shelf",
    "bench",
  ];
  return TYPES.find((type) => lower.includes(type)) ?? null;
}

interface ManifestEntry {
  productId: string;
  title: string;
  category: string | null;
  price: number | null;
  supplier: string | null;
  /** Saved supplier page, relative to the repo root. null when none matched. */
  supplierPage: string | null;
  /** The real product page this was listed from. Where it is missing, it has to be
   *  found and recorded — a product with no source has nothing to verify against. */
  sourceUrl: string | null;
  /** Never change these — carry them through. */
  deliveryLeadTime: string | null;
  dimensions: Record<string, unknown> | null;
  weight: Record<string, unknown> | null;
  specs: { label: string; value: string }[];
  /** How much work the page needs. */
  descriptionBlocks: number;
  faqCount: number;
  highlightCount: number;
}

/**
 * The saved page that documents this product, or null.
 *
 * An exact fingerprint wins outright. Otherwise the best word overlap, and only
 * when it is decisively better than the runner-up — "Abberley White Bedside Table"
 * and "Abberley Brown Bedside Table" are different products sharing most of their
 * words, and pairing the wrong one would put the wrong dimensions on a page. An
 * ambiguous match is reported as none, which sends the author to the stored specs
 * rather than to a page for a different item.
 */
function bestPage(
  title: string,
  pages: {
    file: string;
    fingerprint: string;
    words: Set<string>;
    type: string | null;
  }[],
): string | null {
  const exact = pages.find((p) => p.fingerprint === titleFingerprint(title));
  if (exact) return exact.file;

  const ourType = furnitureType(title);
  const words = significantWords(title);
  const scored = pages
    .filter((p) => !ourType || !p.type || p.type === ourType)
    .map((p) => ({ file: p.file, score: overlap(words, p.words) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const runnerUp = scored[1];
  if (!best || best.score < 0.7) return null;
  if (runnerUp && best.score - runnerUp.score < 0.08) return null;
  return best.file;
}

async function main() {
  const products = await client.fetch<
    {
      _id: string;
      title: string;
      category: string | null;
      price: number | null;
      supplier: string | null;
      sourceUrl: string | null;
      deliveryLeadTime: string | null;
      dimensions: Record<string, unknown> | null;
      weight: Record<string, unknown> | null;
      specs: { label: string; value: string }[] | null;
      descriptionBlocks: number | null;
      faqCount: number | null;
      highlightCount: number | null;
    }[]
  >(`*[_type == "product" && !(_id in path("drafts.**"))]{
      _id, title, price,
      "category": category->title,
      "supplier": supplier->name,
      sourceUrl,
      deliveryLeadTime, dimensions, weight, specs,
      "descriptionBlocks": count(description),
      "faqCount": count(faqs),
      "highlightCount": count(highlights)
    }|order(title asc)`);

  const pages: {
    file: string;
    fingerprint: string;
    words: Set<string>;
    type: string | null;
  }[] = [];
  for (const entry of readdirSync(SUPPLIER_DIR)) {
    if (!/\.html?$/i.test(entry)) continue;
    const html = readFileSync(join(SUPPLIER_DIR, entry), "utf8");
    const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
    if (!match) continue;
    const clean = cleanSupplierTitle(match[1]!.trim());
    pages.push({
      file: join(SUPPLIER_DIR, entry),
      fingerprint: titleFingerprint(clean),
      words: significantWords(clean),
      type: furnitureType(clean),
    });
  }

  const manifest: ManifestEntry[] = products.map((p) => ({
    productId: p._id,
    title: p.title,
    category: p.category,
    price: p.price,
    supplier: p.supplier,
    supplierPage: bestPage(p.title, pages),
    sourceUrl: p.sourceUrl,
    deliveryLeadTime: p.deliveryLeadTime,
    dimensions: p.dimensions,
    weight: p.weight,
    specs: p.specs ?? [],
    descriptionBlocks: p.descriptionBlocks ?? 0,
    faqCount: p.faqCount ?? 0,
    highlightCount: p.highlightCount ?? 0,
  }));

  mkdirSync("product-copy", { recursive: true });
  writeFileSync(OUT, JSON.stringify(manifest, null, 2), "utf8");

  const sourced = manifest.filter((m) => m.sourceUrl).length;
  const matched = manifest.filter((m) => m.supplierPage).length;
  console.log(
    `\n${manifest.length} published product(s) written to ${OUT}\n` +
      `  ${matched} paired with a saved supplier page\n` +
      `  ${manifest.length - matched} with none\n` +
      `  ${sourced} have a sourceUrl recorded, ${manifest.length - sourced} do not —\n` +
      `  those need the real product page found and recorded\n`,
  );

  const byCategory = new Map<string, number>();
  for (const m of manifest)
    byCategory.set(
      m.category ?? "(none)",
      (byCategory.get(m.category ?? "(none)") ?? 0) + 1,
    );
  console.log("By category:");
  for (const [category, count] of [...byCategory].sort((a, b) => b[1] - a[1]))
    console.log(`  ${String(count).padStart(3)}  ${category}`);
  console.log("");
}

main().catch((err) => {
  console.error("build-copy-manifest failed:", err);
  process.exit(1);
});
