/**
 * Fills empty categories from products Kaiku already sells.
 *
 * 19 of 41 categories hold nothing. The assumption had been that this needs new
 * suppliers, and no supplier is replying — but eight of the nineteen can be filled
 * from the existing catalogue, because the products in question genuinely belong in
 * more than one room and were only ever filed under one.
 *
 * The clearest case: four gesso table lamps sit in `lighting` and nowhere else,
 * with **no room tags at all**. A table lamp is a living-room, bedroom and office
 * light by definition. Three empty categories, filled by admitting what the
 * product already is.
 *
 * **The rule, and it is a narrow one.** A product is cross-listed only where its
 * *type* genuinely serves that room. This is additive — `additionalCategories`, so
 * the product keeps its home category and its URL never moves — and it is
 * reversible by removing the reference.
 *
 * **What is deliberately refused, because a wrong category is worse than an empty
 * one.** A shopper who taps Kitchen Lighting and gets a table lamp learns the
 * navigation lies, and that costs more than the empty page did:
 *
 *   - **Bathroom lighting** gets nothing. Bathroom fittings need an IP rating for
 *     the zone they are installed in. Listing a table lamp there is not a
 *     miscategorisation, it is an electrical safety problem.
 *   - **Kitchen lighting** gets nothing. Kitchens are lit from the ceiling and
 *     under the cabinets. There are no pendants or strips in the catalogue.
 *   - **Rugs, towel rails, water features, fire pits, garden lighting, privacy
 *     screens, bathroom accessories and kitchen furniture** get nothing. There is
 *     no product in the catalogue that is any of those things, and no amount of
 *     tagging invents one. These are the eleven that genuinely need stock.
 *   - **Pergolas** is untouched under the standing instruction.
 *
 * Dry run by default:
 *   pnpm tsx --env-file=.env.local scripts/fill-empty-categories.ts
 *   pnpm tsx --env-file=.env.local scripts/fill-empty-categories.ts --apply
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
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  useCdn: false,
  token,
});

/**
 * Which empty category each kind of product belongs in, and the justification.
 *
 * Matched on the product's own `useTags` — the derived product-type facet — rather
 * than on its title, so this cannot be fooled by a name. Every rule below is a
 * claim about what the object is for, and each one has to survive the test: would
 * a shopper who tapped this category be pleased to find this product?
 */
const RULES: {
  category: string;
  useTags: string[];
  /** Product titles to exclude even when the tag matches. */
  except?: RegExp;
  why: string;
}[] = [
  {
    category: "bedroom-mirrors",
    useTags: ["Mirror"],
    why: "A wall mirror is a bedroom mirror. Both Hampton mirrors are filed under bathroom-mirrors only, and neither is a bathroom-specific fitting.",
  },
  {
    category: "living-room-lighting",
    useTags: ["Lighting"],
    why: "A table lamp is a living-room light. All four gesso lamps sit in `lighting` and nowhere else.",
  },
  {
    category: "bedroom-lighting",
    useTags: ["Lighting"],
    why: "A table lamp is what stands on a bedside table.",
  },
  {
    category: "office-lighting",
    useTags: ["Lighting"],
    why: "A table lamp is a desk light.",
  },
  {
    category: "office-storage",
    useTags: ["Storage"],
    // First pass matched 22 products, which is padding rather than a category: it
    // swept in TV stands and console tables because their useTags include Storage.
    // A sideboard is a credenza and belongs; a TV stand does not, and a console
    // table is a hallway piece. A bedside table is furniture for beside a bed.
    except: /bedside|tv (unit|stand)|console/i,
    why: "Chests, sideboards (an office credenza is a sideboard) and storage crates are how an office stores things. TV stands, console tables and bedside tables excluded — nobody furnishes an office with those.",
  },
  {
    category: "kitchen-storage",
    useTags: ["Storage"],
    // Kitchen storage means crates, tubs, barrels and open units — not a chest of
    // drawers or a sideboard, which belong in a dining room at best.
    except: /bedside|chest of drawers|sideboard|tv (unit|stand)|console/i,
    why: "Wooden crates, tubs and barrel stools are kitchen storage. Chests of drawers, sideboards, TV units and consoles excluded — they are not.",
  },
  {
    category: "kitchen-shelving",
    useTags: ["Shelving"],
    // A unit named a TV stand reads as a lie in a shelving category, whatever its
    // tags say it also is.
    except: /tv (unit|stand)/i,
    why: "Open teak display and log shelving works in a kitchen as well as a living room. TV stands excluded — the name is what a shopper reads.",
  },
  {
    category: "office-shelving",
    useTags: ["Shelving"],
    except: /tv (unit|stand)/i,
    why: "Open shelving is open shelving, and an office is its most common home after a living room. TV stands excluded.",
  },
];

interface Product {
  id: string;
  title: string;
  home: string | null;
  extra: string[] | null;
  useTags: string[] | null;
}

async function main() {
  const categories = await client.fetch<
    { id: string; slug: string; title: string; count: number }[]
  >(
    `*[_type == "category" && !(_id in path("drafts.**")) && defined(slug.current)]{
      "id": _id, "slug": slug.current, title,
      "count": count(*[_type == "product" && !(_id in path("drafts.**")) && references(^._id)])
    }`,
  );
  const bySlug = new Map(categories.map((c) => [c.slug, c]));

  const products = await client.fetch<Product[]>(
    `*[_type == "product" && !(_id in path("drafts.**"))]{
      "id": _id, title,
      "home": category->slug.current,
      "extra": additionalCategories[]->slug.current,
      useTags
    }|order(title asc)`,
  );

  console.log(
    `\n${products.length} published products, ${categories.filter((c) => !c.count).length} empty categories. ${
      apply ? "APPLYING" : "DRY RUN"
    }\n`,
  );

  /** category id -> product ids to add */
  const additions = new Map<
    string,
    { category: string; products: Product[] }
  >();

  for (const rule of RULES) {
    const category = bySlug.get(rule.category);
    if (!category) {
      console.log(`  !  ${rule.category} — no such category, skipped`);
      continue;
    }
    // Only ever used to fill something empty. If a category has picked up stock
    // since this was written, leave it to its own products rather than padding it.
    if (category.count > 0) {
      console.log(
        `  ·  ${rule.category} — already holds ${category.count}, left alone`,
      );
      continue;
    }

    const matched = products.filter((product) => {
      if (!(product.useTags ?? []).some((tag) => rule.useTags.includes(tag)))
        return false;
      if (rule.except?.test(product.title)) return false;
      // Already listed there.
      if ((product.extra ?? []).includes(rule.category)) return false;
      if (product.home === rule.category) return false;
      return true;
    });

    if (!matched.length) {
      console.log(`  ?  ${rule.category} — nothing in the catalogue qualifies`);
      continue;
    }

    console.log(`  →  ${rule.category}  (+${matched.length})`);
    console.log(`      ${rule.why}`);
    for (const product of matched)
      console.log(`        · ${product.title.slice(0, 62)}`);

    additions.set(category.id, { category: rule.category, products: matched });
  }

  const totalLinks = [...additions.values()].reduce(
    (n, a) => n + a.products.length,
    0,
  );
  console.log(
    `\n${additions.size} categories would be filled with ${totalLinks} listings.`,
  );

  const stillEmpty = categories
    .filter((c) => !c.count && !additions.has(c.id))
    .map((c) => c.slug);
  console.log(
    `\n${stillEmpty.length} categories still need real stock — no existing product is one of these:\n  ${stillEmpty.join(", ")}`,
  );

  if (!apply) {
    console.log("\nDry run — nothing written. Re-run with --apply.\n");
    return;
  }

  // Written per product rather than per category: `additionalCategories` lives on
  // the product, and one product can gain several categories in this run.
  const perProduct = new Map<
    string,
    { title: string; categoryIds: string[] }
  >();
  for (const [categoryId, addition] of additions)
    for (const product of addition.products) {
      const entry = perProduct.get(product.id) ?? {
        title: product.title,
        categoryIds: [],
      };
      entry.categoryIds.push(categoryId);
      perProduct.set(product.id, entry);
    }

  for (const [productId, entry] of perProduct) {
    await client
      .patch(productId)
      .setIfMissing({ additionalCategories: [] })
      .append(
        "additionalCategories",
        entry.categoryIds.map((id) => ({
          _type: "reference",
          _ref: id,
          _key: `fill-${id.replace(/[^a-zA-Z0-9]/g, "")}`,
        })),
      )
      .commit({ visibility: "async" });
    console.log(
      `  + ${entry.title.slice(0, 56)} → ${entry.categoryIds.length}`,
    );
  }

  console.log(
    `\nAdded ${totalLinks} listings across ${additions.size} categories.\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
