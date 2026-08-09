/**
 * Records, per supplier, whether carriage sits inside the trade price.
 *
 * Without this a product's `shippingCost` of 0 — or of nothing at all — is
 * ambiguous in a way that matters. It can mean the supplier delivers free, or
 * that nobody has worked the figure out yet, and the two give very different
 * margins on the same product. Seven products carried a placeholder £0 entered
 * to skip the calculation at listing time, and counting those as free made three
 * D.I. Designs coffee tables look like they cleared 9-16% when their four
 * siblings all carry £80 of carriage.
 *
 * It belongs on the supplier because it is a fact about their terms, not about
 * any one product, and because it then answers the same question for every
 * product they supply in future.
 *
 * Set here from what is actually known:
 *
 *   SaunaPlunge — carriage included. Confirmed by the owner: pallet delivery is
 *     inside the trade price, so £0 on the eight saunas is genuine and their 17%
 *     net is real rather than a best case.
 *
 * Deliberately not set:
 *
 *   D.I. Designs — four products carry £80 and three carry a placeholder £0, and
 *     whether that £80 is on top of the trade price or already inside it is
 *     unresolved. Guessing decides whether the Elmley and the Overbury sell at a
 *     loss, so it stays unset and the report keeps calling them a best case.
 *
 *   Aosom, AW Dropship — no confirmation either way. AW at least has a real band
 *     table in src/lib/suppliers/aw-dropship-shipping.ts, so their products can
 *     be costed from weight.
 *
 * Dry run by default; --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/set-supplier-carriage-terms.ts
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

/** Matched against the start of the supplier's name. */
const CARRIAGE_INCLUDED: Record<string, boolean> = {
  SaunaPlunge: true,
};

async function main() {
  const suppliers = await client.fetch<
    {
      _id: string;
      name: string;
      carriageIncludedInCost: boolean | null;
      products: number;
    }[]
  >(
    `*[_type == "supplier"]{
      _id, name, carriageIncludedInCost,
      "products": count(*[_type == "product" && references(^._id) && !(_id in path("drafts.**"))])
    } | order(name asc)`,
  );

  let written = 0;
  for (const supplier of suppliers) {
    const match = Object.entries(CARRIAGE_INCLUDED).find(([prefix]) =>
      supplier.name.startsWith(prefix),
    );
    if (!match) {
      console.log(
        `· ${supplier.name.slice(0, 30).padEnd(32)}${String(supplier.products).padStart(2)} product(s)   ` +
          `left unset — terms not confirmed`,
      );
      continue;
    }
    const [, included] = match;
    if (supplier.carriageIncludedInCost === included) {
      console.log(
        `· ${supplier.name.slice(0, 30).padEnd(32)}${String(supplier.products).padStart(2)} product(s)   already set`,
      );
      continue;
    }
    if (apply)
      await client
        .patch(supplier._id)
        .set({ carriageIncludedInCost: included })
        .commit();
    console.log(
      `${apply ? "✓" : "·"} ${supplier.name.slice(0, 30).padEnd(32)}${String(supplier.products).padStart(2)} product(s)   ` +
        `carriage included = ${included}`,
    );
    written++;
  }

  console.log(
    `\n${written} supplier(s) ${apply ? "updated" : "to update"}.` +
      (apply ? "\n" : "\nDry run — nothing written. Re-run with --apply.\n"),
  );
}

main().catch((err) => {
  console.error("set-supplier-carriage-terms failed:", err);
  process.exit(1);
});
