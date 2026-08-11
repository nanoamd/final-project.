/**
 * Reports how products are actually distributed across departments and categories.
 *
 * Written because Outdoor Living displays only water features on the site while
 * plainly holding more than that. Two things could cause it and they need telling
 * apart: categories not being attached to the department, or products not being
 * attached to those categories.
 *
 * Also reports what `additionalCategories` is doing, because the department query
 * ignores it — it matches on `category->department` only, so a product placed in
 * Outdoor Living as a secondary category is invisible on that page.
 *
 * Read-only.
 *   pnpm tsx --env-file=.env.local scripts/audit-category-structure.ts
 */
import { createClient } from "@sanity/client";

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
  const departments = await client.fetch<
    { slug: string; name: string; order: number | null }[]
  >(
    `*[_type == "department" && !(_id in path("drafts.**"))]{"slug": slug.current, "name": title, order}|order(coalesce(order, 99) asc)`,
  );

  const categories = await client.fetch<
    {
      slug: string;
      name: string;
      department: string | null;
      primaryCount: number;
      secondaryCount: number;
    }[]
  >(`*[_type == "category" && !(_id in path("drafts.**"))]{
      "slug": slug.current,
      "name": title,
      "department": department->slug.current,
      "primaryCount": count(*[_type == "product" && !(_id in path("drafts.**")) && category._ref == ^._id]),
      "secondaryCount": count(*[_type == "product" && !(_id in path("drafts.**")) && ^._id in additionalCategories[]._ref])
    }|order(name asc)`);

  console.log(
    `\n${departments.length} departments, ${categories.length} categories\n`,
  );

  let orphanTotal = 0;
  for (const dept of departments) {
    const own = categories.filter((c) => c.department === dept.slug);
    // What the site actually shows on /shop/room/<slug>: primary category only.
    const shown = own.reduce((n, c) => n + c.primaryCount, 0);
    const alsoLinked = own.reduce((n, c) => n + c.secondaryCount, 0);
    console.log(
      `${dept.name} (${dept.slug})\n` +
        `  ${own.length} categories · ${shown} products shown on the room page` +
        (alsoLinked
          ? ` · ${alsoLinked} more attached as a secondary category`
          : ""),
    );
    for (const c of own)
      console.log(
        `    ${String(c.primaryCount).padStart(3)} primary  ${String(c.secondaryCount).padStart(3)} secondary   ${c.name}`,
      );
    if (!own.length)
      console.log("    (no categories attached to this department)");
    console.log("");
  }

  const orphans = categories.filter((c) => !c.department);
  orphanTotal = orphans.reduce((n, c) => n + c.primaryCount, 0);
  if (orphans.length) {
    console.log(
      `Categories with NO department — unreachable from any room page (${orphans.length}, ${orphanTotal} products):`,
    );
    for (const c of orphans)
      console.log(
        `    ${String(c.primaryCount).padStart(3)} primary  ${String(c.secondaryCount).padStart(3)} secondary   ${c.name} (${c.slug})`,
      );
    console.log("");
  }

  // Products whose secondary categories point somewhere their room page cannot
  // see them, which is the gap the department query leaves.
  const crossRoom = await client.fetch<
    { title: string; primary: string | null; extras: string[] | null }[]
  >(`*[_type == "product" && !(_id in path("drafts.**")) && count(additionalCategories) > 0]{
      title,
      "primary": category->department->slug.current,
      "extras": additionalCategories[]->department->slug.current
    }`);
  const invisible = crossRoom.filter((p) =>
    (p.extras ?? []).some((d) => d && d !== p.primary),
  );
  console.log(
    `${invisible.length} product(s) are placed in a category belonging to a different\n` +
      `room than their primary one. The room page query matches on the primary\n` +
      `category only, so on that other room's page they do not appear:\n`,
  );
  for (const p of invisible.slice(0, 25))
    console.log(
      `    ${p.title.slice(0, 52).padEnd(54)} primary: ${p.primary ?? "—"}  also: ${[...new Set((p.extras ?? []).filter((d) => d && d !== p.primary))].join(", ")}`,
    );
  if (invisible.length > 25)
    console.log(`    … and ${invisible.length - 25} more`);
  console.log("");
}

main().catch((err) => {
  console.error("audit-category-structure failed:", err);
  process.exit(1);
});
