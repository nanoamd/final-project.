/**
 * Fixes the one field the full-catalogue description rewrite didn't touch:
 * the pergola's `summary` — the short blurb shown above the description on
 * the product page — still had the old supplier-voice superlatives
 * ("elegant", "offers comfort and style") even after its description was
 * rewritten to the sauna/cold-plunge standard. Real facts only, no
 * superlatives, matching the standard applied everywhere else.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-pergola-summary.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-pergola-summary.ts --apply
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
});

const id = "product-aosom-84c-441v00lg";
const newSummary =
  "A metal-framed pergola with a sliding canopy and curtains, in grey. The retractable roof panels slide open or closed along the frame to control shade, and the curtains enclose the sides for wind and privacy.";

async function main() {
  const doc = await client.fetch<{ _id: string; summary: string } | null>(
    `*[_id == $id][0]{_id, summary}`,
    { id },
  );
  if (!doc) {
    console.error("Product not found:", id);
    process.exit(1);
  }
  console.log("Current summary:", doc.summary);
  console.log("New summary:    ", newSummary);

  if (apply) {
    await client.patch(id).set({ summary: newSummary }).commit();
    console.log("\nApplied.");
  } else {
    console.log("\nDry run — pass --apply to write this to Sanity.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
