/**
 * Puts newly published products at the front of their category.
 *
 * Damien: _"also put all new products at the top of the list. ones weve
 * discussed publishing today"_.
 *
 * Category grids sort cheapest-first, which was a deliberate change and still
 * the right default — it stops a category opening on a price that reads as
 * "not for me". `displayOrder` is the override that lets a few pieces lead, and
 * a product that has just gone live is exactly the case it was built for.
 *
 * TWO THINGS THAT MAKE THIS SAFE TO RUN REPEATEDLY.
 *
 * First, it only ever pins products PUBLISHED inside the window, judged by the
 * published document's own `_createdAt`. That matters here specifically: 895 of
 * the 907 products in the catalogue were created inside 45 days, because that
 * is when the catalogue was built rather than because they are new. A generous
 * window would pin almost the whole shop, which is the same as pinning nothing.
 * Seven days only ever catches products somebody actually put live.
 *
 * Second, it remembers what it pinned, in `docs/change-log/pinned-new-arrivals.json`,
 * and unpins only those ids when they age out. Damien's own hand-set pins are
 * never touched, because the script has no record of setting them. Without that
 * file the only way to expire a pin would be to clear every displayOrder in
 * some reserved range, which would quietly undo merchandising decisions that
 * took thought.
 *
 *   pnpm tsx --env-file=.env.local scripts/pin-new-arrivals.ts
 *   pnpm tsx --env-file=.env.local scripts/pin-new-arrivals.ts --apply
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

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
  perspective: "raw",
});

/** How long a product counts as new. See the note above on why it is short. */
const WINDOW_DAYS = 7;

/**
 * The most that lead any one category.
 *
 * Past three or four, "new arrivals at the top" stops being merchandising and
 * becomes the sort order, and the cheapest-first run underneath — which is
 * what stops a category opening on a price nobody wants — disappears.
 */
const MAX_PER_CATEGORY = 4;

const STATE_FILE = "docs/change-log/pinned-new-arrivals.json";

interface State {
  /** Product ids this script pinned, and nothing else. */
  pinned: string[];
}

function readState(): State {
  if (!existsSync(STATE_FILE)) return { pinned: [] };
  try {
    const parsed = JSON.parse(readFileSync(STATE_FILE, "utf8")) as State;
    return { pinned: Array.isArray(parsed.pinned) ? parsed.pinned : [] };
  } catch {
    // A corrupt state file must not cause the script to unpin nothing and then
    // pin more on top — that is how everything ends up pinned. Stop instead.
    console.error(`${STATE_FILE} is not readable JSON. Fix or delete it.`);
    process.exit(1);
  }
}

interface Row {
  _id: string;
  title: string;
  slug: string | null;
  createdAt: string;
  category: string | null;
  price: number | null;
  displayOrder: number | null;
}

async function main() {
  const since = new Date(
    Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const fresh = await client.fetch<Row[]>(
    `*[_type=="product" && !(_id in path("drafts.**")) && _createdAt > $since]{
      _id, title, "slug": slug.current, "createdAt": _createdAt,
      "category": category->slug.current, price, displayOrder
    } | order(_createdAt desc)`,
    { since },
  );

  const state = readState();

  // Group by category so each one gets its own 1, 2, 3 — a displayOrder is
  // only meaningful within the grid it sorts.
  const byCategory = new Map<string, Row[]>();
  for (const row of fresh) {
    if (!row.category) continue;
    const list = byCategory.get(row.category) ?? [];
    if (list.length < MAX_PER_CATEGORY) list.push(row);
    byCategory.set(row.category, list);
  }

  const toPin: { row: Row; order: number }[] = [];
  for (const rows of byCategory.values())
    rows.forEach((row, index) => toPin.push({ row, order: index + 1 }));

  const freshIds = new Set(toPin.map((p) => p.row._id));
  const toUnpin = state.pinned.filter((id) => !freshIds.has(id));

  const expiring = toUnpin.length
    ? await client.fetch<Row[]>(
        `*[_id in $ids]{ _id, title, "slug": slug.current, "createdAt": _createdAt,
          "category": category->slug.current, price, displayOrder }`,
        { ids: toUnpin },
      )
    : [];

  console.log(
    `\nProducts published in the last ${WINDOW_DAYS} days: ${fresh.length}\n`,
  );

  if (!toPin.length) {
    console.log("  Nothing new to pin.");
  } else {
    for (const [category, rows] of byCategory) {
      console.log(`  /shop/${category}`);
      rows.forEach((row, index) => {
        const was =
          row.displayOrder == null ? "unpinned" : `was ${row.displayOrder}`;
        console.log(
          `      ${index + 1}. ${row.title.replace(" | Kaiku", "")}` +
            `  £${row.price ?? "—"}  (${was}, published ${row.createdAt.slice(0, 10)})`,
        );
      });
      console.log("");
    }
  }

  if (expiring.length) {
    console.log(`  Aged out of the window, unpinning ${expiring.length}:\n`);
    for (const row of expiring)
      console.log(
        `      ${row.title.replace(" | Kaiku", "")}  (/shop/${row.category ?? "?"})`,
      );
    console.log("");
  }

  if (!apply) return console.log("Dry run — re-run with --apply.");

  for (const { row, order } of toPin)
    await client.patch(row._id).set({ displayOrder: order }).commit();
  for (const id of toUnpin)
    await client.patch(id).unset(["displayOrder"]).commit();

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    STATE_FILE,
    `${JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        windowDays: WINDOW_DAYS,
        pinned: toPin.map((p) => p.row._id),
      },
      null,
      2,
    )}\n`,
  );

  console.log(`\nPinned ${toPin.length}, unpinned ${toUnpin.length}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
