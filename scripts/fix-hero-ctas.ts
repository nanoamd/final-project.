/**
 * Unsets `heroCtaPrimary` and `heroCtaSecondary` on the `homepage` singleton
 * so the hero renders the two structural CTAs defined in hero.tsx.
 *
 * The stored values were wrong and could not be made right in Studio:
 *
 *   - `heroCtaPrimary` was labelled "Shop by Room" but carried an
 *     `internalRef` to `category-pergolas`, so the main home-page button sent
 *     every visitor to the pergolas category.
 *   - The link object resolves an internal reference to a document path. The
 *     white room listing lives at `/shop/room/<room>/all`, which no document
 *     type in `link.internalRef` can produce, so the correct destination was
 *     not expressible as a reference at all.
 *
 * These two buttons are site navigation rather than editorial content, so the
 * component owns them. Both fields stay in the schema and are optional — set
 * either one in Studio and it overrides the default again.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-hero-ctas.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-hero-ctas.ts --apply
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

async function main() {
  const before = await client.fetch(
    `*[_type == "homepage"][0]{_id, heroCtaPrimary, heroCtaSecondary}`,
  );
  console.log("Before:", JSON.stringify(before, null, 2));

  if (!before?._id) {
    console.error("No homepage document found.");
    process.exit(1);
  }

  if (apply) {
    await client
      .patch(before._id)
      .unset(["heroCtaPrimary", "heroCtaSecondary"])
      .commit();
    const after = await client.fetch(
      `*[_type == "homepage"][0]{_id, heroCtaPrimary, heroCtaSecondary}`,
    );
    console.log("\nAfter:", JSON.stringify(after, null, 2));
    console.log(
      "\nApplied. Hero now renders the defaults from hero.tsx: " +
        '"Shop by Room" -> /shop/room/outdoor-living/all, ' +
        '"Shop by Category" -> /shop',
    );
  } else {
    console.log("\nDry run — pass --apply to unset these two fields.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
