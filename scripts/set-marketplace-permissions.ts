/**
 * Records which suppliers permit marketplace listing.
 *
 * Damien: _"furniture 100 and furniture to go allow it"_, then of Hill
 * Interiors _"they also allow dropshipping on ebay and amazon along with
 * furniture 100 and furniture to go"_, then _"you forget di designs too"_.
 *
 * AOSOM WAS HERE AND IS NOT ANY MORE. A one-line "and aosom" arrived straight
 * after the Hill message and was read as adding them. Damien corrected it:
 * _"i never said we can sell them on ebay"_. Removed, and worth leaving the
 * scar in the comment — this is the exact field where an inferred yes is
 * expensive, and it was inferred rather than stated.
 *
 * So four suppliers, eBay and Amazon on each. The schema treats an unticked
 * marketplace as forbidden rather than unknown, which is the right default: a
 * wrong "yes" here is what gets a trade account closed, and Kaiku has four
 * accounts that took months to win.
 *
 * `marketplacePolicySource` records that this came from Damien in conversation
 * rather than from the supplier's own terms. That distinction matters later —
 * when eBay suspends a listing over a supplier complaint, the question asked is
 * "where is it in writing", and "Damien said so in September" is a different
 * answer from a quoted clause. Worth upgrading each of these to a forwarded
 * email before the first listing goes up.
 *
 *   pnpm tsx --env-file=.env.local scripts/set-marketplace-permissions.ts
 *   pnpm tsx --env-file=.env.local scripts/set-marketplace-permissions.ts --apply
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

const SOURCE =
  "Confirmed by Damien in conversation, 15 September 2026 — not yet quoted " +
  "from the supplier's own written terms. Upgrade this to a forwarded email " +
  "before the first listing: a marketplace takedown asks where the permission " +
  "is in writing.";

/** Supplier name prefix → the marketplaces they permit. */
const PERMISSIONS: { match: string; marketplaces: string[] }[] = [
  { match: "Hill Interiors", marketplaces: ["eBay", "Amazon"] },
  { match: "Furniture100", marketplaces: ["eBay", "Amazon"] },
  { match: "Furniture To Go", marketplaces: ["eBay", "Amazon"] },
  { match: "D.I. Designs", marketplaces: ["eBay", "Amazon"] },
];

interface Supplier {
  _id: string;
  name: string;
  marketplacesAllowed: string[] | null;
}

async function main() {
  const suppliers = await client.fetch<Supplier[]>(
    `*[_type=="supplier" && !(_id in path("drafts.**"))]{ _id, name, marketplacesAllowed }`,
  );

  const plan: { supplier: Supplier; marketplaces: string[] }[] = [];
  for (const rule of PERMISSIONS) {
    // Exact name, not a prefix match: "Aosom" and "AOSON" are two different
    // records in this dataset and one of them is a typo nobody has cleaned up.
    const found = suppliers.filter((s) => s.name === rule.match);
    if (found.length !== 1) {
      console.error(
        `"${rule.match}" matched ${found.length} suppliers — refusing to guess.`,
      );
      found.forEach((f) => console.error(`    ${f.name} (${f._id})`));
      process.exit(1);
    }
    plan.push({ supplier: found[0]!, marketplaces: rule.marketplaces });
  }

  console.log("\nMarketplace permissions\n");
  for (const { supplier, marketplaces } of plan) {
    const was = supplier.marketplacesAllowed?.length
      ? supplier.marketplacesAllowed.join(", ")
      : "none";
    console.log(
      `  ${supplier.name.padEnd(24)} ${was}  →  ${marketplaces.join(", ")}`,
    );
  }

  const untouched = suppliers.filter(
    (s) => !plan.some((p) => p.supplier._id === s._id),
  );
  console.log(
    `\n  ${untouched.length} suppliers left as not-permitted: ${untouched.map((s) => s.name).join(", ")}\n`,
  );

  // Anything carrying a permission that is no longer in PERMISSIONS has it
  // taken away. Without this the list only ever grows: Aosom was set and then
  // corrected, and a script that cannot revoke would have left them permitted
  // for good. This file is the source of truth, so it has to be able to say no.
  const revoke = untouched.filter((s) => s.marketplacesAllowed?.length);
  if (revoke.length)
    console.log(
      `  Revoking a permission previously set on: ${revoke.map((s) => s.name).join(", ")}\n`,
    );

  if (!apply) return console.log("Dry run — re-run with --apply.");
  for (const { supplier, marketplaces } of plan)
    await client
      .patch(supplier._id)
      .set({
        marketplacesAllowed: marketplaces,
        marketplacePolicySource: SOURCE,
      })
      .commit();
  for (const supplier of revoke)
    await client
      .patch(supplier._id)
      .unset(["marketplacesAllowed", "marketplacePolicySource"])
      .commit();
  console.log(`Set on ${plan.length} suppliers, revoked on ${revoke.length}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
