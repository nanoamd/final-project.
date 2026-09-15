/**
 * Creates the Furniture100 supplier record, and records who permits marketplaces.
 *
 * Damien: _"upload some furniture100 products as they accepted me"_, and later
 * _"furniture 100 and furniture to go allow it"_ on marketplace listing.
 *
 * WHAT THIS DOES NOT DO: log into their trade portal. Damien offered the
 * account credentials and they are not used here, are not stored here, and are
 * not in the repository. Automated login to a supplier's portal is the same
 * category as defeating their bot protection — a standing constraint on this
 * project — and it is a fast way to lose an account that was just approved.
 * Everything below is from Furniture100's own public pages.
 *
 * Their trade prices come out of the portal the way every other supplier's do:
 * Damien exports them, and `import-supplier-products.ts --csv` takes the file.
 *
 * ON `marketplacesAllowed`: the schema treats an empty list as NOT permitted,
 * never as allowed, which is the right default — a wrong "yes" here gets a
 * trade account closed. Damien has confirmed eBay for both suppliers. Amazon
 * stays off both until the compliance work he mentioned is actually done,
 * because "will become some extra work" is not the same as done.
 *
 *   pnpm tsx --env-file=.env.local scripts/add-furniture100-supplier.ts
 *   pnpm tsx --env-file=.env.local scripts/add-furniture100-supplier.ts --apply
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
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
  perspective: "raw",
});

const FURNITURE100 = {
  _id: "supplier-furniture100",
  _type: "supplier" as const,
  name: "Furniture100",
  website: "https://furniture100.co.uk",
  notes:
    "Trading name of Swift28 Ltd, registered in England & Wales. UK online " +
    "furniture boutique running a dropship programme — accent and lounge " +
    "chairs, dining chairs, bar stools, office chairs, sofas, tables and " +
    "lighting. Approved as a Kaiku trade account 15 September 2026. " +
    "They publish 'free UK delivery on every order, dispatched quickly and " +
    "fully tracked' on their own public pages and state no minimum order; " +
    "that is a RETAIL promise, so the dropship carriage terms still need " +
    "confirming in writing before anything here is priced. Trade prices are " +
    "behind the account login and are Damien's to export.",
  // No shippingRule at all, deliberately. `kind` is a required field with no
  // "unknown" option, so the honest representation of "not yet asked" is an
  // absent rule — which is what audit-supplier-readiness.ts already reads as
  // BLOCKED. Writing a placeholder kind would make an unanswered question look
  // answered.
  marketplacesAllowed: ["eBay"],
  marketplacePolicySource:
    "Confirmed verbally by Damien, 15 September 2026: Furniture100 permit " +
    "marketplace listing. Amazon deliberately not ticked — he flagged it as " +
    "needing compliance work first. Worth getting the eBay permission in " +
    "writing from the supplier before the first listing goes up.",
};

/** Furniture To Go already exists; only the marketplace fields are set. */
const FURNITURE_TO_GO_PATCH = {
  marketplacesAllowed: ["eBay"],
  marketplacePolicySource:
    "Confirmed verbally by Damien, 15 September 2026. Amazon not ticked — " +
    "compliance work outstanding. Their carriage is already confirmed in " +
    "writing (free next-day, no MOQ), which is what makes them the better " +
    "marketplace candidate of the two today.",
};

async function main() {
  const existing = await client.fetch<{ _id: string; name: string } | null>(
    `*[_id == $id][0]{_id, name}`,
    { id: FURNITURE100._id },
  );
  const ftg = await client.fetch<{ _id: string; name: string } | null>(
    `*[_type=="supplier" && name match "Furniture To Go*"][0]{_id, name}`,
  );
  if (!ftg) {
    console.error("Furniture To Go supplier record not found — stopping.");
    process.exit(1);
  }

  console.log(
    `\n${existing ? "Update" : "Create"} supplier ${FURNITURE100.name}`,
  );
  console.log(`   ${FURNITURE100.website}`);
  console.log(
    `   marketplacesAllowed: ${FURNITURE100.marketplacesAllowed.join(", ")}`,
  );
  console.log(`   carriage: unknown — not assumed to be free\n`);
  console.log(`Patch ${ftg.name} (${ftg._id})`);
  console.log(
    `   marketplacesAllowed: ${FURNITURE_TO_GO_PATCH.marketplacesAllowed.join(", ")}\n`,
  );
  console.log(
    "No products imported. Furniture100's trade prices are behind their\n" +
      "account login and this script does not log in — export the price list\n" +
      "and import-supplier-products.ts --csv will take it.\n",
  );

  if (!apply) return console.log("Dry run — re-run with --apply.");
  await client.createOrReplace(FURNITURE100);
  await client.patch(ftg._id).set(FURNITURE_TO_GO_PATCH).commit();
  console.log("Done.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
