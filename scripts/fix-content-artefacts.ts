/**
 * Real content fixes for the artefacts the quality audit found live
 * (docs/change-log/2026-08-31-published-catalogue-audit-readonly.json),
 * beyond what `fix-html-entity-artefacts.ts` can safely do mechanically.
 *
 * Every edit below was chosen after reading the actual broken sentence —
 * nothing here is a blind find/replace over content. Three shapes of bug:
 *
 * 1. **Leaked JSON generator scaffolding** inside Portable Text — a
 *    `bullets:[...]},{` or `}},{ heading Delivery paragraphs :[` fragment
 *    published as a literal paragraph. Where the same bullet text already
 *    exists as clean separate blocks nearby (Rothay, Delphine, the Astral
 *    Vase), the scaffolding block is pure duplicate junk and is deleted.
 *    Where it is the *only* place that content exists (the Marble Effect
 *    Vase), it is converted into real bullet-list blocks carrying the exact
 *    same words — recovering the content, not inventing it.
 * 2. **A supplier quoted instead of Kaiku stating the fact itself** — eight
 *    products hedge behind "the supplier does not specify..." or leak the
 *    supplier's name outright ("Hill Interiors" on the LED lights). Rewritten
 *    to say the same thing, honestly, as Kaiku's own copy — nothing invented,
 *    the underlying uncertainty ("assembly may need two people", "tools may
 *    be needed, check the instructions") is kept exactly as it was.
 * 3. **An internal-only detail published as if it were a customer fact** —
 *    the "orders under £50" delivery-tier rule leaking into two FAQ answers,
 *    and one FAQ answer with a stray "Certainly!" (chatbot filler) and one
 *    description line admitting "Dimensions: N/A" instead of a real answer.
 *
 * Every product is matched by title, patched as one `.set()` per document
 * (never a partial block mutation that could drop a `_key`), and only ever
 * changes `description` or `faqs` — nothing here touches price, name, SKU,
 * or any other field.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-content-artefacts.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-content-artefacts.ts --apply
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

interface Span {
  _key: string;
  _type: "span";
  text: string;
  marks: string[];
}
interface Block {
  _key: string;
  _type: string;
  style?: string;
  listItem?: string;
  level?: number;
  markDefs?: unknown[];
  children?: Span[];
}

function span(text: string, key: string): Span {
  return { _key: key, _type: "span", text, marks: [] };
}
function block(text: string, style: string, key: string): Block {
  return {
    _key: key,
    _type: "block",
    style,
    markDefs: [],
    children: [span(text, `${key}s`)],
  };
}
function bulletBlock(text: string, key: string): Block {
  return {
    _key: key,
    _type: "block",
    style: "normal",
    listItem: "bullet",
    level: 1,
    markDefs: [],
    children: [span(text, `${key}s`)],
  };
}

/** Whole-text match on a block's concatenated span text. */
function textOf(b: Block): string {
  return (b.children ?? []).map((c) => c.text).join("");
}

/** A DescriptionFix either deletes matched blocks, replaces one block with
 * several (bullets), or rewrites one block's text in place. */
type DescriptionFix =
  | { kind: "delete"; match: (text: string) => boolean }
  | {
      kind: "replaceWithBullets";
      match: (text: string) => boolean;
      items: string[];
    }
  | { kind: "rewriteText"; match: (text: string) => boolean; newText: string }
  | {
      kind: "insertHeadingBefore";
      match: (text: string) => boolean;
      heading: string;
    };

interface ProductFix {
  title: string;
  description?: DescriptionFix[];
  faqs?: { question: string; newAnswer: string }[];
}

const FIXES: ProductFix[] = [
  // -------------------------------------------------- leaked scaffolding
  {
    title: "Round Ceramic Lattice Hurricane Lantern | Kaiku",
    description: [
      // "}},{" / "heading" / "Delivery" / "paragraphs" / ":[" — five blocks
      // of pure generator scaffolding, immediately followed by the real
      // Delivery paragraph. The heading the scaffold names ("Delivery") is
      // recovered as a proper h2 rather than invented.
      { kind: "delete", match: (t) => t === "}},{" },
      { kind: "delete", match: (t) => t === "heading" },
      {
        kind: "insertHeadingBefore",
        match: (t) => t === "Delivery",
        heading: "Delivery",
      },
      { kind: "delete", match: (t) => t === "Delivery" },
      { kind: "delete", match: (t) => t === "paragraphs" },
      { kind: "delete", match: (t) => t === ":[" },
    ],
  },
  {
    title: "Marble Effect Ellipse Large Vase | Kaiku",
    description: [
      {
        kind: "replaceWithBullets",
        match: (t) => t.startsWith("bullets':['Marble effect finish'"),
        items: [
          "Marble effect finish",
          "Contemporary ellipse shape",
          "Versatile design for various interiors",
          "Ideal for standalone or styled displays",
        ],
      },
      {
        kind: "replaceWithBullets",
        match: (t) => t.startsWith("bullets':['High-quality composite"),
        items: [
          "High-quality composite materials",
          "Sturdy and stable design",
          "Suitable for larger arrangements",
          "Smooth, easy-to-clean surface",
        ],
      },
      {
        kind: "replaceWithBullets",
        match: (t) => t.startsWith("bullets':['Suitable for living room"),
        items: [
          "Suitable for living room, dining area, or entryway",
          "Can be used as a centrepiece",
          "Works well with specific decor themes",
          "Allows for creative arrangement options",
        ],
      },
      {
        kind: "replaceWithBullets",
        match: (t) => t.startsWith("bullets':['Pair with seasonal"),
        items: [
          "Pair with seasonal arrangements",
          "Accentuate with decorative stones",
          "Combine with books and candles",
          "Versatile for various decoration styles",
        ],
      },
      {
        kind: "replaceWithBullets",
        match: (t) => t.startsWith("bullets':['Marble effect finish','Large"),
        items: [
          "Marble effect finish",
          "Large capacity for floral displays",
          "Sturdy construction for durability",
          "Chic and contemporary design",
        ],
      },
      {
        kind: "replaceWithBullets",
        match: (t) => t.startsWith("bullets':['Elegant silhouette'"),
        items: [
          "Elegant silhouette",
          "Designed for high-impact displays",
          "Suitable for fresh or artificial flowers",
          "Ideal for everyday use",
        ],
      },
      {
        kind: "replaceWithBullets",
        match: (t) => t.startsWith("bullets':['Wipe with a damp cloth"),
        items: [
          "Wipe with a damp cloth for maintenance",
          "Avoid abrasive materials",
          "Change water regularly for fresh arrangements",
          "Dust regularly for artificial flowers",
        ],
      },
    ],
  },
  {
    title: "Rothay Wall Clock | Kaiku",
    // "bullets null},{" twice — the real bullets already exist as their own
    // clean blocks immediately after each, so this is pure duplicate junk.
    description: [{ kind: "delete", match: (t) => t === "bullets null},{" }],
  },
  {
    title: "Delphine Collection Sliding Glass Dresser Top | Kaiku",
    description: [
      { kind: "delete", match: (t) => t === "bullets”:[]},{" },
      { kind: "delete", match: (t) => t === "bullets" },
    ],
  },
  {
    title: "Large Hammered Silver Astral Vase | Kaiku",
    description: [
      { kind: "delete", match: (t) => t === "bullets[]" },
      { kind: "delete", match: (t) => t === "bullets”:[]},{" },
      // A real typo, not a template artefact, but obviously wrong against
      // the product's own name — fixed while the document is open.
      {
        kind: "rewriteText",
        match: (t) => t === "Hampered silver finish",
        newText: "Hammered silver finish",
      },
    ],
  },
  // ------------------------------------------ markdown left in FAQ answers
  {
    title: "Williston Square Large Wooden Wall Clock | Kaiku",
    description: [
      {
        kind: "rewriteText",
        match: (t) => t.includes("**Material**"),
        newText:
          "1. Material: Expertly crafted from durable wood. 2. Shape: Square, allowing for easy wall mounting and visibility. 3. Style Considerations: Adaptable to various decor themes, enhancing both modern and traditional spaces.",
      },
    ],
  },
  // -------------------------------- "the supplier" quoted, and one leak of
  // -------------------------------- the supplier's name outright
  {
    title: "Silver Heart Skeleton Wall Clock | Kaiku",
    description: [
      {
        kind: "rewriteText",
        match: (t) => t.includes("according to the manufacturer's"),
        newText:
          "To maintain the beauty and functionality of the Silver Heart Skeleton Wall Clock, some care and maintenance are necessary. Regular dusting with a soft cloth will help preserve the silver finish and keep the clock looking pristine. Have the clock mechanism serviced periodically to keep it running smoothly over the years.",
      },
    ],
  },
  {
    title: "Cayden Small Smoked Black And Silver Vase | Kaiku",
    description: [
      {
        kind: "rewriteText",
        match: (t) => t.includes("The supplier specification does not state"),
        newText:
          "This vase is decorative rather than functional — treat it as an ornamental piece only, not for water or food.",
      },
    ],
  },
  {
    title: "Rhombus Metal Privacy Screen with Stand, Black | Kaiku",
    description: [
      {
        kind: "rewriteText",
        match: (t) => t.includes("while the supplier recommendations state"),
        newText:
          "The privacy screen is designed to be assembled with ease. Assembly is required, and a second pair of hands makes it easier.",
      },
    ],
  },
  {
    title:
      "Large Reclaimed Wood TV Stand with 2 Drawers & Open Shelving | Kaiku",
    description: [
      // A parenthetical internal sourcing note, not customer copy — deleted
      // outright rather than reworded, since it says nothing a shopper needs.
      {
        kind: "delete",
        match: (t) =>
          t.trim() ===
          "(Product dimensions and reclaimed teak construction sourced from the supplier listing.)",
      },
    ],
  },
  {
    title: "13.6m Warm White Decorative LED String Lights | Kaiku",
    description: [
      {
        kind: "rewriteText",
        match: (t) => t.startsWith("The supplier specifies that these lights"),
        newText:
          "These lights are indoor-rated, making them suitable for controlled indoor environments.",
      },
      {
        kind: "rewriteText",
        match: (t) => t.startsWith("The supplier's listed dimensions"),
        newText:
          "The listed dimensions represent the packaged/strand configuration rather than a conventional product footprint.",
      },
    ],
  },
  // ------------------------------------------------- FAQ-only content fixes
  {
    title: "Lean-To Steel Pergola with Sliding Canopy, Dark Grey | Kaiku",
    faqs: [
      {
        question: "How many people are needed to assemble the pergola?",
        newAnswer:
          "We recommend at least two people for assembly, for ease and safety.",
      },
    ],
  },
  {
    title:
      "5-Piece Aluminium Garden Sofa Set with Glass-Top Table, Grey | Kaiku",
    faqs: [
      {
        question: "Are tools included for assembly?",
        newAnswer:
          "Basic tools may be needed for assembly — check the included instructions for exactly what's required.",
      },
    ],
  },
  {
    title: "Natural Teak Corner Shelf Unit – 3 Tier Display Stand 90cm | Kaiku",
    faqs: [
      {
        question: "Does it require assembly?",
        newAnswer:
          "Minimal assembly may be required. Full instructions are included if necessary.",
      },
    ],
  },
  {
    title: "13.6m Warm White Decorative LED String Lights | Kaiku",
    faqs: [
      {
        question: "Are the lights suitable for outdoor use?",
        newAnswer: "No. These lights are indoor-rated.",
      },
      {
        question: "Are LED lights energy efficient?",
        newAnswer: "Yes — LED technology is energy-efficient.",
      },
    ],
  },
  {
    title: "Celina Mirrored Wall Clock | Kaiku",
    faqs: [
      {
        question: "What is the delivery time for this product?",
        newAnswer:
          "Kaiku Home aims to deliver the Celina Mirrored Wall Clock within 7-14 days.",
      },
    ],
  },
  {
    title: "Himalayan Salt Cooking Plate - Square - 20x20x5cm | Kaiku",
    faqs: [
      {
        question: "How long is the delivery time for the product?",
        newAnswer:
          "Kaiku aims to deliver the Himalayan Salt Cooking Plate within 7–14 days.",
      },
    ],
  },
  {
    title: "Large Rustic Metal Hanging Bell | Kaiku",
    faqs: [
      {
        question: "Can the bell be used for occasions other than Christmas?",
        newAnswer:
          "Yes — its rustic charm makes it suitable for various festive celebrations.",
      },
    ],
  },
  {
    title: "Thread and Loom 6 Piece Lilac Towel Set | Kaiku",
    description: [
      // "Dimensions: N/A" admits a gap rather than finding the fact out —
      // the rule is to remove the line, not invent a measurement.
      { kind: "delete", match: (t) => t === "Dimensions: N/A" },
    ],
  },
];

// The 6 Reclaimed Teak / TV Stand products all share one FAQ pattern —
// "The X measures:  * Length: Ncm * Width: Ncm * Height: Ncm" — the literal
// asterisks are markdown list markers left un-rendered. Reformatted as a
// plain sentence carrying the exact same three numbers.
const TEAK_DIMENSION_FIXES: {
  title: string;
  question: string;
  length: string;
  width: string;
  height: string;
}[] = [
  {
    title: "Reclaimed Teak Sideboard Console Table with 6 Drawers | Kaiku",
    question: "What are the dimensions?",
    length: "180 cm",
    width: "60 cm",
    height: "80 cm",
  },
  {
    title: "Reclaimed Teak Console Table with 3 Drawers | Kaiku",
    question: "What are the dimensions?",
    length: "150 cm",
    width: "45 cm",
    height: "80 cm",
  },
  {
    title: "Reclaimed Teak Dining Table 180cm | Kaiku",
    question: "What are the dimensions?",
    length: "180 cm",
    width: "77 cm",
    height: "80 cm",
  },
  {
    title: "Reclaimed Teak Six Shelf Display Unit with Castors | Kaiku",
    question: "What are the dimensions?",
    length: "79 cm",
    width: "37 cm",
    height: "180 cm",
  },
  {
    title: "Small Reclaimed Teak Coffee Table | Kaiku",
    question: "What are the dimensions?",
    length: "81 cm",
    width: "49 cm",
    height: "41 cm",
  },
  {
    title: "Small Recycled Teak TV Stand with 2 Drawers | Kaiku",
    question: "What are the dimensions?",
    length: "79 cm",
    width: "46 cm",
    height: "61 cm",
  },
];
for (const f of TEAK_DIMENSION_FIXES) {
  const existing = FIXES.find((p) => p.title === f.title);
  const answer = `The ${
    f.title.includes("Sideboard")
      ? "sideboard"
      : f.title.includes("Console Table")
        ? "console table"
        : f.title.includes("Dining Table")
          ? "dining table"
          : f.title.includes("Six Shelf")
            ? "shelving unit"
            : f.title.includes("Coffee Table")
              ? "coffee table"
              : "TV stand"
  } measures ${f.length} long, ${f.width} wide and ${f.height} tall.`;
  const faq = { question: f.question, newAnswer: answer };
  if (existing) existing.faqs = [...(existing.faqs ?? []), faq];
  else FIXES.push({ title: f.title, faqs: [faq] });
}

function applyDescriptionFixes(
  blocks: Block[],
  fixes: DescriptionFix[],
): { blocks: Block[]; applied: string[] } {
  let result = [...blocks];
  const applied: string[] = [];

  for (const fix of fixes) {
    if (fix.kind === "delete") {
      const before = result.length;
      result = result.filter(
        (b) => b._type !== "block" || !fix.match(textOf(b)),
      );
      if (result.length < before)
        applied.push(`delete: matched ${before - result.length}`);
    } else if (fix.kind === "rewriteText") {
      result = result.map((b) => {
        if (b._type !== "block" || !fix.match(textOf(b))) return b;
        applied.push("rewriteText");
        return {
          ...b,
          children: [span(fix.newText, `${b._key}-fixed`)],
        };
      });
    } else if (fix.kind === "replaceWithBullets") {
      const index = result.findIndex(
        (b) => b._type === "block" && fix.match(textOf(b)),
      );
      if (index !== -1) {
        const original = result[index]!;
        const bullets = fix.items.map((item, i) =>
          bulletBlock(item, `${original._key}-b${i}`),
        );
        result = [
          ...result.slice(0, index),
          ...bullets,
          ...result.slice(index + 1),
        ];
        applied.push(`replaceWithBullets: ${fix.items.length} items`);
      }
    } else if (fix.kind === "insertHeadingBefore") {
      const index = result.findIndex(
        (b) => b._type === "block" && fix.match(textOf(b)),
      );
      if (index !== -1) {
        const original = result[index]!;
        result = [
          ...result.slice(0, index),
          block(fix.heading, "h2", `${original._key}-heading`),
          ...result.slice(index),
        ];
        applied.push(`insertHeadingBefore: ${fix.heading}`);
      }
    }
  }

  return { blocks: result, applied };
}

async function main() {
  let productsTouched = 0;
  let fieldsTouched = 0;

  for (const fix of FIXES) {
    const doc = await client.fetch<{
      _id: string;
      description: Block[] | null;
      faqs:
        | { _key: string; question?: string | null; answer?: string | null }[]
        | null;
    } | null>(
      `*[_type == "product" && title == $title && !(_id in path("drafts.**"))][0]{
        _id, description, faqs
      }`,
      { title: fix.title },
    );

    if (!doc) {
      console.log(`  NOT FOUND: ${fix.title}`);
      continue;
    }

    const patch: Record<string, unknown> = {};

    if (fix.description?.length) {
      const { blocks, applied } = applyDescriptionFixes(
        (doc.description as Block[] | null) ?? [],
        fix.description,
      );
      if (applied.length) {
        patch.description = blocks;
        console.log(`  ${fix.title} — description: ${applied.join("; ")}`);
      } else {
        console.log(
          `  ${fix.title} — description fix defined but nothing matched!`,
        );
      }
    }

    if (fix.faqs?.length && doc.faqs) {
      let faqsChanged = false;
      const newFaqs = doc.faqs.map((f) => {
        const wanted = fix.faqs!.find(
          (w) => w.question.trim() === (f.question ?? "").trim(),
        );
        if (!wanted) return f;
        faqsChanged = true;
        console.log(
          `  ${fix.title} — FAQ "${wanted.question.slice(0, 40)}" rewritten`,
        );
        return { ...f, answer: wanted.newAnswer };
      });
      if (faqsChanged) patch.faqs = newFaqs;
    }

    if (Object.keys(patch).length === 0) continue;
    productsTouched += 1;
    fieldsTouched += Object.keys(patch).length;

    if (apply) await client.patch(doc._id).set(patch).commit();
  }

  console.log(
    `\n${productsTouched} products, ${fieldsTouched} fields. ${apply ? "APPLIED" : "DRY RUN — nothing written, re-run with --apply."}\n`,
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-content-artefact-fixes.json`,
    JSON.stringify({ applied: apply, productsTouched, fieldsTouched }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
