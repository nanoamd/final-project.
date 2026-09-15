/**
 * Prices and publishes Mercia's outdoor kitchens.
 *
 * Damien: _"upload the mercia garden kitchen products"_.
 *
 * The three are already staged with trade cost, descriptions, photos, specs and
 * SKUs — `import-mercia-outdoor-kitchens.ts` did that on 3 September and
 * deliberately wrote no price, because Mercia publish no carriage rates and a
 * missing carriage figure is not zero.
 *
 * That is still true, so this does not pretend otherwise. Instead it asks the
 * question the right way round: FOR EACH PRODUCT, HOW MUCH CARRIAGE CAN IT
 * ABSORB and still clear the margin floor while staying under Mercia's own
 * RRP? A product whose answer is "more than any pallet delivery could plausibly
 * cost" is safe to publish today. A product whose answer is "about nine pounds"
 * is not, whatever the trade discount looks like.
 *
 * Kaiku cannot list above the supplier's own retail price — a shopper who finds
 * the same kitchen cheaper on Mercia's site has been given a reason not to come
 * back — so RRP is a hard ceiling, not a target.
 *
 *   pnpm tsx --env-file=.env.local scripts/price-and-publish-mercia-kitchens.ts
 *   pnpm tsx --env-file=.env.local scripts/price-and-publish-mercia-kitchens.ts --apply
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
  perspective: "raw",
});

const CARD_RATE = 0.015;
const CARD_FIXED = 0.2;

/** Damien's floor for everything, and the target above £250. */
const FLOOR_SMALL = 0.17;
const FLOOR_LARGE = 0.2;

/**
 * The carriage a product must survive before it is safe to publish blind.
 *
 * A palletised garden building is not a parcel. £30–£60 is the realistic range
 * for kerbside pallet delivery and £75 is the pessimistic end, so a product
 * that still clears its floor under RRP with £75 of carriage is one whose
 * pricing cannot be wrecked by an answer we have not had yet. Anything that
 * needs a kinder number than this waits for Mercia to state their terms.
 */
const CARRIAGE_STRESS = 75;

interface Item {
  draftId: string;
  /** Mercia's own retail price — the ceiling Kaiku cannot cross. */
  rrp: number;
  floor: number;
}

const ITEMS: Item[] = [
  {
    draftId: "drafts.mercia-ultimate-trent-outdoor-kitchen",
    rrp: 1499.99,
    floor: FLOOR_LARGE,
  },
  {
    draftId: "drafts.mercia-trent-outdoor-kitchen",
    rrp: 999.99,
    floor: FLOOR_LARGE,
  },
  {
    draftId: "drafts.mercia-pressure-treated-bbq-table",
    rrp: 349.99,
    floor: FLOOR_SMALL,
  },
];

/** What a sale nets after cost, carriage and the card fee. */
const net = (price: number, cost: number, carriage: number) =>
  price - cost - carriage - (price * CARD_RATE + CARD_FIXED);

/**
 * The lowest price that clears `floor` once `carriage` is paid.
 *
 *   p - cost - carriage - (p*rate + fixed) = floor * p
 *   p * (1 - rate - floor) = cost + carriage + fixed
 */
const priceFor = (cost: number, carriage: number, floor: number) =>
  Math.ceil((cost + carriage + CARD_FIXED) / (1 - CARD_RATE - floor));

/** The most carriage a product can absorb at RRP and still clear its floor. */
const carriageHeadroom = (rrp: number, cost: number, floor: number) =>
  rrp * (1 - CARD_RATE - floor) - cost - CARD_FIXED;

interface Row {
  _id: string;
  title: string;
  slug: string | null;
  costPrice: number | null;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_id in $ids]{ _id, title, "slug": slug.current, costPrice }`,
    { ids: ITEMS.map((i) => i.draftId) },
  );
  const byId = new Map(rows.map((r) => [r._id, r]));

  const missing = ITEMS.filter((i) => !byId.has(i.draftId));
  if (missing.length) {
    console.error(
      `Not found as drafts:\n  ${missing.map((m) => m.draftId).join("\n  ")}`,
    );
    process.exit(1);
  }

  const publish: Record<string, unknown>[] = [];
  const hold: Record<string, unknown>[] = [];

  for (const item of ITEMS) {
    const row = byId.get(item.draftId)!;
    const cost = row.costPrice;
    if (cost == null) {
      console.error(`${row.title}: no trade cost. Refusing to price it.`);
      process.exit(1);
    }

    const headroom = carriageHeadroom(item.rrp, cost, item.floor);
    const stressed = priceFor(cost, CARRIAGE_STRESS, item.floor);
    const free = priceFor(cost, 0, item.floor);
    const title = row.title.replace(" | Kaiku", "");

    if (stressed <= item.rrp) {
      // Priced for the pessimistic carriage, not the hopeful one. If Mercia's
      // carriage turns out to be free, this simply earns more than the floor.
      const price = stressed;
      publish.push({
        draftId: item.draftId,
        publishedId: item.draftId.replace("drafts.", ""),
        title,
        slug: row.slug,
        cost,
        rrp: item.rrp,
        price,
        floor: item.floor,
        netIfCarriageFree: Number(net(price, cost, 0).toFixed(2)),
        marginIfCarriageFree: Number(
          ((net(price, cost, 0) / price) * 100).toFixed(1),
        ),
        netAtStress: Number(net(price, cost, CARRIAGE_STRESS).toFixed(2)),
        marginAtStress: Number(
          ((net(price, cost, CARRIAGE_STRESS) / price) * 100).toFixed(1),
        ),
        undercutsRrpBy: Number((item.rrp - price).toFixed(2)),
        carriageHeadroom: Number(headroom.toFixed(2)),
      });
    } else {
      hold.push({
        title,
        cost,
        rrp: item.rrp,
        floor: item.floor,
        priceIfCarriageFree: free,
        clearsFloorAtRrp: free <= item.rrp,
        carriageHeadroom: Number(headroom.toFixed(2)),
        reason:
          free > item.rrp
            ? `even with FREE carriage the ${Math.round(item.floor * 100)}% floor needs £${free}, which is above Mercia's own £${item.rrp}`
            : `clears the floor only while carriage stays under £${headroom.toFixed(2)}, and Mercia have not stated it`,
      });
    }
  }

  console.log(
    `\nMercia outdoor kitchens — priced against a £${CARRIAGE_STRESS} carriage stress test.\n`,
  );

  for (const p of publish) {
    console.log(`  PUBLISH  ${p.title as string}`);
    console.log(
      `      trade £${p.cost as number}   Mercia RRP £${p.rrp as number}   Kaiku £${p.price as number}  (£${p.undercutsRrpBy as number} under RRP)`,
    );
    console.log(
      `      keeps £${p.netIfCarriageFree as number} (${p.marginIfCarriageFree as number}%) if carriage is free,` +
        ` £${p.netAtStress as number} (${p.marginAtStress as number}%) with £${CARRIAGE_STRESS} of it`,
    );
    console.log(
      `      would still clear its floor up to £${p.carriageHeadroom as number} of carriage\n`,
    );
  }

  for (const h of hold) {
    console.log(`  HOLD     ${h.title as string}`);
    console.log(
      `      trade £${h.cost as number}   Mercia RRP £${h.rrp as number}   ${Math.round((h.floor as number) * 100)}% floor needs £${h.priceIfCarriageFree as number} even with free carriage`,
    );
    console.log(`      ${h.reason as string}\n`);
  }

  if (hold.length) {
    console.log(
      `  To unblock the ${hold.length} on hold, Mercia need to answer one question:\n` +
        `  what does kerbside pallet delivery cost Kaiku on a dropship order?\n`,
    );
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-15-mercia-kitchen-pricing.json",
    `${JSON.stringify({ generatedAt: new Date().toISOString(), carriageStress: CARRIAGE_STRESS, publish, hold }, null, 2)}\n`,
  );

  if (!apply) return console.log("Dry run — re-run with --apply.");

  for (const p of publish) {
    const draftId = p.draftId as string;
    const publishedId = p.publishedId as string;
    const draft = await client.getDocument(draftId);
    if (!draft) {
      console.error(`${draftId} vanished between read and write. Stopping.`);
      process.exit(1);
    }
    const { _id, _rev, _createdAt, _updatedAt, ...body } = draft;
    void _id;
    void _rev;
    void _createdAt;
    void _updatedAt;
    await client.createOrReplace({
      ...body,
      _id: publishedId,
      _type: "product",
      price: p.price as number,
    });
    await client.delete(draftId);
    console.log(`  published /shop/outdoor-kitchens/${p.slug as string}`);
  }
  console.log(`\n${publish.length} published, ${hold.length} still on hold.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
