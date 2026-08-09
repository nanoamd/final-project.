/**
 * Reprices the three Ancient Wisdom essential oils so a single-bottle order
 * makes money instead of losing it.
 *
 * At £3.99 the two 10 ml oils could not pay for their own parcel. Checkout
 * offers one £0 shipping option with no minimum order value, so a basket
 * holding nothing but a 10 ml oil is a real order the site will accept:
 *
 *   Eucalyptus 10ml   £3.99 − £1.11 cost − £2.99 carriage − £0.26 fees = −£0.37
 *   Sweet Birch 10ml  £3.99 − £1.59 cost − £2.99 carriage − £0.26 fees = −£0.85
 *
 * Carriage and weight are restored at the same time, because the published
 * documents have neither and their own stale drafts still do: 40 g and £2.79 for
 * the 10 ml bottles, 115 g and £2.99 for the 50 ml. Those are the ≤99 g and
 * ≤2 kg standard bands in getAwDropshipShippingCost, so they agree with the
 * weights rather than merely accompanying them. Whatever wrote the published
 * versions dropped both fields, which is why the margin looked survivable.
 *
 * Fees are Stripe UK standard, 1.5% + 20p on a UK card.
 *
 * The 50 ml Sweet Birch is deliberately not repriced. At £17.50 it already nets
 * £8.54, or 49%, which is above the mean for the AW Dropship range — it was
 * never the problem.
 *
 * New prices are set to clear a net margin in line with the rest of the AW
 * range while staying inside what a 10 ml essential oil actually sells for.
 * They are not set by target margin alone: a formula wanting 45% net asks £8.55
 * for a 10 ml eucalyptus, which is Neal's Yard money for an Ancient Wisdom
 * bottle, and a product that does not sell has no margin at all.
 *
 * No compareAtPrice is set. These have never sold at £3.99, so showing "was
 * £3.99" would be a discount that never existed.
 *
 * Patches drafts as well as published documents, and reaches them by document
 * ID rather than by slug. All three oils have a stale draft sitting on top of
 * them left over from the import — one would drop the Eucalyptus back to £2.15
 * — and those drafts still carry the pre-tidy slug, so a slug query finds the
 * published document and silently misses the draft that would overwrite it.
 *
 * Dry run by default; --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/reprice-oils.ts
 */
import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const CARD_RATE = 0.015;
const CARD_FIXED = 0.2;

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

interface Change {
  /** null keeps the current price — carriage and weight are still recorded. */
  price: number | null;
  /** AW Dropship's per-parcel rate for this weight, from their band table. */
  carriage: number;
  /** Kilograms, as recorded on the product's own draft. */
  weightKg: number;
}

/** Keyed by the published slug. */
const CHANGES: Record<string, Change> = {
  "eucalyptus-essential-oil-10ml": {
    price: 6.95,
    carriage: 2.79,
    weightKg: 0.04,
  },
  "sweet-birch-essential-oil-10ml": {
    price: 7.95,
    carriage: 2.79,
    weightKg: 0.04,
  },
  "sweet-birch-essential-oil-50ml": {
    price: null,
    carriage: 2.99,
    weightKg: 0.115,
  },
};

interface Row {
  _id: string;
  title: string;
  price: number | null;
  costPrice: number | null;
  shippingCost: number | null;
  weightValue: number | null;
}

function net(price: number, cost: number, carriage: number) {
  return price - cost - carriage - (price * CARD_RATE + CARD_FIXED);
}

async function main() {
  let written = 0;

  for (const [slug, change] of Object.entries(CHANGES)) {
    const published = await client.fetch<Row | null>(
      `*[_type == "product" && slug.current == $slug && !(_id in path("drafts.**"))][0]{_id, title, price, costPrice, shippingCost, "weightValue": weight.value}`,
      { slug },
    );
    if (!published) {
      console.warn(`✗ ${slug}: no published product with this slug`);
      continue;
    }
    // By ID, because the draft's own slug is the stale pre-tidy one.
    const draftDoc = await client.fetch<Row | null>(
      `*[_id == $id][0]{_id, title, price, costPrice, shippingCost, "weightValue": weight.value}`,
      { id: `drafts.${published._id}` },
    );
    const docs = draftDoc ? [published, draftDoc] : [published];

    for (const doc of docs) {
      const draft = doc._id.startsWith("drafts.");
      const cost = doc.costPrice;
      if (cost === null) {
        console.warn(`⚠ ${doc.title}: no cost price — skipped`);
        continue;
      }

      const patch: Record<string, unknown> = {};
      if (change.price !== null && doc.price !== change.price)
        patch.price = change.price;
      if (doc.shippingCost !== change.carriage)
        patch.shippingCost = change.carriage;
      if (doc.weightValue !== change.weightKg)
        patch.weight = { _type: "weight", unit: "kg", value: change.weightKg };

      const oldNet = doc.price
        ? net(doc.price, cost, doc.shippingCost ?? change.carriage)
        : null;
      const newPrice = change.price ?? doc.price ?? 0;
      const newNet = net(newPrice, cost, change.carriage);

      if (!Object.keys(patch).length) {
        console.log(
          `· ${doc.title.slice(0, 40).padEnd(42)}${draft ? "[draft] " : "        "}already correct`,
        );
        continue;
      }
      if (apply) await client.patch(doc._id).set(patch).commit();
      console.log(
        `${apply ? "✓" : "·"} ${doc.title.slice(0, 40).padEnd(42)}${draft ? "[draft] " : "        "}` +
          `£${String(doc.price ?? "—").padEnd(6)}→ £${String(newPrice).padEnd(6)}` +
          `  net ${oldNet === null ? "—" : `£${oldNet.toFixed(2)}`} → £${newNet.toFixed(2)}` +
          `  (${Math.round((newNet / newPrice) * 100)}%)`,
      );
      written++;
    }
  }

  console.log(
    `\n${written} document(s) ${apply ? "updated" : "to update"}.` +
      (apply ? "\n" : "\nDry run — nothing written. Re-run with --apply.\n"),
  );
}

main().catch((err) => {
  console.error("reprice-oils failed:", err);
  process.exit(1);
});
