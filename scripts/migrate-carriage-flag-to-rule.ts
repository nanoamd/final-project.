/**
 * Moves the existing `carriageIncludedInCost` boolean onto the richer
 * `shippingRule` field, for the suppliers where it is already set.
 *
 * This invents nothing. `carriageIncludedInCost: true` is a fact already
 * recorded in Sanity, and it means exactly the same thing as
 * `{ kind: "included" }` — carriage sits inside the trade price, so a
 * `shippingCost` of 0 on their products is real rather than a gap. Only
 * suppliers with the flag explicitly `true` are migrated; an unset flag stays
 * unset, because "nobody has said" must not become "they deliver free".
 *
 * Everything else waits for Damien's own upload of each supplier's carriage
 * terms — see scripts/apply-supplier-shipping-rules.ts.
 *
 *   pnpm tsx --env-file=.env.local scripts/migrate-carriage-flag-to-rule.ts
 *   pnpm tsx --env-file=.env.local scripts/migrate-carriage-flag-to-rule.ts --apply
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
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

interface Supplier {
  _id: string;
  name: string;
  carriageIncludedInCost?: boolean | null;
  shippingRule?: { kind?: string } | null;
}

async function main() {
  const suppliers = await client.fetch<Supplier[]>(
    `*[_type == "supplier"]{ _id, name, carriageIncludedInCost, shippingRule }`,
  );

  console.log(
    `\n${suppliers.length} suppliers.\n${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  let migrated = 0;
  for (const supplier of suppliers) {
    if (supplier.shippingRule?.kind) {
      console.log(
        `  = ${supplier.name.slice(0, 40).padEnd(42)} already has carriage terms (${supplier.shippingRule.kind}) — untouched`,
      );
      continue;
    }
    if (supplier.carriageIncludedInCost !== true) {
      console.log(
        `  · ${supplier.name.slice(0, 40).padEnd(42)} flag is ${supplier.carriageIncludedInCost ?? "unset"} — waiting on real terms`,
      );
      continue;
    }

    migrated += 1;
    console.log(
      `  ✓ ${supplier.name.slice(0, 40).padEnd(42)} carriageIncludedInCost: true -> { kind: "included" }`,
    );
    if (!apply) continue;
    await client
      .patch(supplier._id)
      .set({ shippingRule: { _type: "shippingRule", kind: "included" } })
      .commit();
  }

  console.log(`\n${migrated} suppliers migrated.\n`);
  console.log(
    apply ? "Applied.\n" : "Dry run — nothing written. Re-run with --apply.\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
