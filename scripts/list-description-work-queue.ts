/**
 * Read-only. Prints the description-rewrite work queue: which published
 * products fall short of the SaunaPlunge reference standard, and every real
 * fact available to write each one from.
 *
 * Exists because four separate agents were each re-deriving scope with
 * slightly different heading counts and getting different answers. Heading
 * count here deliberately counts `h1` AND `h2` styles: 227 blocks across 42
 * product descriptions are styled `h1`, so an h2-only count reports a rich
 * description as bare.
 *
 * Tiers (heads = h1+h2+h3 blocks, words = all description text):
 *   NO_HEADINGS  0 headings
 *   BARE         <= 2 headings
 *   THIN         <= 3 headings, or fewer than 140 words
 *   OK           4+ headings and 140+ words
 *
 *   pnpm tsx --env-file=.env.local scripts/list-description-work-queue.ts
 *   pnpm tsx --env-file=.env.local scripts/list-description-work-queue.ts --supplier "Hill Interiors"
 *   pnpm tsx --env-file=.env.local scripts/list-description-work-queue.ts --supplier "D.I. Designs" --facts
 *   pnpm tsx --env-file=.env.local scripts/list-description-work-queue.ts --supplier Hill --facts --limit 20 --skip 40
 *
 * --facts dumps every source field per product (specs, dimensions, weight,
 * material, colour, current description, FAQs) as JSON, which is what you
 * actually write from. Without it you get a one-line-per-product summary.
 */
import { createClient } from "@sanity/client";

const args = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
}
const supplierFilter = arg("supplier");
const tierFilter = arg("tier");
const limit = Number(arg("limit") ?? 0);
const skip = Number(arg("skip") ?? 0);
const withFacts = args.includes("--facts");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

interface Block {
  style?: string;
  listItem?: string;
  children?: { text: string }[];
}
interface Doc {
  _id: string;
  title: string;
  slug: string;
  supplier: string;
  category: string | null;
  price: number | null;
  summary: string | null;
  material: string | null;
  colour: string | null;
  dimensions: Record<string, unknown> | null;
  weight: Record<string, unknown> | null;
  specs: { label: string; value: string }[] | null;
  faqs: { question: string; answer: string }[] | null;
  description: Block[] | null;
}

function blockText(blocks: Block[] | null): string {
  return (blocks || [])
    .flatMap((b) => (b.children || []).map((c) => c.text))
    .join(" ");
}

function headingCount(blocks: Block[] | null): number {
  return (blocks || []).filter(
    (b) => b.style === "h1" || b.style === "h2" || b.style === "h3",
  ).length;
}

function tierOf(blocks: Block[] | null): string {
  const heads = headingCount(blocks);
  const words = blockText(blocks).trim().split(/\s+/).filter(Boolean).length;
  if (heads === 0) return "NO_HEADINGS";
  if (heads <= 2) return "BARE";
  if (heads <= 3 || words < 140) return "THIN";
  return "OK";
}

async function main() {
  const docs: Doc[] = await client.fetch(
    `*[_type == "product" && !(_id in path("drafts.**"))]{
      _id, title, "slug": slug.current,
      "supplier": coalesce(supplier->name, supplier, "unknown"),
      "category": category->title,
      price, summary, material, colour, dimensions, weight,
      "specs": specs[]{label, value},
      "faqs": faqs[]{question, answer},
      description
    } | order(_id asc)`,
  );

  let queue = docs.filter((d) => {
    const tier = tierOf(d.description);
    if (tierFilter) return tier === tierFilter.toUpperCase();
    return tier !== "OK";
  });

  if (supplierFilter) {
    const needle = supplierFilter.toLowerCase();
    queue = queue.filter((d) =>
      (d.supplier || "").toLowerCase().includes(needle),
    );
  }

  const total = queue.length;
  if (skip) queue = queue.slice(skip);
  if (limit) queue = queue.slice(0, limit);

  if (withFacts) {
    console.log(
      JSON.stringify(
        queue.map((d) => ({
          id: d._id,
          title: d.title,
          slug: d.slug,
          supplier: d.supplier,
          category: d.category,
          price: d.price,
          tier: tierOf(d.description),
          currentSummary: d.summary,
          material: d.material,
          colour: d.colour,
          dimensions: d.dimensions,
          weight: d.weight,
          specs: d.specs,
          faqs: d.faqs,
          currentDescription: (d.description || []).map((b) => ({
            style: b.listItem ? `li:${b.style}` : b.style || "normal",
            text: (b.children || []).map((c) => c.text).join(""),
          })),
        })),
        null,
        2,
      ),
    );
    console.error(
      `\n[${queue.length} shown of ${total} matching${supplierFilter ? ` for supplier ~"${supplierFilter}"` : ""}]`,
    );
    return;
  }

  const byTier: Record<string, number> = {};
  const bySupplier: Record<string, number> = {};
  for (const d of queue) {
    const t = tierOf(d.description);
    byTier[t] = (byTier[t] || 0) + 1;
    bySupplier[d.supplier] = (bySupplier[d.supplier] || 0) + 1;
  }

  for (const d of queue) {
    const heads = headingCount(d.description);
    const words = blockText(d.description)
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    console.log(
      `${tierOf(d.description).padEnd(11)} h:${String(heads).padStart(2)} w:${String(words).padStart(4)} specs:${String(d.specs?.length ?? 0).padStart(2)} faqs:${String(d.faqs?.length ?? 0).padStart(2)} | ${d._id} | ${d.title}`,
    );
  }
  console.log(`\nTOTAL IN QUEUE: ${total}`);
  console.log("BY TIER:", byTier);
  console.log("BY SUPPLIER:", bySupplier);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
