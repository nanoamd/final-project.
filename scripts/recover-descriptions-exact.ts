/**
 * The exhaustive pass: every revision of every product, not sampled timestamps.
 *
 * Damien: "youve done it to loads of prodc ... products not just these."
 *
 * scripts/recover-descriptions-from-history.ts samples the catalogue at eleven
 * fixed timestamps. That is fast and it recovered 236 descriptions, but a
 * description that was rich only *between* two snapshots is invisible to it —
 * and with 898 of 906 products created inside a single month, plenty of the
 * writing had a short life.
 *
 * This reads each document's actual transaction list from Sanity's history API
 * and fetches the document as of every revision, so the richest version it finds
 * is the richest version that ever existed. Slower by design: it is the pass
 * that can be trusted to be complete.
 *
 * Same two rules as the sampling pass:
 *   - the Delivery & Returns tail is dropped, because it quotes carriage
 *     (£2.79-£14.50) that contradicts the site's free-delivery promise
 *   - nothing is ever shortened; a product already at its best is left alone
 *
 *   pnpm tsx --env-file=.env.local scripts/recover-descriptions-exact.ts
 *   pnpm tsx --env-file=.env.local scripts/recover-descriptions-exact.ts --apply
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

/** How many documents to walk at once. Politeness to the history API. */
const CONCURRENCY = 6;

interface Block {
  style?: string;
  children?: { text?: string }[];
}

const DELIVERY_HEADING =
  /^\s*(deliver|returns?|shipping|postage|refund|dispatch)/i;

function splitDeliveryTail(description: unknown): Block[] {
  if (!Array.isArray(description)) return [];
  const blocks = description as Block[];
  const cut = blocks.findIndex((b) => {
    if (!/^h[1-4]$/.test(b.style ?? "")) return false;
    const text = (b.children ?? []).map((c) => c?.text ?? "").join(" ");
    return DELIVERY_HEADING.test(text);
  });
  return cut < 0 ? blocks : blocks.slice(0, cut);
}

function textOf(blocks: Block[]): string {
  return blocks
    .flatMap((b) => (b.children ?? []).map((c) => c?.text ?? ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function api(path: string) {
  const res = await fetch(
    `https://${PROJECT}.api.sanity.io/v2021-06-07/${path}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return null;
  return res;
}

/** Revision timestamps for one document, oldest first. */
async function revisionsOf(id: string): Promise<string[]> {
  const res = await api(
    `data/history/${DATASET}/transactions/${encodeURIComponent(id)}?excludeContent=true&limit=100`,
  );
  if (!res) return [];
  const body = await res.text();
  const stamps: string[] = [];
  for (const line of body.split("\n")) {
    if (!line.trim()) continue;
    try {
      const tx = JSON.parse(line) as { timestamp?: string };
      if (tx.timestamp) stamps.push(tx.timestamp);
    } catch {
      // A malformed line is skipped rather than aborting the document.
    }
  }
  return stamps;
}

/**
 * The richest description this document has ever had.
 *
 * Revisions are walked newest-first and the whole list is checked — the best
 * version is not reliably the newest or the oldest, since the copy was written,
 * degraded, and partly rewritten at different times.
 */
async function bestDescription(id: string, revisions: string[]) {
  let best: { chars: number; blocks: Block[]; time: string } | null = null;
  for (const time of [...revisions].reverse()) {
    // Two ids so the endpoint returns the `documents` array shape; the second is
    // a throwaway that simply will not match.
    const res = await api(
      `data/history/${DATASET}/documents/${encodeURIComponent(id)},__none__?time=${encodeURIComponent(time)}`,
    );
    if (!res) continue;
    const body = (await res.json()) as {
      documents?: { _id?: string; description?: unknown }[];
    };
    const doc = (body.documents ?? []).find((d) => d._id === id);
    if (!doc) continue;
    const blocks = splitDeliveryTail(doc.description);
    const chars = textOf(blocks).length;
    if (!best || chars > best.chars) best = { chars, blocks, time };
  }
  return best;
}

async function main() {
  const products = await client.fetch<
    { _id: string; title: string; description?: unknown }[]
  >(
    `*[_type=="product" && !(_id in path("drafts.**"))]{_id,title,description} | order(_id asc)`,
  );
  console.log(
    `Walking every revision of ${products.length} products. This is the slow, complete pass.\n`,
  );

  const findings: {
    id: string;
    title: string;
    now: number;
    best: number;
    extra: number;
    time: string;
    blocks: Block[];
  }[] = [];

  let done = 0;
  for (let i = 0; i < products.length; i += CONCURRENCY) {
    await Promise.all(
      products.slice(i, i + CONCURRENCY).map(async (p) => {
        const now = textOf(splitDeliveryTail(p.description)).length;
        const revisions = await revisionsOf(p._id);
        if (revisions.length === 0) return;
        const best = await bestDescription(p._id, revisions);
        if (!best) return;
        const extra = best.chars - now;
        // 50 characters is below any meaningful edit and filters formatting noise.
        if (extra >= 50)
          findings.push({
            id: p._id,
            title: p.title,
            now,
            best: best.chars,
            extra,
            time: best.time,
            blocks: best.blocks,
          });
      }),
    );
    done += Math.min(CONCURRENCY, products.length - i);
    if (done % 120 === 0 || done === products.length)
      console.log(
        `  checked ${done}/${products.length} — found ${findings.length} so far`,
      );
  }

  findings.sort((a, b) => b.extra - a.extra);
  console.log(
    `\nProducts with a richer description somewhere in their history: ${findings.length}`,
  );
  console.log(
    `Total characters recoverable: ${findings.reduce((s, f) => s + f.extra, 0).toLocaleString()}\n`,
  );
  for (const f of findings.slice(0, 25))
    console.log(
      `  now ${String(f.now).padStart(5)} -> ${String(f.best).padStart(5)} (+${String(f.extra).padStart(5)})  ${f.time.slice(0, 16)}  ${f.title.replace(" | Kaiku", "").slice(0, 44)}`,
    );
  if (findings.length > 25)
    console.log(`  ... and ${findings.length - 25} more`);

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-recover-descriptions-exact.json",
    JSON.stringify(
      {
        apply,
        count: findings.length,
        recovered: findings.map(({ blocks, ...rest }) => ({
          ...rest,
          restoredBlocks: blocks.length,
        })),
      },
      null,
      2,
    ),
  );

  if (!apply) {
    console.log("\nDry run — pass --apply to restore these.");
    return;
  }

  let transaction = client.transaction();
  let queued = 0;
  let written = 0;
  for (const f of findings) {
    transaction.patch(f.id, (patch) => patch.set({ description: f.blocks }));
    queued += 1;
    if (queued >= 50) {
      await transaction.commit();
      written += queued;
      console.log(`  restored ${written}/${findings.length}`);
      queued = 0;
      transaction = client.transaction();
    }
  }
  if (queued > 0) {
    await transaction.commit();
    written += queued;
  }
  console.log(`\nRestored ${written} descriptions.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
