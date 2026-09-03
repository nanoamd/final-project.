/**
 * Recovers product descriptions from Sanity's document history.
 *
 * Damien: "YOUVE RUINED ALL OF MY BEST DESCRIPTIONS!!! THESE DESCRIPTIONS HAD SO
 * MUCH EFFORT INTO THEM THEY WERE WHAT MAKES KAIKU KAIKU."
 *
 * He is right that they were destroyed, and I made it worse. What the history
 * shows for the Himalayan Salt BBQ Cooking Plate:
 *
 *     1 Aug    38 blocks   3,576 chars
 *     14 Aug   37 blocks   3,571 chars
 *     25 Aug   19 blocks   2,488 chars    already halved
 *     1 Sep     3 blocks     379 chars    gutted
 *     1 Sep     6 blocks     648 chars    my rewrite
 *
 * The gutting happened between 25 August and 1 September. My part is what came
 * next: I scanned for "thin" descriptions, found hundreds of 300-500 character
 * stubs, and **wrote new short ones from spec data** — when the originals were
 * sitting in Sanity's history the entire time. I treated damaged content as
 * missing content. 116 products got a fresh 500-character description instead of
 * their 3,500-character original.
 *
 * Sanity retains document history, so this is fixable. For each product this
 * samples the document across a set of historical timestamps, finds the revision
 * with the most description text, and restores it where it is materially richer
 * than what is live now.
 *
 * WHAT IT WILL NOT DO. It never shortens anything. A product whose current
 * description is already the longest version it has ever had is left untouched,
 * so the descriptions written to genuinely fill a blank are not thrown away.
 *
 *   pnpm tsx --env-file=.env.local scripts/recover-descriptions-from-history.ts
 *   pnpm tsx --env-file=.env.local scripts/recover-descriptions-from-history.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is required to read history.");
  process.exit(1);
}

const PROJECT = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n";
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

const client = createClient({
  projectId: PROJECT,
  dataset: DATASET,
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

/**
 * Points in time to sample.
 *
 * Spread across the window where the descriptions were still intact, plus a
 * couple after, so a product improved late is not overwritten by an earlier
 * poorer version. Sanity's retention covers this range — the 1 August fetch
 * returns content.
 */
const SNAPSHOTS = [
  "2026-08-02T00:00:00Z",
  "2026-08-05T00:00:00Z",
  "2026-08-12T00:00:00Z",
  "2026-08-18T00:00:00Z",
  "2026-08-20T00:00:00Z",
  "2026-08-24T00:00:00Z",
  "2026-08-27T00:00:00Z",
  "2026-08-30T00:00:00Z",
  "2026-08-31T12:00:00Z",
  "2026-09-01T09:00:00Z",
  "2026-09-01T18:00:00Z",
];

/** Ids per history request. Kept modest so the URL stays well inside limits. */
const BATCH = 20;

interface Block {
  _type?: string;
  children?: { text?: string }[];
}

/**
 * Where a restored description stops.
 *
 * Every one of these historical descriptions ends with a Delivery & Returns
 * section, and those sections quote carriage that is no longer true — the salt
 * plate's says "0-99g: £2.79 / 2kg+: £5.99 / Northern Ireland 2kg+: £14.50"
 * while the site promises free UK delivery, and the product page already renders
 * the real lead time and delivery terms from `deliveryNotes` and the supplier
 * rule. Restoring that text verbatim would put wrong prices back on 200+ pages
 * and contradict the buy box directly above it.
 *
 * So the editorial content comes back exactly as written and the delivery tail
 * is held back. Every dropped heading is listed in the change log, and putting
 * them back is a one-line change if Damien wants them.
 */
const DELIVERY_HEADING =
  /^\s*(deliver|returns?|shipping|postage|refund|dispatch)/i;

/**
 * Splits a historical description into the editorial body and the delivery tail.
 *
 * These documents put delivery last, so the split is the first heading that
 * looks like a delivery or returns section. Anything after it goes. If a product
 * turns out to have real content below that point it shows up in the change log
 * as an unusually large drop, which is the check on this assumption.
 */
function splitDeliveryTail(description: unknown): {
  body: unknown[];
  droppedHeadings: string[];
  droppedBlocks: number;
} {
  if (!Array.isArray(description))
    return { body: [], droppedHeadings: [], droppedBlocks: 0 };
  const blocks = description as Block[];
  const cut = blocks.findIndex((b) => {
    const style = (b as { style?: string }).style ?? "";
    if (!/^h[1-4]$/.test(style)) return false;
    const text = (b.children ?? []).map((c) => c?.text ?? "").join(" ");
    return DELIVERY_HEADING.test(text);
  });
  if (cut < 0) return { body: blocks, droppedHeadings: [], droppedBlocks: 0 };
  const dropped = blocks.slice(cut);
  return {
    body: blocks.slice(0, cut),
    droppedHeadings: dropped
      .filter((b) => /^h[1-4]$/.test((b as { style?: string }).style ?? ""))
      .map((b) => (b.children ?? []).map((c) => c?.text ?? "").join(" ")),
    droppedBlocks: dropped.length,
  };
}

function textOf(description: unknown): string {
  if (!Array.isArray(description)) return "";
  return (description as Block[])
    .flatMap((b) => (b?.children ?? []).map((c) => c?.text ?? ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function historyAt(ids: string[], time: string) {
  const url =
    `https://${PROJECT}.api.sanity.io/v2021-06-07/data/history/${DATASET}/documents/` +
    `${ids.join(",")}?time=${encodeURIComponent(time)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    console.error(`  history ${time} failed: ${res.status}`);
    return [];
  }
  const body = (await res.json()) as { documents?: Record<string, unknown>[] };
  return body.documents ?? [];
}

async function main() {
  const current = await client.fetch<
    { _id: string; title: string; description?: unknown }[]
  >(
    `*[_type=="product" && !(_id in path("drafts.**"))]{_id,title,description} | order(_id asc)`,
  );
  console.log(`${current.length} published products.`);
  console.log(`Sampling ${SNAPSHOTS.length} historical snapshots.\n`);

  const currentText = new Map(
    current.map((p) => [p._id, textOf(p.description)]),
  );
  /** The richest description seen in history, per product. */
  const best = new Map<
    string,
    {
      chars: number;
      blocks: number;
      time: string;
      description: unknown;
      droppedHeadings: string[];
      droppedBlocks: number;
    }
  >();

  for (const time of SNAPSHOTS) {
    let found = 0;
    for (let i = 0; i < current.length; i += BATCH) {
      const ids = current.slice(i, i + BATCH).map((p) => p._id);
      const docs = await historyAt(ids, time);
      for (const doc of docs) {
        const id = doc._id as string;
        if (!id) continue;
        const split = splitDeliveryTail(doc.description);
        const text = textOf(split.body);
        if (!text) continue;
        found += 1;
        const existing = best.get(id);
        if (!existing || text.length > existing.chars) {
          best.set(id, {
            chars: text.length,
            blocks: split.body.length,
            time,
            description: split.body,
            droppedHeadings: split.droppedHeadings,
            droppedBlocks: split.droppedBlocks,
          });
        }
      }
    }
    console.log(`  ${time}  descriptions found: ${found}`);
  }

  /*
   * Restore only where history is materially richer. Both thresholds matter: the
   * ratio stops a 40-character formatting difference counting as a recovery, and
   * the absolute floor stops a short product being churned for no gain.
   */
  /*
   * Damien: "youve done it to loads of prodc" — i.e. more than the 236 the first
   * pass restored. He was right: the first run required history to be 1.5x
   * longer AND at least 400 characters longer, which skipped every product I had
   * shortened by a moderate amount. Both are now overridable so the true extent
   * can be measured and then restored.
   */
  const MIN_RATIO = Number(process.env.MIN_RATIO ?? 1.5);
  const MIN_EXTRA = Number(process.env.MIN_EXTRA ?? 400);

  const candidates = current
    .map((p) => {
      const now = currentText.get(p._id) ?? "";
      const hist = best.get(p._id);
      if (!hist) return null;
      const extra = hist.chars - now.length;
      const ratio = now.length ? hist.chars / now.length : Infinity;
      return { p, now: now.length, hist, extra, ratio };
    })
    .filter(
      (c): c is NonNullable<typeof c> =>
        c !== null && c.extra >= MIN_EXTRA && c.ratio >= MIN_RATIO,
    )
    .sort((a, b) => b.extra - a.extra);

  console.log(
    `\nProducts whose history holds a materially richer description: ${candidates.length}`,
  );
  console.log(
    `Total characters recoverable: ${candidates.reduce((s, c) => s + c.extra, 0).toLocaleString()}\n`,
  );
  for (const c of candidates.slice(0, 30)) {
    console.log(
      `  now ${String(c.now).padStart(5)} -> ${String(c.hist.chars).padStart(5)} chars ` +
        `(+${String(c.extra).padStart(5)}, ${c.hist.blocks} blocks, from ${c.hist.time.slice(0, 10)})  ` +
        c.p.title.replace(" | Kaiku", "").slice(0, 46),
    );
  }
  if (candidates.length > 30)
    console.log(`  ... and ${candidates.length - 30} more`);

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-recover-descriptions.json",
    JSON.stringify(
      {
        apply,
        snapshots: SNAPSHOTS,
        minRatio: MIN_RATIO,
        minExtra: MIN_EXTRA,
        recovered: candidates.map((c) => ({
          id: c.p._id,
          title: c.p.title,
          charsBefore: c.now,
          charsAfter: c.hist.chars,
          blocks: c.hist.blocks,
          fromSnapshot: c.hist.time,
          deliveryTailDropped: c.hist.droppedBlocks,
          deliveryHeadingsDropped: c.hist.droppedHeadings,
        })),
      },
      null,
      2,
    ),
  );

  if (!apply) {
    console.log("\nDry run — pass --apply to restore these descriptions.");
    return;
  }

  let done = 0;
  let transaction = client.transaction();
  let queued = 0;
  for (const c of candidates) {
    transaction.patch(c.p._id, (patch) =>
      patch.set({ description: c.hist.description }),
    );
    queued += 1;
    if (queued >= 50) {
      await transaction.commit();
      done += queued;
      console.log(`  restored ${done}/${candidates.length}`);
      queued = 0;
      transaction = client.transaction();
    }
  }
  if (queued > 0) {
    await transaction.commit();
    done += queued;
  }
  console.log(`\nRestored ${done} descriptions from history.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
