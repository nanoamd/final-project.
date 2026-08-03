/**
 * Splits the single "Outdoor Saunas" category (which currently holds both
 * indoor and outdoor infrared saunas) into two proper categories, and moves
 * both — plus Cold Plunges — into the Outdoor Living department:
 *
 * 1. Creates "Indoor Saunas" (slug: indoor-saunas) if it doesn't exist yet.
 * 2. Sets both "Indoor Saunas" and the existing "Outdoor Saunas" category's
 *    department to Outdoor Living (slug: outdoor-living).
 * 3. Sets "Cold Plunges" department to Outdoor Living too.
 * 4. Moves every product currently under "Outdoor Saunas" whose title/slug
 *    mentions "indoor" over to the new "Indoor Saunas" category — this
 *    changes each product's PRIMARY category (not additionalCategories),
 *    since these are genuinely miscategorised today, not cross-listings.
 *    Every other sauna product is left exactly where it is — "Outdoor
 *    Saunas" keeps its existing slug/URL/SEO history rather than being
 *    deleted and recreated, since it's simply being narrowed to only the
 *    products that actually belong there.
 *
 * Matches drafts and published documents alike.
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/split-sauna-categories.ts
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

const OUTDOOR_LIVING_DEPARTMENT_SLUG = "outdoor-living";
const OUTDOOR_SAUNAS_SLUG = "outdoor-saunas";
const INDOOR_SAUNAS_SLUG = "indoor-saunas";
const COLD_PLUNGES_SLUG = "cold-plunges";

async function main() {
  const department = await client.fetch<{ _id: string } | null>(
    `*[_type == "department" && slug.current == $slug][0]{ _id }`,
    { slug: OUTDOOR_LIVING_DEPARTMENT_SLUG },
  );
  if (!department) {
    console.error(
      `✗ No department with slug "${OUTDOOR_LIVING_DEPARTMENT_SLUG}" — aborting.`,
    );
    process.exit(1);
  }
  const departmentRef = { _type: "reference" as const, _ref: department._id };

  const outdoorSaunas = await client.fetch<{ _id: string } | null>(
    `*[_type == "category" && slug.current == $slug][0]{ _id }`,
    { slug: OUTDOOR_SAUNAS_SLUG },
  );
  if (!outdoorSaunas) {
    console.error(
      `✗ No category with slug "${OUTDOOR_SAUNAS_SLUG}" — aborting.`,
    );
    process.exit(1);
  }

  await client
    .patch(outdoorSaunas._id)
    .set({ title: "Outdoor Saunas", department: departmentRef })
    .commit();
  console.log(`✓ "Outdoor Saunas" moved into Outdoor Living`);

  let indoorSaunas = await client.fetch<{ _id: string } | null>(
    `*[_type == "category" && slug.current == $slug][0]{ _id }`,
    { slug: INDOOR_SAUNAS_SLUG },
  );
  if (!indoorSaunas) {
    indoorSaunas = await client.create({
      _type: "category",
      title: "Indoor Saunas",
      slug: { _type: "slug", current: INDOOR_SAUNAS_SLUG },
      department: departmentRef,
      iconName: "flame",
    });
    console.log(`+ Created "Indoor Saunas" category`);
  } else {
    await client
      .patch(indoorSaunas._id)
      .set({ title: "Indoor Saunas", department: departmentRef })
      .commit();
    console.log(`✓ "Indoor Saunas" already existed — department set`);
  }

  const coldPlunges = await client.fetch<{ _id: string } | null>(
    `*[_type == "category" && slug.current == $slug][0]{ _id }`,
    { slug: COLD_PLUNGES_SLUG },
  );
  if (!coldPlunges) {
    console.warn(`⚠ No category with slug "${COLD_PLUNGES_SLUG}" — skipped.`);
  } else {
    await client
      .patch(coldPlunges._id)
      .set({ department: departmentRef })
      .commit();
    console.log(`✓ "Cold Plunges" moved into Outdoor Living`);
  }

  // Matched by the category's slug rather than outdoorSaunas._id directly —
  // if a draft and a published version of the category both exist, [0]
  // above may have resolved to either one, and a product's `category`
  // reference normally points at the published id, so an _id-based match
  // could silently find nothing.
  const saunaProducts = await client.fetch<
    { _id: string; title: string; slug: string }[]
  >(
    `*[_type == "product" && category->slug.current == $slug]{ _id, title, "slug": slug.current }`,
    { slug: OUTDOOR_SAUNAS_SLUG },
  );

  const indoorRef = {
    _type: "reference" as const,
    _ref: indoorSaunas._id,
  };
  let moved = 0;
  for (const product of saunaProducts) {
    const isIndoor =
      /indoor/i.test(product.title) || /indoor/i.test(product.slug);
    if (!isIndoor) continue;
    await client.patch(product._id).set({ category: indoorRef }).commit();
    console.log(`  → moved "${product.title}" to Indoor Saunas`);
    moved++;
  }

  console.log(
    `\nDone — ${moved} product${moved === 1 ? "" : "s"} moved to Indoor Saunas, ${
      saunaProducts.length - moved
    } left under Outdoor Saunas.`,
  );
}

main().catch((err) => {
  console.error("split-sauna-categories failed:", err);
  process.exit(1);
});
