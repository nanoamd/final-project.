/**
 * One mechanical check over every customer-facing string in the published
 * catalogue. Read-only.
 *
 * Why this exists, plainly: three times this session I reported a defect
 * class "closed, 0 remaining" and Damien then found it by opening a page.
 * Every time, the cause was the same — each audit script invented its own
 * regex, and the regex was narrower than the real wording in the data. The
 * repo already contains a correct, commented, tested admission detector in
 * `src/lib/catalog/admissions.ts` (`isAdmission`), and the scripts were not
 * using it.
 *
 * So this script owns no patterns of its own for admissions. It imports the
 * real ones. When a new phrasing slips through, it gets fixed in
 * `admissions.ts` — where the description writer's own gate reads it too, so
 * the generator stops emitting it at the same moment the audit starts
 * catching it. One source of truth, not one per script.
 *
 * Fields covered — the point being that "the description is clean" was never
 * the claim worth making, since most surviving hedges were in FAQ answers:
 *
 *   title · summary · description · faqs[].question · faqs[].answer
 *   seoTitle · seoDescription · specs[].value
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-copy-quality.ts
 *   pnpm tsx --env-file=.env.local scripts/audit-copy-quality.ts --check hedge
 *   pnpm tsx --env-file=.env.local scripts/audit-copy-quality.ts --json
 *
 * Exit code is 1 if anything fired, so it can gate a release.
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { isAdmission, sentencesOf } from "@/lib/catalog/admissions";
import { AI_PHRASES } from "@/lib/catalog/quality";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const checkFilter = (() => {
  const i = args.indexOf("--check");
  return i === -1 ? undefined : args[i + 1];
})();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

/**
 * Marketing adjectives Damien has rejected by name. Separate from
 * `AI_PHRASES` (which catches phrases like "elevate your") because these are
 * single words that are only a fault in *our* voice — a supplier calling a
 * chair "elegant" is their copy, and the whole point of the rewrite work is
 * that we don't repeat it.
 */
const SUPERLATIVES =
  /\b(elegant|stunning|luxurious|sophisticated|exquisite|effortless(?:ly)?|timeless|striking|charming|opulent|sumptuous|breathtaking|impeccable|unparalleled|understated luxury)\b/i;

/** "The Opus Woven Rope Footstool offers a range of..." — supplier voice. */
const SELF_REFERENTIAL =
  /\bThe [A-Z][\w'-]*(?: [A-Z][\w'-]*){1,6} (?:offers|provides|delivers|boasts|features a|is designed to (?:impress|elevate))\b/;

const SUPPLIER_NAMES =
  /\b(Premier Housewares|Hill Interiors|AW Dropship|Aosom|D\.?I\.? Designs|Outdoor Living 365)\b/i;

const TRADEMARK = /[™®©]/;

/** Raw feed padding: "w120.000000". Four+ decimal places is never a real spec. */
const RAW_DECIMAL = /\b\d+\.\d{4,}\b/;

const MARKDOWN = /\*\*|\[[^\]]+\]\([^)]+\)|(?:^|\s)\*\s+\w|(?:^|\s)#{1,4}\s+\w/;

interface Check {
  name: string;
  /** Per-sentence checks run on each sentence; the rest on the whole field. */
  perSentence?: boolean;
  test: (text: string) => boolean;
  note: string;
}

const CHECKS: Check[] = [
  {
    name: "hedge",
    perSentence: true,
    test: isAdmission,
    note: "Admits a gap, deflects, or reasons from missing information (src/lib/catalog/admissions.ts)",
  },
  {
    name: "superlative",
    test: (t) => SUPERLATIVES.test(t),
    note: "Marketing adjective Damien has rejected by name",
  },
  {
    name: "ai-phrase",
    test: (t) => {
      const lower = t.toLowerCase();
      return AI_PHRASES.some((p) => lower.includes(p));
    },
    note: "Phrase from the AI_PHRASES list in quality.ts",
  },
  {
    name: "self-referential",
    test: (t) => SELF_REFERENTIAL.test(t),
    note: '"The <Product Name> offers/provides/delivers..." supplier voice',
  },
  {
    name: "supplier-name",
    test: (t) => SUPPLIER_NAMES.test(t),
    note: "Supplier's own name in customer-facing copy",
  },
  {
    name: "trademark",
    test: (t) => TRADEMARK.test(t),
    note: "Trademark symbol carried over from supplier copy",
  },
  {
    name: "raw-decimal",
    test: (t) => RAW_DECIMAL.test(t),
    note: 'Unrounded feed value, e.g. "w120.000000"',
  },
  {
    name: "markdown",
    test: (t) => MARKDOWN.test(t),
    note: "Markdown markup that renders literally",
  },
];

interface Block {
  style?: string;
  children?: { text: string }[];
}
interface Doc {
  _id: string;
  title: string | null;
  slug: string | null;
  supplier: string | null;
  summary: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  description: Block[] | null;
  faqs: { question: string; answer: string }[] | null;
  specs: { label: string; value: string }[] | null;
}

interface Hit {
  id: string;
  slug: string | null;
  supplier: string | null;
  check: string;
  field: string;
  excerpt: string;
}

function fieldsOf(doc: Doc): { field: string; text: string }[] {
  const out: { field: string; text: string }[] = [];
  const push = (field: string, text: string | null | undefined) => {
    if (text && text.trim()) out.push({ field, text });
  };
  push("title", doc.title);
  push("summary", doc.summary);
  push("seoTitle", doc.seoTitle);
  push("seoDescription", doc.seoDescription);
  (doc.description || []).forEach((b, i) => {
    const text = (b.children || []).map((c) => c.text).join("");
    push(
      `description[${i}]${b.style && b.style !== "normal" ? `:${b.style}` : ""}`,
      text,
    );
  });
  (doc.faqs || []).forEach((f, i) => {
    push(`faqs[${i}].question`, f?.question);
    push(`faqs[${i}].answer`, f?.answer);
  });
  (doc.specs || []).forEach((s, i) => {
    push(`specs[${i}](${s?.label ?? "?"})`, s?.value);
  });
  return out;
}

/**
 * The title legitimately carries a brand name with a ™ ("SaunaPlunge™
 * Yorkshire Cabin"), and SaunaPlunge is a real supplier whose brand IS the
 * product name. Flagging those is noise, not a finding.
 */
function exempt(hit: Hit, doc: Doc): boolean {
  const isSaunaPlunge = /SaunaPlunge/i.test(doc.title || "");
  if (
    isSaunaPlunge &&
    (hit.check === "trademark" || hit.check === "supplier-name")
  ) {
    return true;
  }
  // "Supplier" is a legitimate spec label/value pair in the specs table.
  if (
    hit.check === "supplier-name" &&
    /^specs\[\d+\]\(Supplier\)/.test(hit.field)
  ) {
    return true;
  }
  return false;
}

function excerptAround(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max)}…`;
}

async function main() {
  const docs: Doc[] = await client.fetch(
    `*[_type == "product" && !(_id in path("drafts.**"))]{
      _id, title, "slug": slug.current,
      "supplier": coalesce(supplier->name, supplier, "unknown"),
      summary, seoTitle, seoDescription, description,
      "faqs": faqs[]{question, answer},
      "specs": specs[]{label, value}
    } | order(_id asc)`,
  );

  const checks = checkFilter
    ? CHECKS.filter((c) => c.name === checkFilter)
    : CHECKS;
  if (checkFilter && checks.length === 0) {
    console.error(
      `Unknown check "${checkFilter}". Known: ${CHECKS.map((c) => c.name).join(", ")}`,
    );
    process.exit(1);
  }

  const hits: Hit[] = [];
  for (const doc of docs) {
    for (const { field, text } of fieldsOf(doc)) {
      for (const check of checks) {
        let fired = false;
        let excerpt = text;
        if (check.perSentence) {
          const bad = sentencesOf(text).find((s) => check.test(s));
          if (bad) {
            fired = true;
            excerpt = bad;
          }
        } else if (check.test(text)) {
          fired = true;
        }
        if (!fired) continue;
        const hit: Hit = {
          id: doc._id,
          slug: doc.slug,
          supplier: doc.supplier,
          check: check.name,
          field,
          excerpt: excerptAround(excerpt),
        };
        if (!exempt(hit, doc)) hits.push(hit);
      }
    }
  }

  const byCheck: Record<string, { fields: number; products: Set<string> }> = {};
  for (const h of hits) {
    byCheck[h.check] ??= { fields: 0, products: new Set() };
    byCheck[h.check].fields += 1;
    byCheck[h.check].products.add(h.id);
  }

  mkdirSync("docs/change-log", { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    productsScanned: docs.length,
    summary: Object.fromEntries(
      Object.entries(byCheck).map(([k, v]) => [
        k,
        { occurrences: v.fields, products: v.products.size },
      ]),
    ),
    hits,
  };
  writeFileSync(
    "docs/change-log/copy-quality-audit.json",
    JSON.stringify(report, null, 2),
  );

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(hits.length ? 1 : 0);
  }

  console.log(`Scanned ${docs.length} published products.\n`);
  if (hits.length === 0) {
    console.log("Clean on every check.");
    return;
  }
  const rows = CHECKS.filter((c) => byCheck[c.name]).map((c) => ({
    check: c.name,
    occurrences: byCheck[c.name].fields,
    products: byCheck[c.name].products.size,
    what: c.note,
  }));
  console.table(rows);

  for (const c of CHECKS) {
    const group = hits.filter((h) => h.check === c.name);
    if (!group.length) continue;
    console.log(`\n=== ${c.name} — ${group.length} occurrences ===`);
    for (const h of group.slice(0, 12)) {
      console.log(`  ${h.id} ${h.field}\n    "${h.excerpt}"`);
    }
    if (group.length > 12) console.log(`  … and ${group.length - 12} more`);
  }
  console.log(`\nFull report: docs/change-log/copy-quality-audit.json`);
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
