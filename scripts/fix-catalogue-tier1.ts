/**
 * Tier 1 of the catalogue quality audit: the mechanical fixes.
 *
 * Everything here is a correction that needs no judgement about what a product
 * is — stripping a supplier's name out of customer-facing copy, putting the
 * "| Kaiku" suffix back on a title, deleting an FAQ whose answer is "not
 * specified". The rewriting of thin descriptions is Tier 2 and is deliberately
 * not attempted here.
 *
 * **Dry run by default.** Nothing is written without `--apply`, and every change
 * is recorded to a dated change log so it can be read back or reversed.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-catalogue-tier1.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-catalogue-tier1.ts --apply
 *
 * **Anything needing a decision is flagged, never guessed.** A heading that
 * reads "Pair With Hill Interiors Lighting Collections" cannot be repaired by
 * deleting two words — it is reported for Tier 2 instead, because inventing a
 * replacement heading is exactly the failure this whole audit is about.
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

/** Every supplier whose name must not appear in customer-facing copy. */
const SUPPLIER_NAMES = [
  "Hill Interiors",
  "Premier Housewares",
  "D.I. Designs",
  "DI Designs",
  "AW Dropship",
  "Aosom",
  "Outsunny",
];

const SUPPLIER_ALTERNATION = SUPPLIER_NAMES.map((n) =>
  n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
).join("|");

/** " … indoor environments. Hill Interiors" — a citation marker, not prose. */
const TRAILING_CITATION = new RegExp(
  `[\\s—–-]*(?:${SUPPLIER_ALTERNATION})\\s*$`,
  "i",
);
/** "(hill-interiors.com)" and friends. */
const PARENTHETICAL_DOMAIN =
  /\s*\((?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.(?:com|co\.uk|net)\/?[^)]*\)/gi;
/** A whole line that only exists to carry internal data. */
const INTERNAL_ONLY_LINE = new RegExp(
  `^\\s*(?:Brand|Supplier(?:\\s*Code)?|Outer Quantity|Barcode|EAN)\\s*:\\s*.*(?:${SUPPLIER_ALTERNATION})?\\s*$`,
  "i",
);
const SUPPLIER_LINE = new RegExp(
  `^\\s*(?:Brand|Supplier)\\s*:\\s*(?:${SUPPLIER_ALTERNATION})\\s*$`,
  "i",
);

/**
 * "The supplier specifies that these lights are indoor-rated" reads as a
 * middleman quoting a third party. Kaiku either knows the fact or does not.
 * Only these exact openings are rewritten; anything else is flagged.
 */
const HEDGE_REWRITES: [RegExp, string][] = [
  [/^The supplier specifies that\s+/i, ""],
  [/^The supplier states that\s+/i, ""],
  [/^The supplier notes that\s+/i, ""],
  [/^According to the supplier,\s+/i, ""],
  [/^The supplier's listed\s+/i, "The listed "],
];

/**
 * Phrases that must not be repaired mechanically.
 *
 * "The supplier specifically highlights its suitability for commercial
 * settings" cannot be fixed by swapping the opening — the sentence has to be
 * rebuilt around a new subject, and guessing at one is the exact failure this
 * audit exists to correct. Same for any sentence where a supplier is the
 * grammatical subject rather than a trailing citation.
 */
const NEEDS_JUDGEMENT = new RegExp(
  `(?:The supplier (?:specifically|also|further)\\s|(?:${SUPPLIER_ALTERNATION})\\s+(?:specifically|specialises|positions|recommends|describes|states|notes))`,
  "i",
);

interface Change {
  id: string;
  title: string;
  field: string;
  kind: string;
  before: string;
  after: string;
}
interface Flag {
  id: string;
  title: string;
  reason: string;
  detail: string;
}

const changes: Change[] = [];
const flags: Flag[] = [];

/** Capitalises the first letter after a hedge prefix has been removed. */
function recapitalise(text: string): string {
  const trimmed = text.trimStart();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function cleanText(raw: string): { text: string; drop: boolean } {
  let text = raw;
  if (SUPPLIER_LINE.test(text) || INTERNAL_ONLY_LINE.test(text)) {
    // A line that is only "Brand: Hill Interiors" or "Supplier Code: 23677"
    // has no reader. Removing the words would leave "Brand:" behind, so the
    // whole block goes.
    // "Outer Quantity: 12" is the supplier's trade pack size. It means nothing
    // to a customer and quietly announces that we are a reseller.
    if (
      SUPPLIER_LINE.test(text) ||
      /Supplier\s*Code/i.test(text) ||
      /^\s*Outer Quantity\s*:/i.test(text)
    )
      return { text: "", drop: true };
  }
  text = text.replace(PARENTHETICAL_DOMAIN, "");
  for (const [pattern, replacement] of HEDGE_REWRITES) {
    if (pattern.test(text)) {
      text = recapitalise(text.replace(pattern, replacement));
      // "The supplier states that this is heavy and that assembly needs two
      // people" becomes "This is heavy and that assembly needs two people"
      // unless the second "that" goes with the first.
      text = text.replace(/\s+and that\s+/gi, " and ");
    }
  }
  // Applied last: a trailing name may sit after a domain that was just removed.
  text = text.replace(TRAILING_CITATION, "");
  return { text: text.replace(/\s+$/, ""), drop: false };
}

interface Block {
  _type?: string;
  _key?: string;
  style?: string;
  children?: {
    _type?: string;
    _key?: string;
    text?: string;
    marks?: string[];
  }[];
}

async function main() {
  const rows: {
    _id: string;
    title?: string;
    summary?: string;
    description?: Block[];
    faqs?: { question?: string; answer?: string }[];
    seo?: { metaTitle?: string; metaDescription?: string };
  }[] = await client.fetch(
    `*[_type == "product"]{ _id, title, summary, description, faqs, seo }`,
  );

  const patches: { id: string; set: Record<string, unknown> }[] = [];

  for (const row of rows) {
    const set: Record<string, unknown> = {};
    const title = row.title ?? "(untitled)";

    // ---- 1. Titles ---------------------------------------------------
    if (row.title) {
      let next = row.title.trim();
      // A template placeholder written into a live product name.
      next = next.replace(/\s*\|\s*Kaiku Tagline\s*$/i, "");
      next = next.replace(/\s*\|\s*Kaiku\s*$/i, "");
      next = `${next.trim()} | Kaiku`;
      if (next !== row.title) {
        set.title = next;
        changes.push({
          id: row._id,
          title,
          field: "title",
          kind: "kaiku-suffix",
          before: row.title,
          after: next,
        });
      }
    }

    // ---- 2. Descriptions ----------------------------------------------
    if (Array.isArray(row.description)) {
      let touched = false;
      const nextBlocks: Block[] = [];
      for (const block of row.description) {
        if (block._type !== "block" || !Array.isArray(block.children)) {
          nextBlocks.push(block);
          continue;
        }
        const original = block.children.map((c) => c.text ?? "").join("");

        // A heading naming a supplier cannot be mechanically repaired.
        if (
          (block.style === "h1" ||
            block.style === "h2" ||
            block.style === "h3") &&
          new RegExp(SUPPLIER_ALTERNATION, "i").test(original)
        ) {
          flags.push({
            id: row._id,
            title,
            reason: "heading names the supplier",
            detail: original.trim(),
          });
          nextBlocks.push(block);
          continue;
        }

        if (NEEDS_JUDGEMENT.test(original)) {
          flags.push({
            id: row._id,
            title,
            reason: "supplier is the subject of the sentence",
            detail: original.trim().slice(0, 160),
          });
          nextBlocks.push(block);
          continue;
        }

        const { text: cleaned, drop } = cleanText(original);
        if (drop) {
          touched = true;
          changes.push({
            id: row._id,
            title,
            field: "description",
            kind: "removed-internal-line",
            before: original.trim(),
            after: "(block removed)",
          });
          continue;
        }
        // Content only, for the same reason as the summary and FAQ guards
        // above: a whitespace-only rewrite changes nothing a customer sees.
        const sameWords =
          cleaned.replace(/\s+/g, " ").trim() ===
          original.replace(/\s+/g, " ").trim();
        if (cleaned !== original && !sameWords) {
          if (new RegExp(SUPPLIER_ALTERNATION, "i").test(cleaned)) {
            // Half-cleaned copy is worse than untouched copy: it reads as an
            // editing mistake rather than as a citation.
            flags.push({
              id: row._id,
              title,
              reason: "supplier name survives cleaning",
              detail: cleaned.trim().slice(0, 160),
            });
            nextBlocks.push(block);
            continue;
          }
          touched = true;
          changes.push({
            id: row._id,
            title,
            field: "description",
            kind: "supplier-reference",
            before: original.trim(),
            after: cleaned.trim(),
          });
          // Collapse to a single span: the citation always sat in its own or
          // the final span, and preserving per-span marks across a text edit
          // risks moving a bold or a link onto the wrong words.
          nextBlocks.push({
            ...block,
            children: [
              {
                _type: "span",
                _key: block.children[0]?._key ?? `${block._key}-s`,
                text: cleaned,
                marks: [],
              },
            ],
          });
          continue;
        }
        nextBlocks.push(block);
      }
      // An emptied block would render as a blank gap.
      const pruned = nextBlocks.filter(
        (b) =>
          b._type !== "block" ||
          (b.children ?? [])
            .map((c) => c.text ?? "")
            .join("")
            .trim().length > 0,
      );
      if (touched) set.description = pruned;
    }

    // ---- 2b. Summary ---------------------------------------------------
    // The first pass never looked here, and 15 published summaries named a
    // supplier or carried a "(hill-interiors.com)" citation.
    if (typeof row.summary === "string" && row.summary.trim()) {
      if (NEEDS_JUDGEMENT.test(row.summary)) {
        flags.push({
          id: row._id,
          title,
          reason: "summary needs a rewrite, not a strip",
          detail: row.summary.trim().slice(0, 160),
        });
      } else {
        const tidied = cleanText(row.summary).text.trim();
        // Only when the *content* changed. Collapsing whitespace alone would
        // rewrite 568 documents to no benefit, and a summary's line breaks are
        // deliberate — flattening them is a regression, not a tidy-up.
        const sameWords = (a: string, b: string) =>
          a.replace(/\s+/g, " ").trim() === b.replace(/\s+/g, " ").trim();
        if (
          !sameWords(tidied, row.summary) &&
          !new RegExp(SUPPLIER_ALTERNATION, "i").test(tidied)
        ) {
          set.summary = tidied;
          changes.push({
            id: row._id,
            title,
            field: "summary",
            kind: "supplier-reference",
            before: row.summary,
            after: tidied,
          });
        }
      }
    }

    // ---- 3. FAQs -------------------------------------------------------
    if (Array.isArray(row.faqs) && row.faqs.length > 0) {
      const EMPTY =
        /\b(?:not specified|no(?:t)? (?:available|provided|listed|stated)|unavailable|information is not)\b/i;
      const kept: { question?: string; answer?: string }[] = [];
      let faqsTouched = false;

      for (const faq of row.faqs) {
        const answer = faq?.answer ?? "";

        // An answer that admits it knows nothing is worse than no FAQ at all.
        if (EMPTY.test(answer)) {
          faqsTouched = true;
          changes.push({
            id: row._id,
            title,
            field: "faqs",
            kind: "removed-empty-faq",
            before: `Q: ${faq.question} / A: ${answer}`,
            after: "(removed)",
          });
          continue;
        }

        // "delivery for orders under £50" contradicts free delivery on
        // everything. A wrong delivery promise is worse than a missing one and
        // cannot be patched by deleting a word, so the whole answer goes.
        if (/(?:under|over|above|below)\s*£\s?\d/i.test(answer)) {
          faqsTouched = true;
          changes.push({
            id: row._id,
            title,
            field: "faqs",
            kind: "removed-wrong-delivery-faq",
            before: `Q: ${faq.question} / A: ${answer}`,
            after: "(removed — delivery is free on everything)",
          });
          continue;
        }

        const nextQuestion = cleanText(faq?.question ?? "").text.trim();
        const nextAnswer = cleanText(answer).text.trim();

        // Content only. HTML collapses consecutive spaces anyway, so a
        // whitespace-only edit rewrites the document and changes nothing a
        // customer can see.
        const sameWords = (a: string, b: string) =>
          a.replace(/\s+/g, " ").trim() === b.replace(/\s+/g, " ").trim();
        if (
          !sameWords(nextQuestion, faq.question ?? "") ||
          !sameWords(nextAnswer, answer)
        ) {
          if (new RegExp(SUPPLIER_ALTERNATION, "i").test(nextAnswer)) {
            // Never leave a half-cleaned answer behind.
            flags.push({
              id: row._id,
              title,
              reason: "FAQ answer needs a rewrite, not a strip",
              detail: nextAnswer.slice(0, 160),
            });
            kept.push(faq);
            continue;
          }
          faqsTouched = true;
          changes.push({
            id: row._id,
            title,
            field: "faqs",
            kind: "supplier-reference",
            before: `Q: ${faq.question} / A: ${answer}`,
            after: `Q: ${nextQuestion} / A: ${nextAnswer}`,
          });
          kept.push({ ...faq, question: nextQuestion, answer: nextAnswer });
          continue;
        }
        kept.push(faq);
      }

      if (faqsTouched) set.faqs = kept;
    }

    // ---- 4. Over-long meta descriptions --------------------------------
    const meta = row.seo?.metaDescription;
    if (meta && meta.length > 160) {
      // Cut at the last sentence end inside the limit, else the last word —
      // never mid-word, and never with an ellipsis pretending to be prose.
      const window = meta.slice(0, 157);
      const lastStop = Math.max(
        window.lastIndexOf(". "),
        window.lastIndexOf("? "),
      );
      const next =
        lastStop > 90
          ? window.slice(0, lastStop + 1)
          : `${window.slice(0, window.lastIndexOf(" "))}…`;
      set["seo.metaDescription"] = next;
      changes.push({
        id: row._id,
        title,
        field: "seo.metaDescription",
        kind: "trimmed-meta",
        before: meta,
        after: next,
      });
    }

    if (Object.keys(set).length > 0) patches.push({ id: row._id, set });
  }

  // ---- Report -----------------------------------------------------------
  const byKind = new Map<string, number>();
  for (const change of changes)
    byKind.set(change.kind, (byKind.get(change.kind) ?? 0) + 1);

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — Tier 1 catalogue fixes\n`);
  console.log(`Documents to patch: ${patches.length}`);
  console.log(`Individual changes: ${changes.length}`);
  for (const [kind, count] of [...byKind].sort((a, b) => b[1] - a[1]))
    console.log(`   ${String(count).padStart(4)}  ${kind}`);
  console.log(`\nFlagged for Tier 2 (not touched): ${flags.length}`);
  for (const flag of flags.slice(0, 10))
    console.log(
      `   ${flag.title.slice(0, 40)} — "${flag.detail.slice(0, 60)}"`,
    );

  console.log("\n──── sample of changes ────");
  for (const change of changes.slice(0, 12)) {
    console.log(`\n[${change.kind}] ${change.title.slice(0, 46)}`);
    console.log(`  −  ${change.before.slice(0, 150)}`);
    console.log(`  +  ${change.after.slice(0, 150)}`);
  }

  // ---- Change log (Step 21) --------------------------------------------
  mkdirSync("docs/change-log", { recursive: true });
  const stamp = new Date().toISOString();
  const logPath = `docs/change-log/${stamp.slice(0, 10)}-tier1.json`;
  writeFileSync(
    logPath,
    JSON.stringify(
      { generatedAt: stamp, applied: apply, changes, flags },
      null,
      2,
    ),
  );
  console.log(`\nChange log written to ${logPath}`);

  if (!apply) {
    console.log("\nNothing was written. Re-run with --apply to commit these.");
    return;
  }

  let done = 0;
  for (const patch of patches) {
    await client.patch(patch.id).set(patch.set).commit();
    done++;
    if (done % 25 === 0) console.log(`  patched ${done}/${patches.length}`);
  }
  console.log(`\nPatched ${done} documents.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
