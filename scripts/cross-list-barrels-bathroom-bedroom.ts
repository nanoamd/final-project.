/**
 * Cross-lists the two live Beer Barrel products into Bathroom and Bedroom
 * Storage, in addition to whatever categories they're already in
 * (outdoor-storage, garden-furniture, per scripts/cross-list-remaining-
 * products.ts). Only ADDS to `additionalCategories` — never touches
 * primary category, pricing, copy or images.
 *
 * Looks each target category up by slug rather than guessing/creating —
 * if a category doesn't exist yet under that exact slug, this logs a
 * clear warning and skips it rather than inventing a new one with a
 * possibly-wrong name.
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/cross-list-barrels-bathroom-bedroom.ts
 */
import { createClient } from "@sanity/client";

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token,
  useCdn: false,
});

const BARREL_PRODUCT_SLUGS = [
  "beer-barrel-table-natural-wood",
  "natural-wooden-beer-barrel-storage-stool",
];

// Tried in order — the first slug that resolves to a real category is
// used. Logged either way so it's obvious which one (if any) matched.
const BATHROOM_SLUG_CANDIDATES = [
  "bathroom",
  "bathroom-storage",
  "bathroom-cabinets",
];
const BEDROOM_STORAGE_SLUG = "bedroom-storage";

async function resolveCategory(
  slug: string,
): Promise<{ _id: string; title: string } | null> {
  return client.fetch<{ _id: string; title: string } | null>(
    `*[_type == "category" && slug.current == $slug][0]{ _id, title }`,
    { slug },
  );
}

async function main() {
  let bathroom: { _id: string; title: string } | null = null;
  for (const slug of BATHROOM_SLUG_CANDIDATES) {
    bathroom = await resolveCategory(slug);
    if (bathroom) {
      console.log(
        `Found bathroom category: "${bathroom.title}" (slug: ${slug})`,
      );
      break;
    }
  }
  if (!bathroom) {
    console.warn(
      `⚠ No category found for any of [${BATHROOM_SLUG_CANDIDATES.join(", ")}] — Bathroom cross-listing skipped. If Bathroom has a category under a different slug, tell me its exact slug and I'll add it.`,
    );
  }

  const bedroomStorage = await resolveCategory(BEDROOM_STORAGE_SLUG);
  if (!bedroomStorage) {
    console.warn(
      `⚠ No category with slug "${BEDROOM_STORAGE_SLUG}" — Bedroom Storage cross-listing skipped.`,
    );
  } else {
    console.log(`Found bedroom storage category: "${bedroomStorage.title}"`);
  }

  const targetIds = [bathroom?._id, bedroomStorage?._id].filter(
    (id): id is string => Boolean(id),
  );
  if (!targetIds.length) {
    console.error("✗ Neither target category resolved — nothing to do.");
    return;
  }

  for (const slug of BARREL_PRODUCT_SLUGS) {
    const docs = await client.fetch<{ _id: string; title: string }[]>(
      `*[_type == "product" && slug.current == $slug]{ _id, title }`,
      { slug },
    );
    if (!docs.length) {
      console.warn(`✗ ${slug}: no product found, skipped`);
      continue;
    }
    for (const doc of docs) {
      const existingRefs = await client.fetch<string[] | null>(
        `*[_id == $id][0].additionalCategories[]._ref`,
        { id: doc._id },
      );
      const idSet = new Set(existingRefs ?? []);
      for (const id of targetIds) idSet.add(id);

      const additionalCategories = [...idSet].map((id, index) => ({
        _type: "reference" as const,
        _key: `additional-category-${index}`,
        _ref: id,
      }));
      await client.patch(doc._id).set({ additionalCategories }).commit();
    }
    console.log(
      `✓ ${slug}: cross-listed into Bathroom / Bedroom Storage (whichever resolved)`,
    );
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("cross-list-barrels-bathroom-bedroom failed:", err);
  process.exit(1);
});
