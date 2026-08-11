/**
 * Fills in the Ancient Wisdom products, which were published with the shell of a
 * record: summary, price, images and a long description, but no highlights and no
 * specs.
 *
 * The visible symptom was the Sweet Birch 50ml page — the highlights band renders
 * between two rules, so with nothing in it the page showed an empty strip where the
 * bullets should be. That band is now hidden when empty, but hiding it is not the
 * fix: these products should have bullets.
 *
 * Nothing here is invented. Every highlight is lifted from the product's own
 * "Why Choose …?" list, and every spec is a fact already stated in its description
 * or already stored on the document (weight, volume, botanical name, extraction
 * method). Marketing adjectives are left in the description where they belong; the
 * specs table gets only what a shopper could check.
 *
 * Deliberately no therapeutic or medical claims. UK advertising rules treat "helps
 * with pain" or "anti-inflammatory" on an unlicensed product as a substantiation
 * problem, and the supplier has provided no evidence to substantiate one. The
 * aroma, the volume and the extraction method are all provable.
 *
 * Dry run by default; --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/finish-ancient-wisdom-products.ts
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

interface Spec {
  _key: string;
  _type: "productSpec";
  label: string;
  value: string;
}

interface Update {
  id: string;
  what: string;
  highlights: string[];
  specs: Spec[];
  /** The supplier's own product code, for reordering and for the Merchant feed. */
  supplierSku?: string;
  /** Set only where the stored value is wrong, not merely absent. */
  fixes?: Record<string, unknown>;
}

const spec = (label: string, value: string): Spec => ({
  // Stable keys from the label, so re-running updates a row rather than adding a
  // duplicate one beside it.
  _key: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  _type: "productSpec",
  label,
  value,
});

const UPDATES: Update[] = [
  {
    id: "product-aw-preo-76",
    what: "Sweet Birch Essential Oil 50ml",
    highlights: [
      "50ml amber glass bottle protects the oil from light",
      "Fresh, crisp woodland aroma",
      "Ideal for ultrasonic diffusers and oil burners",
      "Suitable for massage blends once diluted in a carrier oil",
      "Use in homemade candles, soaps and bath products",
      "Delivered in 2–5 working days, tracked",
    ],
    specs: [
      spec("Volume", "50ml"),
      spec("Botanical name", "Betula lenta"),
      spec("Extraction method", "Steam distilled"),
      spec("Bottle", "Amber glass with dropper cap"),
      spec("Aroma", "Fresh, crisp, woodland"),
      spec("Weight", "0.115 kg"),
      spec("Supplied by", "Ancient Wisdom"),
    ],
    supplierSku: "PREO-76",
  },
  {
    id: "product-aw-eo-76",
    what: "Sweet Birch Essential Oil 10ml",
    highlights: [
      "10ml amber glass bottle protects the oil from light",
      "Fresh, woodland-inspired aroma",
      "Ideal for ultrasonic diffusers and oil burners",
      "Suitable for massage blends once diluted in a carrier oil",
      "Use in homemade candles, soaps and bath products",
      "Delivered in 2–5 working days, tracked",
    ],
    specs: [
      spec("Volume", "10ml"),
      spec("Botanical name", "Betula lenta"),
      spec("Extraction method", "Steam distilled"),
      spec("Bottle", "Amber glass with dropper cap"),
      spec("Aroma", "Fresh, crisp, woodland"),
      spec("Weight", "0.04 kg"),
      spec("Supplied by", "Ancient Wisdom"),
    ],
    supplierSku: "EO-76",
    fixes: {
      // Stored as 0, which the page reads as a was-price of £0.00 the moment
      // anything renders it. There is no higher previous price to show.
      compareAtPrice: null,
      // "KK-WA-AW-004 " — a trailing space in the code a customer quotes back at
      // us, and in the id Google matches on.
      sku: "KK-WA-AW-004",
    },
  },
  {
    id: "product-aw-eo-03",
    what: "Eucalyptus Essential Oil 10ml",
    highlights: [
      "10ml amber glass bottle protects the oil from light",
      "Fresh, clean and invigorating aroma",
      "Ideal for ultrasonic diffusers and oil burners",
      "Suitable for massage blends once diluted in a carrier oil",
      "Use in homemade candles, soaps and bath products",
      "Delivered in 2–5 working days, tracked",
    ],
    specs: [
      spec("Volume", "10ml"),
      spec("Botanical name", "Eucalyptus globulus"),
      spec("Part of plant used", "Leaves and twigs"),
      spec("Extraction method", "Steam distilled"),
      spec("Bottle", "Amber glass with dropper cap"),
      spec("Aroma", "Fresh, clean, invigorating"),
      spec("Weight", "0.04 kg"),
      spec("Supplied by", "Ancient Wisdom"),
    ],
    supplierSku: "EO-03",
  },
  {
    id: "product-aw-csalt-01",
    what: "Himalayan Salt BBQ Cooking Plate",
    highlights: [
      "Cut from genuine Himalayan rock salt, so no two plates match",
      "Seasons food gently as it cooks",
      "Use on charcoal BBQs, gas BBQs or in a conventional oven",
      "Chill it to serve cheeses, sushi, fruit and desserts",
      "30 × 20 × 5cm — room for steaks, seafood or vegetables",
      "Wipe clean with a damp cloth; no detergents",
    ],
    specs: [
      spec("Dimensions", "30 × 20 × 5cm"),
      spec("Material", "Genuine Himalayan rock salt"),
      spec("Weight", "8 kg"),
      spec("Use on", "Charcoal BBQ, gas BBQ, conventional oven"),
      spec("Care", "Heat gradually, cool naturally, wipe with a damp cloth"),
      spec("Supplied by", "Ancient Wisdom"),
    ],
    supplierSku: "CSalt-01",
  },
];

async function main() {
  for (const update of UPDATES) {
    const doc = await client.fetch<{
      _id: string;
      title: string;
      highlights: string[] | null;
      specs: Spec[] | null;
      supplierSku: string | null;
    } | null>(`*[_id == $id][0]{_id, title, highlights, specs, supplierSku}`, {
      id: update.id,
    });

    if (!doc) {
      console.log(`✗ ${update.what} — no document with _id ${update.id}`);
      continue;
    }

    // Never overwrite work done in Studio. An existing list is a decision
    // somebody made; only an empty one is a gap.
    const set: Record<string, unknown> = {};
    if (!(doc.highlights ?? []).length) set.highlights = update.highlights;
    if (!(doc.specs ?? []).length) set.specs = update.specs;
    if (!doc.supplierSku && update.supplierSku)
      set.supplierSku = update.supplierSku;
    Object.assign(set, update.fixes ?? {});

    if (!Object.keys(set).length) {
      console.log(`· ${update.what} — already complete, nothing to set`);
      continue;
    }

    console.log(
      `${apply ? "✓" : "·"} ${update.what}\n` +
        Object.entries(set)
          .map(
            ([key, value]) =>
              `    ${key.padEnd(14)} ${
                Array.isArray(value)
                  ? `${value.length} entries`
                  : JSON.stringify(value)
              }`,
          )
          .join("\n"),
    );

    if (apply) {
      const patch = client.patch(update.id);
      // null means clear, which set() cannot express — unset() is the operation.
      const toUnset = Object.keys(set).filter((k) => set[k] === null);
      const toSet = Object.fromEntries(
        Object.entries(set).filter(([, v]) => v !== null),
      );
      await patch.set(toSet).unset(toUnset).commit();
    }
  }

  console.log(
    apply
      ? "\nDone. The highlights band now has content on all four.\n"
      : "\nDry run — nothing written. Re-run with --apply.\n",
  );
}

main().catch((err) => {
  console.error("finish-ancient-wisdom-products failed:", err);
  process.exit(1);
});
