/**
 * Removes the traces of how the product copy was drafted.
 *
 * All of this is live on the site. In rough order of damage:
 *
 *   1. Eight outbound links, every one carrying `?utm_source=chatgpt.com`. Four go
 *      to didesigns.co.uk — our own trade supplier — and two go to sooxos.co.uk and
 *      cplights.com, who retail the same items. A shopper following one lands on a
 *      page selling the thing they were about to buy from us. The link mark is
 *      removed and the sentence kept: the copy reads fine, it just should not be a
 *      link.
 *
 *   2. Retailer names appended to sentences as citation labels — "…built to stand
 *      the test of time. DI Designs", "Weight: 30 kg DI Designs", "Assembly: No
 *      assembly required SOOXOS". Stripped from the end of the line.
 *
 *   3. Notes to ourselves that were never copy: "Please use the dimensions listed
 *      on the official D.I. Designs product page for this item." — on a live
 *      product page, which also means those dimensions were never checked.
 *
 *   4. A pasted assistant reply at the top of the Wadborough sofa description,
 *      beginning "Absolutely. This is the style I'd move Kaiku towards…".
 *
 *   5. The supplier named in prose. D.I. Designs is trade-only, so naming them
 *      tells a shopper where to look and tells them we are not the maker.
 *
 * Every rule is a literal, listed below, rather than a general pattern — a broad
 * regex over live product copy deletes a sentence somebody wrote on purpose.
 *
 * Whole-array rewrite, as elsewhere: Portable Text has no stable path to "block N".
 *
 * Dry run by default; --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/strip-copy-artefacts.ts
 */
import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

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

interface Span {
  _type?: string;
  _key?: string;
  text?: string;
  marks?: string[];
}

interface Block {
  _type?: string;
  _key?: string;
  style?: string;
  listItem?: string;
  children?: Span[];
  markDefs?: { _key?: string; _type?: string; href?: string }[];
}

const blockText = (b: Block) =>
  (b.children ?? [])
    .map((c) => c.text ?? "")
    .join("")
    .trim();

/** Whole blocks to delete. Matched on how the line starts, so a trailing edit
 *  does not stop it matching, but never on a fragment that could appear inside
 *  real copy. */
const DELETE_BLOCKS: RegExp[] = [
  /^Please use the dimensions (listed|provided)/i,
  /^Dimensions taken from the supplier specification/i,
  /^Supplier\s*:\s*D\.?I\.? Designs\s*$/i,
  /^Absolutely\. This is the style I'd move Kaiku towards/i,
];

/** Citation labels appended to the end of a line as plain text. */
const TRAILING_CREDIT =
  /[\s.]*\b(DI Designs|D\.I\. Designs|SOOXOS|Sooxos|Cp Lighting|CP Lights|Cplights)\s*\.?\s*$/;

/** Phrases removed from inside a sentence, leaving the sentence standing. */
const INLINE_REMOVALS: [RegExp, string][] = [
  [/\s+from D\.?I\.? Designs\b/gi, ""],
  [
    /\bthe official D\.?I\.? Designs product (page|specification)\b/gi,
    "the supplier specification",
  ],
];

async function main() {
  const docs = await client.fetch<
    { _id: string; title: string; description: Block[] | null }[]
  >(
    `*[_type == "product" && defined(description)]{_id, title, description}|order(title asc)`,
  );

  let linksRemoved = 0;
  let blocksDeleted = 0;
  let textEdits = 0;
  let touched = 0;

  for (const doc of docs) {
    const body = doc.description ?? [];
    const changes: string[] = [];

    const next: Block[] = [];
    for (const block of body) {
      if (block._type !== "block") {
        next.push(block);
        continue;
      }

      const original = blockText(block);

      // Blank paragraphs left over from the original paste. They render as an
      // empty <p> with margins, which is part of why the pages read as loose
      // blocks of text with arbitrary gaps.
      if (!original) {
        changes.push("deleted:  blank paragraph (was already empty)");
        blocksDeleted++;
        continue;
      }

      if (DELETE_BLOCKS.some((re) => re.test(original))) {
        changes.push(`deleted:  "${original.slice(0, 78)}"`);
        blocksDeleted++;
        continue;
      }

      let edited = { ...block };

      // Drop every link definition and the marks pointing at it. Each of the
      // eight is a citation to an external retailer; none is a link we want.
      const linkKeys = (edited.markDefs ?? [])
        .filter((d) => d._type === "link" && d.href)
        .map((d) => d._key);
      if (linkKeys.length) {
        for (const def of edited.markDefs ?? [])
          if (def._type === "link" && def.href)
            changes.push(`unlinked: ${def.href.slice(0, 66)}`);
        linksRemoved += linkKeys.length;
        edited = {
          ...edited,
          markDefs: (edited.markDefs ?? []).filter(
            (d) => !(d._type === "link" && d.href),
          ),
          children: (edited.children ?? []).map((span) => ({
            ...span,
            marks: (span.marks ?? []).filter((m) => !linkKeys.includes(m)),
          })),
        };
      }

      // Text edits apply to the last span for a trailing credit, and to every
      // span for an inline removal, so a sentence split across spans still works.
      const children = [...(edited.children ?? [])];
      if (children.length) {
        const lastIndex = children.length - 1;
        const last = children[lastIndex]!;
        const trimmed = (last.text ?? "").replace(TRAILING_CREDIT, "");
        if (trimmed !== (last.text ?? "")) {
          changes.push(
            `uncredited: "…${(last.text ?? "").slice(-46)}" → "…${trimmed.slice(-32)}"`,
          );
          children[lastIndex] = { ...last, text: trimmed };
          textEdits++;
        }
      }
      for (let i = 0; i < children.length; i++) {
        let value = children[i]!.text ?? "";
        for (const [re, replacement] of INLINE_REMOVALS)
          value = value.replace(re, replacement);
        if (value !== (children[i]!.text ?? "")) {
          changes.push(`reworded: "${value.slice(0, 74)}"`);
          children[i] = { ...children[i]!, text: value };
          textEdits++;
        }
      }
      edited = { ...edited, children };

      // A block whose only content was a credit is now empty; drop it rather than
      // leave a blank paragraph behind.
      if (!blockText(edited)) {
        changes.push(`deleted:  paragraph emptied by the edits above`);
        blocksDeleted++;
        continue;
      }

      next.push(edited);
    }

    if (!changes.length) continue;

    console.log(
      `\n${apply ? "✓" : "·"} ${doc._id.startsWith("drafts.") ? "draft" : "live "} ${doc.title.slice(0, 52)}`,
    );
    for (const c of changes) console.log(`    ${c}`);

    if (apply) await client.patch(doc._id).set({ description: next }).commit();
    touched++;
  }

  console.log(
    `\n${linksRemoved} link(s), ${blocksDeleted} block(s) and ${textEdits} text edit(s) ` +
      `across ${touched} document(s) ${apply ? "fixed" : "to fix"}.` +
      (apply ? "\n" : "\nDry run — nothing written. Re-run with --apply.\n"),
  );
}

main().catch((err) => {
  console.error("strip-copy-artefacts failed:", err);
  process.exit(1);
});
