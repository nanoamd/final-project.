/**
 * Creates the Garden Lighting category under Outdoor Living.
 *
 * The site has five room lighting categories — bathroom, bedroom, kitchen,
 * living room, office — and nothing for outdoors, so a solar bollard, a lamp
 * post and a pathway lantern could only be filed under the generic Lighting
 * heading. "Garden lighting" is also how people search for them, which the
 * generic category cannot rank for.
 *
 * Also back-fills existing products: any light already in the catalogue whose
 * title reads as outdoor gains Garden Lighting in `additionalCategories`, so
 * the category is stocked the moment it appears rather than being a
 * coming-soon shell. Primary categories are never changed.
 *
 * No hero image is set. The category page falls back to garden-after.jpg on
 * desktop and hides the hero entirely on mobile, so the page reads correctly
 * without one — but it is the same generic photo every other room falls back
 * to, so set a real one in Studio when you have it.
 *
 * Dry run by default. Add --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/add-garden-lighting-category.ts
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

const CATEGORY_ID = "category-garden-lighting";
const DEPARTMENT_SLUG = "outdoor-living";

/**
 * Deliberately narrower than the importer's outdoor test: this runs against
 * products already published, so a false positive puts a bedside lamp in the
 * garden rather than merely mis-sorting an import that is still a draft. Both
 * conditions must hold — it has to be a light, and it has to be outdoor.
 */
const IS_LIGHT = /\blamp\b|lantern|light|bollard|sconce|chandelier|pendant/i;
const IS_OUTDOOR =
  /solar|outdoor|garden|patio|pathway|lamp post|street light|bollard|driveway|decking/i;

async function main() {
  /**
   * The old token was revoked after it leaked into a public env var, so a dead
   * credential is the likeliest failure here. Checked up front, because
   * "Unauthorized - Session not found" on its own reads like a script bug.
   */
  try {
    await client.fetch<number>(`count(*[_type=="category"])`);
  } catch (err) {
    console.error(
      `Nothing was written — Sanity rejected the write token (${(err as Error).message}).\n\n` +
        "Get a new one:\n" +
        "  1. https://sanity.io/manage → project Kaiku → API → Tokens\n" +
        '  2. Add API token → name it "import" → permission Editor → Save\n' +
        "  3. Copy it into .env.local as SANITY_API_WRITE_TOKEN=<paste>\n" +
        "  4. Re-run this command.\n",
    );
    process.exit(1);
  }

  const department = await client.fetch<{ _id: string; title: string } | null>(
    `*[_type == "department" && slug.current == $slug][0]{_id, title}`,
    { slug: DEPARTMENT_SLUG },
  );
  if (!department) {
    console.error(`✗ No department with slug "${DEPARTMENT_SLUG}" — aborting.`);
    process.exit(1);
  }

  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "category" && slug.current == "garden-lighting"][0]{_id}`,
  );

  const doc = {
    _id: CATEGORY_ID,
    _type: "category" as const,
    title: "Garden Lighting",
    slug: { _type: "slug" as const, current: "garden-lighting" },
    department: { _type: "reference" as const, _ref: department._id },
    tagline: "Light that lasts past dusk",
    description:
      "Solar posts, pathway lanterns and outdoor floor lamps — light that " +
      "extends the evening without wiring the garden. Weather-rated, and " +
      "chosen to look considered by daylight as well as after dark.",
    iconName: "lightbulb",
    comingSoon: false,
    // 5 sits between Fire Pits (4) and Planters (7) — both gaps were free, and
    // lighting belongs beside the other things that make a garden usable at
    // night rather than at the end of the list.
    order: 5,
    seo: {
      _type: "seo" as const,
      metaTitle: "Garden Lighting | Solar & Outdoor Lights | Kaiku",
      metaDescription:
        "Outdoor and solar garden lighting — lamp posts, pathway lanterns and " +
        "weather-rated floor lamps. Free UK delivery.",
    },
  };

  // Every light in the catalogue, so the report can show what is being moved
  // and what is being left where it is.
  const lights = await client.fetch<
    { _id: string; title: string; primary: string | null; extra: string[] }[]
  >(
    `*[_type == "product" && (category->slug.current match "*lighting*" || title match "*lamp*" || title match "*light*")]{
      _id, title,
      "primary": category->slug.current,
      "extra": additionalCategories[]->slug.current
    } | order(title asc)`,
  );

  const outdoor = lights.filter(
    (p) =>
      IS_LIGHT.test(p.title) &&
      IS_OUTDOOR.test(p.title) &&
      p.primary !== "garden-lighting" &&
      !(p.extra ?? []).includes("garden-lighting"),
  );

  console.log(
    `\n${existing ? "Category already exists — will update its fields." : "Will create category:"}\n` +
      `  Garden Lighting  (/shop/garden-lighting, under ${department.title})\n`,
  );

  console.log(
    `${outdoor.length} existing product(s) to cross-list into it:\n` +
      (outdoor.length
        ? outdoor
            .map((p) => `  + ${p.title.slice(0, 62)}   [primary: ${p.primary}]`)
            .join("\n")
        : "  (none — the catalogue has no outdoor lights yet)"),
  );
  console.log("");

  if (!apply) {
    console.log("Dry run — nothing written. Re-run with --apply.\n");
    return;
  }

  await client.createOrReplace(doc);
  console.log("✓ Garden Lighting category saved.");

  for (const p of outdoor) {
    const existingRefs = await client.fetch<string[] | null>(
      `*[_id == $id][0].additionalCategories[]._ref`,
      { id: p._id },
    );
    const ids = new Set(existingRefs ?? []);
    ids.add(CATEGORY_ID);
    const additionalCategories = [...ids].map((id, index) => ({
      _type: "reference" as const,
      _key: `additional-category-${index}`,
      _ref: id,
    }));
    await client.patch(p._id).set({ additionalCategories }).commit();
    console.log(`✓ cross-listed: ${p.title.slice(0, 58)}`);
  }

  console.log(
    `\nDone. Garden Lighting now holds ${outdoor.length} product(s).\n` +
      "Set a hero image on it in Studio when you have one — until then it\n" +
      "falls back to the same generic garden photo as every other room.\n",
  );
}

void main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
