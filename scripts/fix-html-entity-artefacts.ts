/**
 * Fixes the exact bug Damien spotted live: a literal `&#39;` where an
 * apostrophe belongs, on the Rattan Solar Floor Lantern's Short summary
 * ("Don&#39;t be left in the dark"). The quality audit found it is not
 * isolated — decoding HTML entities left un-decoded somewhere in the import
 * pipeline, showing up as literal `&#39;`, `&amp;`, `&quot;`, `&nbsp;` etc. on
 * live product pages.
 *
 * **Scoped to exactly this: decoding named/numeric HTML entities back to the
 * character they stand for.** Nothing here rewrites a sentence or guesses at
 * intent — `&#39;` unambiguously means `'`, the same way it did before
 * whatever step encoded it. This is a bug fix, not an edit.
 *
 * Checks `summary`, `tagline`, and every text span inside `description`
 * (Portable Text) and `faqs`. Doubled spacing inside a sentence gets the same
 * pass while a document is open for this reason: it's the same category of
 * mechanical corruption, not a content decision.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-html-entity-artefacts.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-html-entity-artefacts.ts --apply
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

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&#39;": "'",
  "&apos;": "'",
  "&quot;": '"',
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
};

/** Decodes named entities above, plus any numeric entity (`&#8217;`). */
function decodeEntities(text: string): string {
  let out = text.replace(
    /&(?:amp|#39|apos|quot|lt|gt|nbsp);/gi,
    (m) => ENTITIES[m.toLowerCase()] ?? m,
  );
  out = out.replace(/&#(\d+);/g, (_, code) =>
    String.fromCodePoint(Number(code)),
  );
  return out;
}

/** Collapses doubled spacing inside a sentence (never touches newlines). */
function collapseSpacing(text: string): string {
  return text.replace(/([a-z])[ \t]{2,}([a-z])/gi, "$1 $2");
}

function fixText(text: string): string {
  return collapseSpacing(decodeEntities(text));
}

interface PortableBlock {
  _type?: string;
  children?: { _type?: string; text?: string }[];
}

function fixDescription(description: unknown): {
  changed: boolean;
  value: unknown;
} {
  if (!Array.isArray(description))
    return { changed: false, value: description };
  let changed = false;
  const value = (description as PortableBlock[]).map((block) => {
    if (block._type !== "block" || !Array.isArray(block.children)) return block;
    const children = block.children.map((span) => {
      if (span._type !== "span" || typeof span.text !== "string") return span;
      const fixed = fixText(span.text);
      if (fixed !== span.text) changed = true;
      return { ...span, text: fixed };
    });
    return { ...block, children };
  });
  return { changed, value };
}

interface Row {
  _id: string;
  title: string;
  summary: string | null;
  tagline: string | null;
  description: unknown;
  faqs: { question?: string | null; answer?: string | null }[] | null;
}

const HAS_ENTITY_OR_DOUBLE_SPACE =
  /&(?:amp|#\d+|apos|quot|lt|gt|nbsp);|[a-z][ \t]{2,}[a-z]/i;

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type == "product"]{ _id, title, summary, tagline, description, faqs }`,
  );

  let candidates = 0;
  let fields = 0;

  for (const row of rows) {
    const patch: Record<string, unknown> = {};
    let touched = false;

    if (row.summary && HAS_ENTITY_OR_DOUBLE_SPACE.test(row.summary)) {
      const fixed = fixText(row.summary);
      if (fixed !== row.summary) {
        patch.summary = fixed;
        touched = true;
        fields += 1;
      }
    }
    if (row.tagline && HAS_ENTITY_OR_DOUBLE_SPACE.test(row.tagline)) {
      const fixed = fixText(row.tagline);
      if (fixed !== row.tagline) {
        patch.tagline = fixed;
        touched = true;
        fields += 1;
      }
    }
    const { changed, value } = fixDescription(row.description);
    if (changed) {
      patch.description = value;
      touched = true;
      fields += 1;
    }
    if (row.faqs?.length) {
      let faqsChanged = false;
      const faqs = row.faqs.map((faq) => {
        const question =
          faq.question && HAS_ENTITY_OR_DOUBLE_SPACE.test(faq.question)
            ? fixText(faq.question)
            : faq.question;
        const answer =
          faq.answer && HAS_ENTITY_OR_DOUBLE_SPACE.test(faq.answer)
            ? fixText(faq.answer)
            : faq.answer;
        if (question !== faq.question || answer !== faq.answer)
          faqsChanged = true;
        return { ...faq, question, answer };
      });
      if (faqsChanged) {
        patch.faqs = faqs;
        touched = true;
        fields += 1;
      }
    }

    if (!touched) continue;
    candidates += 1;
    const isDraft = row._id.startsWith("drafts.");
    console.log(
      `  ${isDraft ? "draft " : "public"} ${row.title.slice(0, 60).padEnd(62)} fields: ${Object.keys(patch).join(", ")}`,
    );

    if (apply) await client.patch(row._id).set(patch).commit();
  }

  console.log(
    `\n${candidates} products, ${fields} fields fixed. ${apply ? "APPLIED" : "DRY RUN — nothing written, re-run with --apply."}\n`,
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-html-entity-artefact-fix.json`,
    JSON.stringify({ applied: apply, candidates, fields }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
