/**
 * Creates the Viva Rugs supplier document, so scripts/import-viva-rugs.ts has
 * something to reference.
 *
 *   pnpm tsx --env-file=.env.local scripts/create-viva-rugs-supplier.ts --apply
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
    console.log('Would create supplier "supplier-viva-rugs" (Viva Rugs).');
    return;
  }
  await client.createIfNotExists({
    _id: "supplier-viva-rugs",
    _type: "supplier",
    name: "Viva Rugs",
  });
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
