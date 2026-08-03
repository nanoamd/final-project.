/**
 * Fixes why the Sauna room page (/shop/room/sauna) doesn't list "Outdoor
 * Saunas" as a subcategory even though outdoor sauna products are live and
 * browsable directly — and does the same diagnostic for Cold Plunge,
 * which is showing "coming soon" on the storefront.
 *
 * Root cause: a room/department page only shows categories whose
 * `department` reference resolves to that department's slug (see
 * `collection-index.tsx`: `categories.filter(c => c.departmentSlug ===
 * room.slug)`). If a category's `department` reference is missing or
 * points at the wrong department document, it silently drops out of that
 * room's listing even though the category itself, and its products, are
 * completely fine.
 *
 * This script:
 *   1. Ensures the "sauna" and "cold-plunge" department documents exist
 *      (matching scripts/seed-sanity.ts's original titles/order).
 *   2. Repoints the `department` reference on outdoor-saunas, indoor-saunas
 *      and wellness-accessories to the "sauna" department, and on
 *      cold-plunges to the "cold-plunge" department — but ONLY when it's
 *      currently missing or different; never touches a category whose
 *      department link is already correct.
 *   3. Prints a full diagnostic table of every category (title, slug,
 *      resolved department, live product count) so anything still wrong
 *      — e.g. a stray duplicate category — is visible rather than guessed
 *      at and silently "fixed" without evidence.
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/fix-department-links.ts
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

const DEPARTMENTS_TO_ENSURE = [
  { slug: "sauna", title: "Sauna", order: 8 },
  { slug: "cold-plunge", title: "Cold Plunge", order: 9 },
];

// category slug -> department slug it should belong to.
const CATEGORY_DEPARTMENT_FIXES: Record<string, string> = {
  "outdoor-saunas": "sauna",
  "indoor-saunas": "sauna",
  "wellness-accessories": "sauna",
  "cold-plunges": "cold-plunge",
};

async function ensureDepartment(slug: string, title: string, order: number) {
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "department" && slug.current == $slug][0]{ _id }`,
    { slug },
  );
  if (existing) return existing._id;
  const created = await client.create({
    _type: "department",
    title,
    slug: { _type: "slug", current: slug },
    order,
  });
  console.log(`+ Created missing department "${title}" (${slug})`);
  return created._id;
}

async function main() {
  const departmentIdBySlug = new Map<string, string>();
  for (const dept of DEPARTMENTS_TO_ENSURE) {
    const id = await ensureDepartment(dept.slug, dept.title, dept.order);
    departmentIdBySlug.set(dept.slug, id);
  }

  console.log("\n--- Fixing category → department links ---");
  for (const [categorySlug, departmentSlug] of Object.entries(
    CATEGORY_DEPARTMENT_FIXES,
  )) {
    const category = await client.fetch<{
      _id: string;
      title: string;
      currentDepartmentSlug: string | null;
    } | null>(
      `*[_type == "category" && slug.current == $slug][0]{
        _id, title, "currentDepartmentSlug": department->slug.current
      }`,
      { slug: categorySlug },
    );
    if (!category) {
      console.warn(`✗ No category with slug "${categorySlug}" — skipped.`);
      continue;
    }
    if (category.currentDepartmentSlug === departmentSlug) {
      console.log(
        `- "${category.title}" (${categorySlug}): already linked to "${departmentSlug}", left alone.`,
      );
      continue;
    }
    const departmentId = departmentIdBySlug.get(departmentSlug)!;
    await client
      .patch(category._id)
      .set({ department: { _type: "reference", _ref: departmentId } })
      .commit();
    console.log(
      `✓ "${category.title}" (${categorySlug}): department was "${category.currentDepartmentSlug ?? "none"}" → now "${departmentSlug}".`,
    );
  }

  console.log("\n--- Full category diagnostic (for review) ---");
  const allCategories = await client.fetch<
    {
      title: string;
      slug: string;
      departmentSlug: string | null;
      productCount: number;
    }[]
  >(`*[_type == "category"]{
    title,
    "slug": slug.current,
    "departmentSlug": department->slug.current,
    "productCount": count(*[_type == "product"
      && (category->slug.current == ^.slug.current
          || ^.slug.current in additionalCategories[]->slug.current)])
  } | order(title asc)`);

  for (const c of allCategories) {
    console.log(
      `  ${c.title.padEnd(36)} slug=${(c.slug ?? "?").padEnd(28)} department=${(c.departmentSlug ?? "NONE").padEnd(14)} products=${c.productCount}`,
    );
  }

  console.log(
    "\nDone. If Cold Plunge still looks empty/wrong after this, check the diagnostic table above for a category whose product count is 0 or whose slug looks like a duplicate, and paste it back so the right fix can be made — not guessed at.",
  );
}

main().catch((err) => {
  console.error("fix-department-links failed:", err);
  process.exit(1);
});
