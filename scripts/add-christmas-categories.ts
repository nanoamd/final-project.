/**
 * Creates the Christmas categories, under the Decor department.
 *
 * Hill Interiors carries artificial trees and Christmas decoration, the dropship
 * account is live, and there is nowhere in the catalogue to put any of it. That is
 * the whole reason this exists — the products cannot be imported before a category
 * exists to import them into.
 *
 * **Why under Decor rather than a new department.** Decor is already a department in
 * the navigation and it holds **zero categories** — it is a nav item that goes
 * nowhere. Christmas fills it without adding a department or touching the desktop
 * nav structure. If the season sells, a dedicated Christmas department for 2027 is
 * worth revisiting; it is not worth restructuring the site on a guess.
 *
 * **Why two categories, not six.** The brief's rule is no empty product grids, and
 * that applies to categories created in advance as much as to the nineteen that were
 * already empty. Trees and decorations are the two the range definitely covers.
 * Wreaths, garlands and Christmas lighting each deserve their own page **once there
 * is stock to put in it** — splitting first produces four thin pages instead of two
 * good ones.
 *
 * **On the timing, honestly.** Mid-August is right for this, not early: Christmas
 * search volume climbs from September and peaks in late November, and a page needs
 * to be indexed and settled before then. But "artificial christmas trees" as a head
 * term is one of the most competitive retail queries in the UK and a young domain
 * will not take it this year. What is winnable is the long tail the product pages
 * carry by themselves — a specific height, a specific finish, pre-lit or not — which
 * is another reason the product titles and descriptions matter more than the
 * category page does.
 *
 * **What happens in January.** Nothing needs remembering. Both categories drop out
 * of the sitemap automatically when they hold no products, because the sitemap
 * filters on product count — so an out-of-season Christmas page is never submitted
 * to Google as thin content. It stays navigable, which is the standing instruction.
 *
 * Dry run by default:
 *   pnpm tsx --env-file=.env.local scripts/add-christmas-categories.ts
 *   pnpm tsx --env-file=.env.local scripts/add-christmas-categories.ts --apply
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

const DEPARTMENT_SLUG = "decor";

/**
 * Copy is written here rather than left for later because a category with no
 * introduction is one of the Part 3 gaps, and writing it at creation costs nothing.
 * No supplier wording is used — the standing rule holds for categories too.
 */
const CATEGORIES = [
  {
    id: "category-christmas-trees",
    slug: "christmas-trees",
    title: "Christmas Trees",
    tagline: "The one you keep for years",
    description:
      "Artificial Christmas trees chosen for the shape they hold rather than the " +
      "number of tips on the box — realistic needles, a frame that survives being " +
      "packed away each January, and heights that suit a real room rather than a " +
      "showroom. Pre-lit and unlit, so the tree fits how you decorate.",
    iconName: "trees",
    order: 0,
    metaTitle: "Christmas Trees | Realistic Artificial Trees | Kaiku",
    metaDescription:
      "Premium artificial Christmas trees — realistic pre-lit and unlit trees " +
      "built to be used for years, not one season. Free UK delivery.",
  },
  {
    id: "category-christmas-decorations",
    slug: "christmas-decorations",
    title: "Christmas Decorations",
    tagline: "Considered, not cluttered",
    description:
      "Wreaths, garlands, baubles and table pieces for a house that is decorated " +
      "rather than covered. Chosen to sit together — a restrained palette that " +
      "works with wood and stone instead of fighting it, and quality that comes " +
      "back out of the box looking the same next year.",
    iconName: "sparkles",
    order: 1,
    metaTitle: "Christmas Decorations | Wreaths, Garlands & Baubles | Kaiku",
    metaDescription:
      "Christmas wreaths, garlands, baubles and table decorations in a restrained " +
      "palette built to be reused. Free UK delivery.",
  },
] as const;

async function main() {
  // A revoked token reads as a script bug otherwise — "Unauthorized - Session not
  // found" says nothing about which credential failed.
  try {
    await client.fetch<number>(`count(*[_type=="category"])`);
  } catch (error) {
    console.error(
      `Nothing was written — Sanity rejected the write token (${(error as Error).message}).\n\n` +
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

  console.log(
    `\n${apply ? "APPLYING" : "DRY RUN"} — ${CATEGORIES.length} categories under ${department.title}\n`,
  );

  for (const category of CATEGORIES) {
    const existing = await client.fetch<{ _id: string } | null>(
      `*[_type == "category" && slug.current == $slug][0]{_id}`,
      { slug: category.slug },
    );

    console.log(
      `  ${existing ? "↻ exists, fields updated" : "+ create"}  ${category.title}  → /shop/${category.slug}`,
    );
    console.log(`      ${category.tagline}`);
    console.log(`      ${category.metaTitle}`);

    if (!apply) continue;

    const doc = {
      _id: category.id,
      _type: "category" as const,
      title: category.title,
      slug: { _type: "slug" as const, current: category.slug },
      department: { _type: "reference" as const, _ref: department._id },
      tagline: category.tagline,
      description: category.description,
      iconName: category.iconName,
      // Not "coming soon". The page carries its own copy and its onward links, and
      // a coming-soon badge on a category being stocked this week is a reason for a
      // shopper not to come back.
      comingSoon: false,
      order: category.order,
      seo: {
        _type: "seo" as const,
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription,
      },
    };

    await client.createOrReplace(doc);
  }

  if (!apply) {
    console.log("\nDry run — nothing written. Re-run with --apply.\n");
    return;
  }

  console.log(
    `\nDone. Import into them with:\n` +
      `  pnpm tsx --env-file=.env.local scripts/import-supplier-products.ts \\\n` +
      `    --csv <hill-interiors-export.csv> --category christmas-trees\n\n` +
      `Both stay out of the sitemap until they hold products, so nothing thin is\n` +
      `submitted to Google in the meantime.\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
