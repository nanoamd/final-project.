/**
 * Creates the Premier Housewares supplier document, so
 * scripts/import-premier-housewares.ts has something to reference. A trade
 * account Damien applied for and was accepted into.
 *
 *   pnpm tsx --env-file=.env.local scripts/create-premier-housewares-supplier.ts --apply
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

async function main() {
  console.log(apply ? "APPLYING" : "DRY RUN");
  if (!apply) {
    console.log(
      'Would create supplier "supplier-premier-housewares" (Premier Housewares).',
    );
    return;
  }
  await client.createIfNotExists({
    _id: "supplier-premier-housewares",
    _type: "supplier",
    name: "Premier Housewares",
  });
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
