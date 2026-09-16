/**
 * Takes the machine-written voice out of the product descriptions.
 *
 * Damien: _"remove all traces of ai from them 9, and all pages, make them all
 * clearly human"_.
 *
 * `audit-ai-tells.ts` found where it actually is: **3,036 of 3,037 tells are in
 * product descriptions.** The tool pages he asked about carry none, and neither
 * do the guides, the journal or the categories. So this touches products only.
 *
 * TWO OPERATIONS, AND THE FIRST IS THE IMPORTANT ONE.
 *
 *   **Delete, do not paraphrase.** Almost every tell sits in a sentence that
 *   carries no information: "Not just a beautiful accessory, but a functional
 *   piece that aids your daily routine, this clock encourages leisure." Deleting
 *   it costs the reader nothing and is the only edit that cannot introduce a
 *   claim the supplier never made. A sentence is droppable only when it matches
 *   a tell AND contains no number, measurement or material — anything factual is
 *   left alone even when the phrasing is poor.
 *
 *   **Then a few word-level swaps**, on sentences that do carry facts and so
 *   cannot be dropped: `boasts` -> `has`, `meticulously`/`seamlessly` deleted,
 *   `ensures` -> `means`. Small, reversible, and they never change a fact.
 *
 * FOUR GUARDS, because this rewrites 700-odd pieces of live copy:
 *
 *   - A description is skipped if the edit would take it under 60 words. A gutted
 *     page is worse than a badly written one.
 *   - Headings are never dropped, only cleaned.
 *   - A block emptied by the edit is removed rather than left as a blank paragraph.
 *   - Block `_key`s and structure are preserved, so nothing re-orders.
 *
 *   pnpm tsx --env-file=.env.local scripts/strip-ai-voice.ts
 *   pnpm tsx --env-file=.env.local scripts/strip-ai-voice.ts --apply
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

/** The constructions that mark a sentence as generated rather than written. */
const TELL =
  /\bnot (just|merely|only)\b|\bmore than just\b|\belevat(e|es|ing|ed)\b|\bseamless(ly)?\b|\beffortless(ly)?\b|\bboasts?\b|\bwhether you(?:'re| are)\b|\bwhen it comes to\b|\btimeless (elegance|appeal|beauty|charm)\b|\bcurat(ed|ion)\b|\ba testament to\b|\bsparks? joy\b|\bbreathes? (new )?life into\b|\bmyriad|\bplethora\b|\bdelve\b|\bnestled\b|\bmeticulous(ly)?\b|\bat the end of the day\b|\bplays? an? (crucial|vital|pivotal|key|important) role\b|\bmoreover\b|\bfurthermore\b|\brest assured\b|\bin today'?s\b/i;

/** Anything concrete. A sentence carrying one of these is never deleted. */
const FACT =
  /\d|\bcm\b|\bmm\b|\bkg\b|\bg\b|\blitre|\bmetal\b|\bwood(en)?\b|\bglass\b|\bceramic\b|\bstone\b|\brattan\b|\bteak\b|\boak\b|\bmarble\b|\bbrass\b|\bsteel\b|\biron\b|\bbattery\b|\bbatteries\b|\bfabric\b|\bvelvet\b|\blinen\b|\bconcrete\b|\bresin\b|\bbamboo\b|\bmango\b|\bpine\b|\bwalnut\b|\bacacia\b/i;

/** Word-level swaps for sentences that carry facts and so cannot be dropped. */
const SWAPS: { re: RegExp; to: string }[] = [
  { re: /\bboasts\b/gi, to: "has" },
  { re: /\bboast\b/gi, to: "have" },
  { re: /\s*\bmeticulously\s+/gi, to: " " },
  { re: /\s*\bseamlessly\s+/gi, to: " " },
  { re: /\s*\beffortlessly\s+/gi, to: " " },
  { re: /\bensures that\b/gi, to: "means" },
  { re: /\bensures\b/gi, to: "means" },
  { re: /\bensure\b/gi, to: "make sure" },
  /**
   * The trailing participle clause, which is the single most persistent tell
   * left after the first two passes — 478 of them.
   *
   * "Each lantern is constructed to hold candles securely, ensuring safety
   * while offering a charming light source." The clause after the comma
   * restates the first half and adds nothing, which is exactly why generated
   * prose reaches for it. Cut to the sentence's own terminator so the full stop
   * survives.
   */
  { re: /,\s*ensuring\b[^.;!?]*/gi, to: "" },
  {
    re: /,\s*(?:thereby |thus )?(?:making|creating|providing|offering) it[^.;!?]{0,60}(?=[.;!?])/gi,
    to: "",
  },
  // Same trailing-clause shape as `ensuring`, different verb. "…, elevating the
  // overall look of the room" restates and adds nothing.
  { re: /,\s*elevat(?:ing|es?)\b[^.;!?]*/gi, to: "" },
  { re: /,\s*transform(?:ing|s)?\s+(?:your|any|the)\b[^.;!?]*/gi, to: "" },
  { re: /\belevates\b/gi, to: "lifts" },
  { re: /\belevate\b/gi, to: "lift" },
  { re: /\bseamless\b/gi, to: "smooth" },

  // British spellings. This is a UK shop selling to UK buyers, and "cozy"
  // reads as imported copy before it reads as anything else.
  { re: /\bcozy\b/gi, to: "cosy" },
  { re: /\bcenterpiece\b/gi, to: "centrepiece" },
  { re: /\bcentered\b/gi, to: "centred" },
  { re: /\bcenters\b/gi, to: "centres" },
  { re: /\bcenter\b/gi, to: "centre" },
  { re: /\bfibers\b/gi, to: "fibres" },
  { re: /\bfiber\b/gi, to: "fibre" },
  { re: /\borganiz(e|ed|es|ing|ation)\b/gi, to: "organis$1" },
  { re: /\bcolorful\b/gi, to: "colourful" },
  { re: /\bcolored\b/gi, to: "coloured" },
  { re: /\bcolors\b/gi, to: "colours" },
  { re: /\bcolor\b/gi, to: "colour" },
  { re: /\bfavorite\b/gi, to: "favourite" },
  { re: /\bnot only\b(.{1,90}?)\bbut(?: also)?\b/gi, to: "$1and" },
  { re: /\bnot just\b(.{1,90}?)\bbut(?: also)?\b/gi, to: "$1and" },
  { re: /\bambian?ce\b/gi, to: "feel" },
  { re: /\s*\btimeless (elegance|appeal|beauty|charm)\b/gi, to: "" },
  { re: /\bAdditionally,\s*/g, to: "" },
  { re: /\b(Moreover|Furthermore),\s*/g, to: "" },
];

const MIN_WORDS_AFTER = 60;

interface Block {
  _type?: string;
  _key?: string;
  style?: string;
  children?: { _type?: string; _key?: string; text?: string }[];
  [k: string]: unknown;
}

const wordCount = (blocks: Block[]) =>
  blocks
    .filter((b) => b._type === "block")
    .flatMap((b) => (b.children ?? []).map((c) => c.text ?? ""))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

function cleanSentence(s: string): string {
  let out = s;
  for (const { re, to } of SWAPS) out = out.replace(re, to);
  return out.replace(/\s{2,}/g, " ").replace(/\s+([.,;:])/g, "$1");
}

interface Change {
  slug: string;
  dropped: string[];
  swapped: number;
  before: number;
  after: number;
  summary?: string | null;
}

function rewrite(blocks: Block[]): {
  blocks: Block[];
  dropped: string[];
  swapped: number;
} {
  const dropped: string[] = [];
  let swapped = 0;
  const out: Block[] = [];

  for (const b of blocks) {
    if (b._type !== "block") {
      out.push(b);
      continue;
    }
    const isHeading = Boolean(b.style && b.style !== "normal");
    const children = b.children ?? [];
    const newChildren: typeof children = [];

    for (const child of children) {
      const text = child.text ?? "";
      if (!text.trim()) {
        newChildren.push(child);
        continue;
      }

      // Headings are cleaned but never deleted — losing one breaks the page's
      // structure and its h2s, which the FAQ and section markup depend on.
      if (isHeading) {
        const cleaned = cleanSentence(text);
        if (cleaned !== text) swapped++;
        newChildren.push({ ...child, text: cleaned });
        continue;
      }

      const sentences = text.split(/(?<=[.!?])\s+/);
      const kept: string[] = [];
      for (const s of sentences) {
        if (TELL.test(s) && !FACT.test(s)) {
          dropped.push(s.trim());
          continue;
        }
        const cleaned = cleanSentence(s);
        if (cleaned !== s) swapped++;
        kept.push(cleaned);
      }
      const joined = kept.join(" ").trim();
      if (joined) newChildren.push({ ...child, text: joined });
    }

    // A block left with nothing is removed rather than published as a blank
    // paragraph with a stray margin.
    const hasText = newChildren.some((c) => (c.text ?? "").trim());
    if (hasText) out.push({ ...b, children: newChildren });
  }
  return { blocks: out, dropped, swapped };
}

async function main() {
  const products = await client.fetch<
    {
      _id: string;
      slug: string;
      description: Block[] | null;
      summary: string | null;
    }[]
  >(
    `*[_type=="product" && !(_id in path("drafts.**")) && (defined(description) || defined(summary))]{
       _id, "slug": slug.current, description, summary }`,
  );
  console.log(`\n${products.length} products with a description.\n`);

  const changes: (Change & {
    _id: string;
    blocks: Block[];
    summary: string | null;
  })[] = [];
  const skipped: { slug: string; why: string; would: number }[] = [];

  for (const p of products) {
    const before = wordCount(p.description ?? []);
    const { blocks, dropped, swapped } = rewrite(p.description ?? []);

    /**
     * The summary gets the word-level swaps but never the sentence deletion.
     * It is one or two sentences doing the whole job on a listing card and in
     * a meta description — dropping one could leave it empty, and an empty
     * summary is a blank card.
     */
    let summary = p.summary ?? null;
    let summaryChanged = false;
    if (summary) {
      const cleaned = cleanSentence(summary).trim();
      if (cleaned !== summary && cleaned.length > 20) {
        summary = cleaned;
        summaryChanged = true;
      }
    }

    if (!dropped.length && !swapped && !summaryChanged) continue;
    const after = wordCount(blocks);
    if (after < MIN_WORDS_AFTER) {
      skipped.push({
        slug: p.slug,
        why: `would leave ${after} words`,
        would: before - after,
      });
      continue;
    }
    changes.push({
      _id: p._id,
      slug: p.slug,
      dropped,
      swapped,
      before,
      after,
      blocks,
      summary: summaryChanged ? summary : null,
    });
  }

  const totalDropped = changes.reduce((n, c) => n + c.dropped.length, 0);
  const totalSwapped = changes.reduce((n, c) => n + c.swapped, 0);
  const wordsBefore = changes.reduce((n, c) => n + c.before, 0);
  const wordsAfter = changes.reduce((n, c) => n + c.after, 0);

  console.log(`  ${changes.length} products would change`);
  console.log(
    `  ${totalDropped} sentences deleted, ${totalSwapped} phrases rewritten`,
  );
  console.log(
    `  ${wordsBefore.toLocaleString()} words -> ${wordsAfter.toLocaleString()} (${Math.round((1 - wordsAfter / wordsBefore) * 100)}% shorter)`,
  );
  console.log(
    `  ${skipped.length} skipped for being too short after the edit\n`,
  );

  console.log("SAMPLE OF DELETED SENTENCES\n");
  for (const c of changes.slice(0, 6))
    for (const d of c.dropped.slice(0, 2))
      console.log(`  ${c.slug.slice(0, 34).padEnd(36)} ${d.slice(0, 92)}`);

  if (skipped.length) {
    console.log(`\nSKIPPED — too short after the edit, left alone:\n`);
    for (const s of skipped.slice(0, 8))
      console.log(`  ${s.slug.padEnd(46)} ${s.why}`);
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-17-strip-ai-voice.json",
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        changed: changes.map(({ blocks: _b, ...rest }) => rest),
        skipped,
      },
      null,
      2,
    )}\n`,
  );

  if (!apply) return console.log("\nDry run — re-run with --apply.\n");
  let done = 0;
  for (const c of changes) {
    const patch: Record<string, unknown> = { description: c.blocks };
    if (c.summary) patch.summary = c.summary;
    await client.patch(c._id).set(patch).commit();
    if (++done % 100 === 0) console.log(`  ${done}/${changes.length}`);
  }
  console.log(`\nRewrote ${done} descriptions.\n`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
