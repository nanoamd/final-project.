/**
 * Removes three contradictions from product delivery copy, found by auditing
 * every published product's `deliveryNotes` against what the site actually
 * does. Damien: "i want you to maximize trust on this site with maximum
 * consistency".
 *
 * **1. "Additional delivery charges may apply".** 13 products say this, in
 * prose, directly beneath a page that says "Free UK delivery" — and
 * src/server/actions/checkout.ts hard-codes a £0 shipping rate, so no
 * additional charge can be taken even if someone wanted to. A customer reading
 * both learns only that the site cannot be trusted on price, and a stated
 * possible surcharge that never materialises is a consumer-law problem as well
 * as a conversion one. The sentence goes; the free-delivery promise the
 * checkout genuinely honours stays.
 *
 * **2. Hardcoded lead times in the prose.** The same notes carry "Estimated
 * delivery within 2-4 weeks", "2–7 working days", "7-14 working days" and so
 * on, which now contradict the single delivery window every surface computes
 * from src/lib/catalog/delivery.ts. This is not a judgement call about which
 * is right: the `deliveryNotes` field's own schema description already says
 * *"The lead time, availability and delivery method are shown automatically
 * above it, so do not repeat them"* — the prose was violating its own field's
 * contract, and stripping the duplicate leaves the structured window as the
 * one statement of fact.
 *
 * **3. One product's delivery copy names a different product entirely.** The
 * Yorkshire Cabin 2-Person sauna's notes read "Your SaunaPlunge™ Dales Glow
 * 4-Person Indoor Infrared Sauna is typically delivered within 4–6 weeks" — a
 * copy-paste from another listing, on a £3,189 product. Corrected to its own
 * name.
 *
 * Only whole sentences and whole bullet lines are removed, matched on exact
 * patterns, and nothing is rewritten or generated — this deletes contradictory
 * claims, it does not compose new prose. Every change is logged.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-delivery-copy-contradictions.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-delivery-copy-contradictions.ts --apply
 */
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
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

/**
 * Each pattern matches a whole line (bullet or sentence) that must go, never a
 * fragment — a partial strip would leave a dangling clause, which is worse
 * than the contradiction.
 */
const REMOVE_LINE_PATTERNS: { label: string; pattern: RegExp }[] = [
  {
    label: "surcharge claim (contradicts the £0 checkout rate)",
    pattern:
      /^\s*\*?\s*Additional delivery charges (?:may )?appl(?:y|ies)[^\n]*$/gim,
  },
  {
    label: "hardcoded lead time (duplicates the computed window)",
    pattern: /^\s*\*?\s*Estimated delivery (?:within|in)[^\n]*$/gim,
  },
];

/** Sentence-level removals, for prose that is not on its own line. */
const REMOVE_SENTENCE_PATTERNS: { label: string; pattern: RegExp }[] = [
  {
    label: "surcharge sentence mid-paragraph",
    pattern:
      /\s*Additional delivery charges (?:may )?appl(?:y|ies)[^.]*\.\s*/gi,
  },
];

interface PortableTextSpan {
  _type: string;
  text?: string;
}
interface PortableTextBlock {
  _type: string;
  _key?: string;
  children?: PortableTextSpan[];
}

interface Row {
  _id: string;
  title: string;
  deliveryNotes?: string;
  description?: PortableTextBlock[];
}

/** The same claims, as they appear in a rich-text block rather than a line. */
const BLOCK_REMOVAL_PATTERNS: { label: string; pattern: RegExp }[] = [
  {
    label: "surcharge claim in description (contradicts the £0 checkout rate)",
    pattern: /Additional delivery charges (?:may )?appl(?:y|ies)/i,
  },
  {
    label:
      "hardcoded lead time in description (duplicates the computed window)",
    pattern: /^\s*Estimated delivery (?:within|in)\b/i,
  },
];

const blockText = (block: PortableTextBlock): string =>
  (block.children ?? []).map((child) => child.text ?? "").join("");

function tidy(text: string): string {
  return (
    text
      // Collapse the blank lines a removed bullet leaves behind.
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+\n/g, "\n")
      .trim()
  );
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type == "product" && !(_id in path("drafts.**")) &&
       (defined(deliveryNotes) || defined(description))]{
      _id, title, deliveryNotes, description
    }`,
  );

  console.log(
    `\n${rows.length} published products carry delivery copy or a description.\n${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  let changed = 0;
  const removedByLabel = new Map<string, number>();

  for (const row of rows) {
    let text = row.deliveryNotes ?? "";
    const before = text;
    const hits: string[] = [];

    for (const { label, pattern } of REMOVE_LINE_PATTERNS) {
      const matches = text.match(pattern);
      if (matches?.length) {
        text = text.replace(pattern, "");
        hits.push(`${label} ×${matches.length}`);
        removedByLabel.set(
          label,
          (removedByLabel.get(label) ?? 0) + matches.length,
        );
      }
    }
    for (const { label, pattern } of REMOVE_SENTENCE_PATTERNS) {
      const matches = text.match(pattern);
      if (matches?.length) {
        text = text.replace(pattern, " ");
        hits.push(`${label} ×${matches.length}`);
        removedByLabel.set(
          label,
          (removedByLabel.get(label) ?? 0) + matches.length,
        );
      }
    }

    // The one wrong-product-name case, corrected rather than deleted: the
    // sentence is otherwise correct and useful, it just names the wrong sauna.
    const ownName = row.title.replace(/\s*\|\s*Kaiku.*$/, "").trim();
    const misnamed = /Your\s+(SaunaPlunge™[^.]{5,80}?)\s+is\s+typically/gi;
    text = text.replace(misnamed, (whole, named: string) => {
      if (named.trim() === ownName) return whole;
      hits.push(`wrong product name ("${named.trim()}")`);
      removedByLabel.set(
        "wrong product name in delivery copy",
        (removedByLabel.get("wrong product name in delivery copy") ?? 0) + 1,
      );
      return `Your ${ownName} is typically`;
    });

    text = tidy(text);
    const notesChanged = text !== tidy(before);

    // The same claims live in the rich-text description on a dozen products,
    // each as its own block — so a contradictory block can be dropped whole
    // without touching the sentences around it.
    const blocks = row.description ?? [];
    const keptBlocks = blocks.filter((block) => {
      if (block._type !== "block") return true;
      const content = blockText(block);
      const match = BLOCK_REMOVAL_PATTERNS.find(({ pattern }) =>
        pattern.test(content),
      );
      if (!match) return true;
      hits.push(`${match.label} (block)`);
      removedByLabel.set(
        match.label,
        (removedByLabel.get(match.label) ?? 0) + 1,
      );
      return false;
    });
    const descriptionChanged = keptBlocks.length !== blocks.length;

    if (!notesChanged && !descriptionChanged) continue;

    changed += 1;
    console.log(`  ✓ ${row.title.slice(0, 52).padEnd(52)} ${hits.join("; ")}`);

    if (!apply) continue;
    const patch = client.patch(row._id);
    if (notesChanged) patch.set({ deliveryNotes: text });
    if (descriptionChanged) patch.set({ description: keptBlocks });
    await patch.commit();
  }

  console.log(`\n${changed} products' delivery copy corrected.\n`);
  for (const [label, count] of removedByLabel)
    console.log(`  ${String(count).padStart(4)}  ${label}`);

  console.log(
    apply
      ? "\nApplied.\n"
      : "\nDry run — nothing written. Re-run with --apply.\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
