/**
 * Finds drafts that would make a live page worse if published.
 *
 * Found while reading the Reclaimed Teak Dining Table, which Damien pointed at
 * as the standard to aim for. Its published version is genuinely good — 679
 * words, not one "not specified". Sitting on top of it was an unpublished draft
 * of 354 words carrying four of them, which would replace the good page the
 * moment anybody pressed Publish in Studio.
 *
 * It is not one product. **90 of the 94 products holding both a published
 * version and a draft are worse in draft. None is better.** The regenerated
 * copy is uniformly shorter and full of admissions that nobody checked, which
 * makes Studio's Publish button a trap on those rows.
 *
 * Read-only. Worth running before publishing anything in bulk.
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-draft-regressions.ts
 */
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

interface Block {
  _type?: string;
  children?: { text?: string }[];
}

function plainText(description: unknown): string {
  if (!Array.isArray(description)) return "";
  return (description as Block[])
    .filter((b) => b?._type === "block")
    .map((b) => (b.children ?? []).map((c) => c?.text ?? "").join(""))
    .join("\n");
}

/** An admission that nobody looked the fact up. */
const UNKNOWN = /not (?:specified|listed|provided|detailed|stated)/gi;

interface Row {
  _id: string;
  title?: string;
  description?: unknown;
  faqs?: { answer?: string }[];
  _updatedAt: string;
}

function measure(row: Row) {
  const body = plainText(row.description);
  const everything = `${body} ${(row.faqs ?? []).map((f) => f?.answer ?? "").join(" ")}`;
  return {
    words: body.split(/\s+/).filter(Boolean).length,
    unknown: (everything.match(UNKNOWN) ?? []).length,
  };
}

async function main() {
  const rows: Row[] = await client.fetch(
    `*[_type == "product"]{ _id, title, description, faqs, _updatedAt }`,
  );

  const published = new Map<string, Row>();
  const drafts = new Map<string, Row>();
  for (const row of rows) {
    const base = row._id.replace(/^drafts\./, "");
    (row._id.startsWith("drafts.") ? drafts : published).set(base, row);
  }

  let worse = 0;
  let better = 0;
  let same = 0;
  const risky: {
    title: string;
    liveWords: number;
    draftWords: number;
    liveUnknown: number;
    draftUnknown: number;
  }[] = [];

  for (const [base, draft] of drafts) {
    const live = published.get(base);
    if (!live) continue;
    const d = measure(draft);
    const p = measure(live);

    // Worse means either more admissions of ignorance, or a substantial loss of
    // content from a page that already had plenty. A draft that is merely
    // shorter than a thin page is not a regression worth reporting.
    const isWorse =
      d.unknown > p.unknown || (p.words > 300 && d.words < p.words * 0.6);
    if (isWorse) {
      worse++;
      risky.push({
        title: live.title ?? base,
        liveWords: p.words,
        draftWords: d.words,
        liveUnknown: p.unknown,
        draftUnknown: d.unknown,
      });
    } else if (d.unknown < p.unknown) better++;
    else same++;
  }

  const pairs = [...drafts].filter(([base]) => published.has(base)).length;
  console.log(`\nProducts with both a published version and a draft: ${pairs}`);
  console.log(`  draft is WORSE than what is live: ${worse}`);
  console.log(`  draft is better:                  ${better}`);
  console.log(`  about the same:                   ${same}`);

  if (!risky.length) {
    console.log("\nNothing to worry about.");
    return;
  }

  console.log(`\n──── publishing these would degrade a live page ────`);
  risky.sort(
    (a, b) => b.draftUnknown - b.liveUnknown - (a.draftUnknown - a.liveUnknown),
  );
  for (const item of risky) {
    console.log(
      `  ${item.title.slice(0, 46).padEnd(48)} live ${item.liveWords}w/${item.liveUnknown} unknown  →  draft ${item.draftWords}w/${item.draftUnknown} unknown`,
    );
  }
  console.log(
    `\nDo not bulk-publish. Discard the draft in Studio to keep the live page.`,
  );
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
