/**
 * A previously-unquantified bug found while chasing the "quotes the supplier"
 * artefact: 41 published Hill Interiors / D.I. Designs products have the
 * supplier's actual name leaked into customer-facing copy — not the "the
 * supplier says..." hedge (that's SUPPLIER_LEAK_PATTERN in quality.ts,
 * accuracy dimension, -3 each), a separate, larger bug from the artefact
 * count already fixed.
 *
 * The pattern is mechanical almost everywhere: " Hill Interiors" (or
 * "D.I. Designs") got appended as a stray trailing token to the end of
 * individual sentences/lines throughout the copy — every paragraph, FAQ
 * answer, even standalone "Brand: Hill Interiors" / "Supplier Code: NNNN
 * Hill Interiors" lines. That's why it's safe to fix mechanically: the name
 * is never load-bearing in the sentence, it's an artefact tacked onto the
 * end of one that already stood on its own.
 *
 * Three products needed a real edit instead, because the supplier name was
 * grammatically load-bearing, not just appended:
 *   - Crofton White Marble Coffee Table: SEO copy explicitly named the
 *     supplier as a selling point ("premium UK supplier D.I. Designs").
 *   - Aegina Table Lamp: a whole cross-sell section recommended other Hill
 *     Interiors ranges and linked straight to hill-interiors.com — sending
 *     a customer to buy directly from the dropship supplier.
 *   - Echo French Grey Chair: "Hill Interiors' Allura Outdoor Collection" —
 *     the collection name is real and worth keeping, the possessive supplier
 *     name in front of it is not.
 * Those three are hand-written overrides below, not run through the
 * mechanical stripper.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-name-leak.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-name-leak.ts --apply
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

const IDS = [
  "product-di-di-crofton-ct-wh",
  "product-import-13-6m-44ft-6in-plug-in-led-warm-white-christmas-string-light",
  "product-import-2-75m-9ft-plug-in-led-8-sequence-warm-white-cluster-string",
  "product-import-7-2m-23ft-6in-plug-in-led-warm-white-cluster-micro-lights",
  "product-import-aegina-table-lamp",
  "product-import-alto-putty-grey-table",
  "product-import-antia-stem-table-lamp-with-linen-shade",
  "product-import-antique-gold-hare-table-lamp-with-green-velvet-shade",
  "product-import-antique-gold-marching-hares-lamp-with-green-velvet-shade",
  "product-import-augusta-column-table-lamp-with-linen-shade",
  "product-import-black-wood-arched-window-mirror",
  "product-import-bloom-collection-outdoor-footstool",
  "product-import-bloom-collection-outdoor-sofa",
  "product-import-capri-collection-outdoor-foot-stool",
  "product-import-contour-collection-2-drawer-2-door-sideboard",
  "product-import-contour-collection-3-drawer-console",
  "product-import-echo-french-grey-chair",
  "product-import-eucalyptus-plant-in-stone-effect-pot",
  "product-import-large-black-multi-shelf-unit",
  "product-import-large-circular-silver-wall-hanging-multi-shelf",
  "product-import-nahla-medium-mirror-with-dimpled-frame",
  "product-import-nahla-small-mirror-with-dimpled-frame",
  "product-import-provence-collection-outdoor-4-seater-dining-set",
  "product-import-provence-collection-outdoor-dining-chair",
  "product-import-reed-collection-2-drawer-2-door-console",
  "product-import-reed-collection-3-drawer-bedside-table",
  "product-import-saltaire-collection-3-shelf-unit",
  "product-import-sepia-shadows-squat-table-lamp-with-linen-shade",
  "product-import-seville-collection-lebes-planter",
  "product-import-small-blue-flora-planter-pot",
  "product-import-solenne-table-lamp-with-edged-linen-shade",
  "product-import-square-decorative-hanging-collage-mirror-in-black",
  "product-import-symi-slim-table-lamp",
  "product-import-tarn-collection-large-pot-with-handles",
  "product-import-teos-table-lamp",
  "product-import-the-camden-collection-half-moon-3-tier-table",
  "product-import-the-camden-collection-one-drawer-side-table",
  "product-import-the-rutland-collection-side-table",
  "product-import-the-serene-rattan-collection-coffee-table",
  "product-import-twill-weave-ceramic-table-lamp-with-linen-shade",
  "product-import-white-beaded-ceramic-lamp-with-linen-shade",
];

/** Hand-written replacement text for the three products where the supplier
 * name was grammatically load-bearing, keyed by product _id + field. */
const OVERRIDES: Record<string, string> = {
  "product-di-di-crofton-ct-wh:summary":
    "Curated coffee tables with considered design and solid construction.",
  "product-import-echo-french-grey-chair:summary":
    "Create a sophisticated outdoor dining space with the Echo French Grey Outdoor Dining Chair. Part of the Allura Outdoor Collection, this contemporary dining chair combines a refined French Grey finish with durable, weather-resistant construction and a clean, generously proportioned silhouette.\nMade from polypropylene and fibreglass, the Echo is engineered for outdoor use, offering resistance to moisture, UV exposure and everyday wear while remaining lightweight enough to move around your garden or patio with ease.\nIts neutral French Grey finish works effortlessly with modern patios, terraces, balconies and garden dining spaces, while the simple silhouette makes it easy to combine with a wide variety of outdoor tables and accessories.",
};

/** Description blocks needing a real edit rather than a mechanical strip,
 * keyed by product _id + the block's exact original text. `null` means
 * delete the block outright (the Aegina cross-sell paragraph linked
 * straight to the supplier's own retail site — nothing to salvage). */
const BLOCK_OVERRIDES: Record<string, string | null> = {
  "product-import-aegina-table-lamp:Pair With Hill Interiors Lighting Collections":
    null,
  "product-import-aegina-table-lamp:The Aegina Table Lamp works particularly well alongside other Hill Interiors wooden lighting designs, including the Incia Collection and sculptural lamps such as the Uthina and Pula ranges. (hill-interiors.com)":
    null,
  "product-import-echo-french-grey-chair:Create a sophisticated outdoor dining space with the Echo French Grey Outdoor Dining Chair. Designed as part of Hill Interiors' Allura Outdoor Collection, this contemporary dining chair combines a refined French Grey finish with durable, weather-resistant construction and a clean, generously proportioned silhouette. Hill Interiors":
    "Create a sophisticated outdoor dining space with the Echo French Grey Outdoor Dining Chair. Part of the Allura Outdoor Collection, this contemporary dining chair combines a refined French Grey finish with durable, weather-resistant construction and a clean, generously proportioned silhouette.",
  "product-import-echo-french-grey-chair:Hill Interiors specifically positions the Allura collection as suitable for both residential and commercial outdoor environments. Hill Interiors":
    "The Allura collection is suitable for both residential and commercial outdoor environments.",
  "product-import-eucalyptus-plant-in-stone-effect-pot:Hill Interiors specifically recommends grouping this eucalyptus arrangement in threes, creating a fuller and more dynamic decorative display. Hill Interiors":
    "Grouping this eucalyptus arrangement in threes creates a fuller and more dynamic decorative display.",
  "product-import-nahla-small-mirror-with-dimpled-frame:This makes it particularly useful for transitional interiors that combine modern and traditional elements. Hill Interiors specifically describes the mirror as suitable for both modern and traditional display themes. Hill Interiors":
    "This makes it particularly useful for transitional interiors that combine modern and traditional elements, suiting both modern and traditional display themes.",
  "product-import-nahla-small-mirror-with-dimpled-frame:Using different sizes together allows you to create a coordinated arrangement while introducing variation in scale. Hill Interiors specifically suggests pairing the small mirror with the larger Nahla mirror for a tiered presentation. Hill Interiors":
    "Using different sizes together allows you to create a coordinated arrangement while introducing variation in scale — pair the small mirror with the larger Nahla mirror for a tiered presentation.",
};

const BRAND_LINE = /^(brand|supplier code|supplier sku)\s*:/i;
const TRAILING_NAME =
  /[ \t]*\b(?:Hill Interiors|D\.?I\.?\s*Designs|Premier Housewares)\b\.?[ \t]*$/i;

/** Strips the trailing supplier-name artefact line by line, and drops any
 * line that turns out to be nothing but supplier metadata once stripped.
 * Never touches a line that doesn't actually match — no incidental
 * whitespace trimming on unrelated content. */
function cleanText(text: string): string {
  const lines = text.split("\n").map((line) => {
    if (BRAND_LINE.test(line.trim())) return "";
    if (TRAILING_NAME.test(line))
      return line.replace(TRAILING_NAME, "").trimEnd();
    return line;
  });
  return lines.filter((line) => line.trim().length > 0).join("\n");
}

const SUPPLIER_NAME_ANY =
  /\b(?:Hill Interiors|D\.?I\.?\s*Designs|Premier Housewares)\b/i;

interface Span {
  _type: string;
  text?: string;
  [key: string]: unknown;
}
interface Block {
  _type: string;
  children?: Span[];
  [key: string]: unknown;
}
interface Row {
  _id: string;
  title: string;
  summary: string | null;
  description: Block[] | null;
  faqs: { _key: string; question?: string; answer?: string }[] | null;
  seo: { metaTitle?: string; metaDescription?: string } | null;
}

function extractText(block: Block): string {
  return (block.children ?? []).map((c) => c.text ?? "").join("");
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type == "product" && _id in $ids]{
      _id, title, summary, description, faqs, seo
    }`,
    { ids: IDS },
  );

  const transaction = client.transaction();
  let queued = 0;
  const report: { id: string; title: string; changes: string[] }[] = [];

  let anyStillLeaking = false;

  for (const row of rows) {
    const changes: string[] = [];
    const patch: Record<string, unknown> = {};
    const checkLeak = (label: string, text: string | null | undefined) => {
      if (text && SUPPLIER_NAME_ANY.test(text)) {
        anyStillLeaking = true;
        changes.push(`STILL LEAKS after cleaning (${label}): "${text}"`);
      }
    };

    // Summary
    if (row.summary) {
      const key = `${row._id}:summary`;
      const cleaned = OVERRIDES[key] ?? cleanText(row.summary);
      if (cleaned !== row.summary) {
        changes.push(`summary: "${row.summary}" -> "${cleaned}"`);
        patch.summary = cleaned;
      }
      checkLeak("summary", cleaned);
    }

    // Description blocks — rebuild children text in place; drop any block
    // that becomes fully empty.
    if (row.description) {
      let changedAny = false;
      const nextBlocks: Block[] = [];
      for (const block of row.description) {
        if (block._type !== "block") {
          nextBlocks.push(block);
          continue;
        }
        const original = extractText(block);
        const overrideKey = `${row._id}:${original}`;
        const hasOverride = overrideKey in BLOCK_OVERRIDES;
        const cleaned = hasOverride
          ? BLOCK_OVERRIDES[overrideKey]
          : cleanText(original);
        if (cleaned === original) {
          nextBlocks.push(block);
          continue;
        }
        changedAny = true;
        if (cleaned === null || cleaned.trim().length === 0) {
          changes.push(`description block removed: "${original}"`);
          continue; // drop the block
        }
        changes.push(`description: "${original}" -> "${cleaned}"`);
        checkLeak("description", cleaned);
        const children = block.children ?? [];
        nextBlocks.push({
          ...block,
          children: [{ ...children[0], text: cleaned }, ...children.slice(1)],
        });
      }
      if (changedAny) patch.description = nextBlocks;
    }

    // FAQs
    if (row.faqs) {
      let changedAny = false;
      const nextFaqs = row.faqs.map((faq) => {
        const q = faq.question ? cleanText(faq.question) : faq.question;
        const a = faq.answer ? cleanText(faq.answer) : faq.answer;
        if (q !== faq.question || a !== faq.answer) {
          changedAny = true;
          changes.push(
            `faq: "${faq.question}" / "${faq.answer}" -> "${q}" / "${a}"`,
          );
          checkLeak("faq question", q);
          checkLeak("faq answer", a);
          return { ...faq, question: q, answer: a };
        }
        return faq;
      });
      if (changedAny) patch.faqs = nextFaqs;
    }

    // SEO fields
    if (row.seo?.metaTitle) {
      const cleaned =
        OVERRIDES[`${row._id}:seoTitle`] ?? cleanText(row.seo.metaTitle);
      if (cleaned !== row.seo.metaTitle) {
        changes.push(`seoTitle: "${row.seo.metaTitle}" -> "${cleaned}"`);
        patch["seo.metaTitle"] = cleaned;
      }
      checkLeak("seoTitle", cleaned);
    }
    if (row.seo?.metaDescription) {
      const cleaned =
        OVERRIDES[`${row._id}:seoDescription`] ??
        cleanText(row.seo.metaDescription);
      if (cleaned !== row.seo.metaDescription) {
        changes.push(
          `seoDescription: "${row.seo.metaDescription}" -> "${cleaned}"`,
        );
        patch["seo.metaDescription"] = cleaned;
      }
      checkLeak("seoDescription", cleaned);
    }

    if (changes.length > 0) {
      report.push({ id: row._id, title: row.title, changes });
      if (apply) {
        transaction.patch(row._id, (p) => p.set(patch));
        queued += 1;
      }
    }
  }

  for (const entry of report) {
    console.log(`\n==== ${entry.id} | ${entry.title}`);
    for (const c of entry.changes) console.log("  -", c);
  }
  console.log(`\n${report.length} products with changes.`);

  if (anyStillLeaking) {
    console.error(
      '\nRefusing to apply: at least one field still contains the supplier\'s name after cleaning — see "STILL LEAKS" lines above. Add an override and re-run.',
    );
    process.exit(1);
  }

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`Applied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("Dry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-supplier-name-leak-fix.json`,
    JSON.stringify({ apply, queued, report }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
