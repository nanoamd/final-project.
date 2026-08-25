/**
 * Proposes a price for every imported Hill Interiors draft, and shows the margin.
 *
 * 102 drafts cannot publish without a price, and the schema is right to refuse
 * them. But typing 102 numbers by hand invites the one mistake that matters —
 * pricing under the landed cost — because **carriage is charged per parcel and it
 * is not proportional to the product**. A £40.60 chair carries £6.99. A £986 sofa
 * at 34kg carries £49.99 two-man. Price both on a flat multiple of cost and the
 * chair loses money while the sofa leaves margin on the table.
 *
 * So this works from landed cost — dropship price plus the carriage band the
 * product's own weight puts it in — and applies the margin to that. Hill's bands:
 * £6.99 to 10kg, £9.99 to 20kg, £14.99 to 40kg, £24.99 over 40kg; two-man from
 * £49.99 at 35kg, rising to £109.99 at 200kg. Scotland adds £10, which is not
 * priced in here because most orders are not Scottish — it is a note on the margin,
 * not a surcharge on every customer.
 *
 * **Nothing is written without --apply, and the multiple is Damien's to choose.**
 * The standing constraint is that prices are his and never imported from a feed.
 * This proposes arithmetic against a multiple he sets; it does not decide what
 * Kaiku charges.
 *
 * **compareAtPrice is set to Hill's RRP, and only where the price genuinely
 * undercuts it.** That is the honest way to show a saving: the manufacturer's own
 * recommended price is a real, citable reference, held in the supplier feed. A
 * strikethrough against a number nobody ever charged is the kind of claim the ASA
 * takes an interest in, so where the proposed price lands at or above RRP no
 * comparison is shown at all.
 *
 *   pnpm tsx --env-file=.env.local scripts/price-hill-drafts.ts <shortlist.json>
 *   pnpm tsx --env-file=.env.local scripts/price-hill-drafts.ts <shortlist.json> --margin 1.8
 *   pnpm tsx --env-file=.env.local scripts/price-hill-drafts.ts <shortlist.json> --margin 1.8 --apply
 */
import { readFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const shortlistPath = process.argv[2];
const feedPath = process.argv[3];
const apply = process.argv.includes("--apply");
const marginIndex = process.argv.indexOf("--margin");
const MARGIN =
  marginIndex > -1 ? Number(process.argv[marginIndex + 1]) : undefined;

if (!shortlistPath || shortlistPath.startsWith("--")) {
  console.error(
    "Usage: pnpm tsx --env-file=.env.local scripts/price-hill-drafts.ts <shortlist.json> <feed.xml> [--margin 1.8] [--apply]",
  );
  process.exit(1);
}
if (!feedPath || feedPath.startsWith("--")) {
  console.error(
    "The feed XML is required: it holds the dropship price, which is what Kaiku pays.\n" +
      "Pricing from RRP alone would mean assuming Hill's markup and then compounding\n" +
      "that assumption into every price in the catalogue.",
  );
  process.exit(1);
}
if (apply && !MARGIN) {
  console.error(
    "Refusing to --apply without an explicit --margin. Prices are Damien's to set,\n" +
      "so the multiple has to be stated rather than defaulted into the catalogue.",
  );
  process.exit(1);
}

/** Multiples shown side by side in the dry run, so the choice is informed. */
const PREVIEW_MARGINS = [1.6, 1.8, 2.0, 2.2];

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

/** Hill's published dropship carriage, by weight. */
function carriage(weightKg: number): number {
  if (weightKg > 200) return 109.99; // POA in reality; the top band as a floor.
  if (weightKg > 150) return 109.99;
  if (weightKg > 100) return 84.99;
  if (weightKg > 60) return 69.99;
  if (weightKg > 35) return 59.99;
  // Between 35kg and 40kg two-man is cheaper than the single-carrier band above
  // it, which is why this is not a simple ascending ladder.
  if (weightKg > 20) return 14.99;
  if (weightKg > 10) return 9.99;
  return 6.99;
}

/**
 * Rounds to a price that looks chosen rather than calculated.
 *
 * Under £100 to the nearest £5 minus a penny (£69, £74, £79); above it to the
 * nearest £10 minus a penny. A price of £71.34 reads as a spreadsheet output; £69
 * reads as a decision, and on a site with no reviews yet the difference is trust.
 */
function pricePoint(value: number): number {
  if (value < 100) return Math.max(5, Math.round(value / 5) * 5 - 1);
  if (value < 1000) return Math.round(value / 10) * 10 - 1;
  return Math.round(value / 50) * 50 - 1;
}

interface ShortlistEntry {
  sku?: string;
  /** Hill's RRP, carried through the selector as a formatted string. */
  price?: string;
  weightKg?: number;
  title?: string;
}

interface Draft {
  id: string;
  title: string;
  sku: string;
  weight: number | null;
  price: number | null;
  category: string | null;
}

function rrpOf(entry: ShortlistEntry): number {
  return Number(String(entry.price ?? "").replace(/[^0-9.]/g, "")) || 0;
}

async function main() {
  const shortlist = JSON.parse(
    readFileSync(shortlistPath!, "utf8"),
  ) as ShortlistEntry[];
  const byCode = new Map<string, ShortlistEntry>();
  for (const entry of shortlist)
    if (entry.sku) byCode.set(String(entry.sku), entry);

  // The real dropship price, per product code, straight from the feed. This is what
  // Kaiku pays, and it is the only honest base for a margin.
  const feed = readFileSync(feedPath!, "utf8");
  const costByCode = new Map<string, number>();
  for (const chunk of feed.split("<Product>").slice(1)) {
    const code = /<Code>([\s\S]*?)<\/Code>/.exec(chunk)?.[1]?.trim();
    const price = Number(/<Price>([\s\S]*?)<\/Price>/.exec(chunk)?.[1]?.trim());
    if (code && price) costByCode.set(code, price);
  }

  const drafts = await client.fetch<Draft[]>(
    `*[_type == "product" && _id in path("drafts.**")
       && supplier._ref == "supplier-hill-interiors"]{
      "id": _id, title, "sku": supplierSku, "weight": weightKg, price,
      "category": category->slug.current
    } | order(title asc)`,
  );

  console.log(
    `\n${drafts.length} Hill drafts. ${apply ? `APPLYING at ×${MARGIN}` : "DRY RUN"}\n`,
  );

  const rows = drafts
    .map((draft) => {
      const entry = byCode.get(String(draft.sku));
      const cost = costByCode.get(String(draft.sku));
      if (!entry || !cost) return null;
      const rrp = rrpOf(entry);
      const weight = draft.weight ?? entry.weightKg ?? 0;
      const ship = carriage(weight);
      return { draft, rrp, weight, ship, cost, landed: cost + ship };
    })
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const missing = drafts.length - rows.length;
  if (missing)
    console.log(
      `  ! ${missing} draft(s) have no cost in the feed and are skipped rather than guessed.\n`,
    );

  console.log(
    "Proposed prices at each multiple of landed cost — the dropship price Kaiku pays\n" +
      "plus the carriage band the product's own weight falls into.\n",
  );

  // Ladder summary, so the shape of the catalogue is visible before committing.
  for (const margin of MARGIN ? [MARGIN] : PREVIEW_MARGINS) {
    const priced = rows.map((r) => ({
      ...r,
      proposed: pricePoint(r.landed * margin),
    }));
    const under = priced.filter((p) => p.proposed < p.rrp).length;
    const bands = {
      "under £50": priced.filter((p) => p.proposed < 50).length,
      "£50–150": priced.filter((p) => p.proposed >= 50 && p.proposed < 150)
        .length,
      "£150–400": priced.filter((p) => p.proposed >= 150 && p.proposed < 400)
        .length,
      "£400+": priced.filter((p) => p.proposed >= 400).length,
    };
    console.log(
      `  ×${margin.toFixed(2)}  ` +
        Object.entries(bands)
          .map(([label, n]) => `${label}: ${String(n).padStart(3)}`)
          .join("   ") +
        `   under RRP: ${under}/${priced.length}`,
    );
  }

  if (!MARGIN) {
    console.log(
      "\nNo --margin given, so nothing is proposed per product and nothing is written.\n" +
        "Pick a multiple and re-run to see the full list, then add --apply.\n",
    );
    return;
  }

  console.log("");
  const patches: { id: string; price: number; compareAt: number | null }[] = [];
  for (const row of rows) {
    const proposed = pricePoint(row.landed * MARGIN);
    const compareAt = proposed < row.rrp ? row.rrp : null;
    patches.push({ id: row.draft.id, price: proposed, compareAt });
    console.log(
      `  ${row.draft.sku}  cost £${row.cost.toFixed(2).padStart(7)} +£${row.ship.toFixed(2)} ship  ` +
        `→ £${String(proposed).padStart(5)}  ` +
        `RRP £${row.rrp.toFixed(0).padStart(5)}  ` +
        `profit £${(proposed - row.landed).toFixed(2).padStart(7)}  ` +
        `${compareAt ? `saves £${(row.rrp - proposed).toFixed(0).padStart(4)}` : "at or above RRP — no comparison shown"}  ` +
        `${row.weight.toFixed(1)}kg carriage £${row.ship.toFixed(2)}  ` +
        `${row.draft.title.slice(0, 40)}`,
    );
  }

  if (!apply) {
    console.log(
      `\nDry run — nothing written. Re-run with --apply to set ${patches.length} prices.\n`,
    );
    return;
  }

  for (const patch of patches)
    await client
      .patch(patch.id)
      .set({
        price: patch.price,
        ...(patch.compareAt ? { compareAtPrice: patch.compareAt } : {}),
      })
      .commit({ visibility: "async" });

  console.log(`\nPriced ${patches.length} drafts at ×${MARGIN}.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
