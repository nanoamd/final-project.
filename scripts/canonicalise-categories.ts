/**
 * Puts every product of a type into one canonical category, and moves the
 * handful that are simply in the wrong place.
 *
 * "all mirrors should be in this category… all lighting products should be in
 * lighting… make sure we are using cross categories."
 *
 * The blocker was structural, not a matter of dragging products about. "Mirrors"
 * exists three times — under Decor, Bedroom and Bathroom — and "Lighting" six
 * times. A customer browsing mirrors saw whichever third belonged to the room
 * they came in through, so "all mirrors in Mirrors" could not be true of any of
 * the three.
 *
 * The fix is **additive**. Each family gets one canonical category, and every
 * product in a sibling is cross-listed into it via `additionalCategories`. The
 * room-specific categories keep their products and stay in the navigation —
 * nothing is hidden, which is a standing constraint — but Decor → Mirrors now
 * shows all eighteen instead of eight.
 *
 * Dry run by default. Nothing is written without `--apply`.
 *
 *   pnpm tsx scripts/canonicalise-categories.ts
 *   pnpm tsx scripts/canonicalise-categories.ts --apply
 *   pnpm tsx scripts/canonicalise-categories.ts --family=mirrors,lighting --apply
 */

import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !dataset) {
  console.error("NEXT_PUBLIC_SANITY_PROJECT_ID / _DATASET not set — aborting.");
  process.exit(1);
}

const apply = process.argv.includes("--apply");
if (apply && !token) {
  console.error("SANITY_API_WRITE_TOKEN not set — cannot apply.");
  process.exit(1);
}

const familyArg = process.argv
  .find((arg) => arg.startsWith("--family="))
  ?.slice("--family=".length);

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-10-01",
  token,
  useCdn: false,
});

/**
 * One canonical home per product type, and the room-specific categories that
 * feed it.
 *
 * The canonical choice is the one a customer would name unprompted. "Mirrors"
 * under Decor rather than Bedroom → Mirrors, because someone shopping for a
 * mirror is shopping for a mirror; which room it ends up in is their business.
 */
const FAMILIES: {
  key: string;
  canonical: string;
  siblings: string[];
}[] = [
  {
    key: "mirrors",
    canonical: "mirrors",
    siblings: ["bedroom-mirrors", "bathroom-mirrors"],
  },
  {
    key: "lighting",
    canonical: "lighting",
    siblings: [
      "bedroom-lighting",
      "bathroom-lighting",
      "kitchen-lighting",
      "living-room-lighting",
      "office-lighting",
      "garden-lighting",
    ],
  },
  {
    key: "storage",
    canonical: "living-room-storage",
    siblings: [
      "bedroom-storage",
      "bathroom-storage",
      "kitchen-storage",
      "office-storage",
      "outdoor-storage",
    ],
  },
  {
    key: "shelving",
    canonical: "shelving",
    siblings: ["kitchen-shelving", "office-shelving"],
  },
];

/**
 * Products in the wrong category outright, with the reason.
 *
 * Listed by slug rather than found by rule: these are four specific judgements
 * about four specific products, and a rule that moved products automatically
 * would eventually move one it should not have.
 */
const MOVES: { titleContains: string; to: string; why: string }[] = [
  {
    titleContains: "Tristan Mirror And Wood 4X6 Frame",
    to: "wall-art",
    why: "A 4x6 photo frame with a mirrored border. It is a frame, and it was one of two making the Mirrors page look careless.",
  },
  {
    titleContains: "Tristan Mirror And Wood 5X7 Frame",
    to: "wall-art",
    why: "As above — a 5x7 photo frame, not a mirror.",
  },
  {
    titleContains: "Antique Etched foxed Wall Art Mirror",
    to: "mirrors",
    why: "A mirror filed under Wall Art. Foxed antique glass, but still a mirror.",
  },
  {
    titleContains: "Large Grey Stone Effect Hurricane Lantern",
    to: "candles-and-lanterns",
    why: "A hurricane lantern is a candle holder, and it is not seasonal — Christmas Decorations makes it invisible for eleven months.",
  },
];

interface CategoryRef {
  id: string;
  slug: string;
  title: string;
}

interface Product {
  id: string;
  title: string;
  categorySlug: string | null;
  extras: { id: string; slug: string }[] | null;
}

async function main() {
  const selected = familyArg
    ? FAMILIES.filter((f) => familyArg.split(",").includes(f.key))
    : FAMILIES;

  if (!selected.length) {
    console.error(
      `No family matched "${familyArg}". Known: ${FAMILIES.map((f) => f.key).join(", ")}`,
    );
    process.exit(1);
  }

  const categories = await client.fetch<CategoryRef[]>(
    `*[_type == "category" && !(_id in path("drafts.**"))]{ "id": _id, "slug": slug.current, title }`,
  );
  const bySlug = new Map(categories.map((c) => [c.slug, c]));

  const products = await client.fetch<Product[]>(
    `*[_type == "product" && !(_id in path("drafts.**"))]{
      "id": _id,
      title,
      "categorySlug": category->slug.current,
      "extras": additionalCategories[]->{ "id": _id, "slug": slug.current }
    }`,
  );

  console.log(
    `${apply ? "APPLYING" : "DRY RUN"} — ${products.length} published products, ${categories.length} categories.\n`,
  );

  // --- 1. Cross-list each family into its canonical category ----------------
  let crossListed = 0;
  for (const family of selected) {
    const canonical = bySlug.get(family.canonical);
    if (!canonical) {
      console.log(`SKIP ${family.key}: no category "${family.canonical}".`);
      continue;
    }

    const members = products.filter((product) => {
      const slugs = [
        product.categorySlug,
        ...(product.extras ?? []).map((e) => e.slug),
      ].filter(Boolean);
      return family.siblings.some((sibling) => slugs.includes(sibling));
    });

    const needing = members.filter((product) => {
      const slugs = [
        product.categorySlug,
        ...(product.extras ?? []).map((e) => e.slug),
      ];
      return !slugs.includes(family.canonical);
    });

    console.log(
      `${family.key}: ${members.length} product(s) across the room categories, ` +
        `${needing.length} not yet in "${family.canonical}".`,
    );
    for (const product of needing) {
      console.log(`    + ${product.title.slice(0, 66)}`);
      if (!apply) continue;

      const extras = product.extras ?? [];
      await client
        .patch(product.id)
        .setIfMissing({ additionalCategories: [] })
        .append("additionalCategories", [
          {
            _type: "reference",
            _ref: canonical.id,
            // A stable key, so re-running cannot append a second copy under a
            // fresh random key.
            _key: `canon-${canonical.id.slice(-8)}`,
          },
        ])
        .commit();
      void extras;
      crossListed += 1;
    }
    console.log("");
  }

  // --- 2. Move the products that are simply in the wrong place ---------------
  console.log("Re-parenting the products that are in the wrong category:\n");
  let moved = 0;
  for (const move of MOVES) {
    const target = bySlug.get(move.to);
    if (!target) {
      console.log(`SKIP "${move.titleContains}": no category "${move.to}".`);
      continue;
    }
    const matches = products.filter((p) =>
      p.title.includes(move.titleContains),
    );
    if (!matches.length) {
      console.log(`NOT FOUND: ${move.titleContains}`);
      continue;
    }
    for (const product of matches) {
      if (product.categorySlug === move.to) {
        console.log(`    already in ${move.to}: ${product.title.slice(0, 56)}`);
        continue;
      }
      console.log(
        `    ${product.title.slice(0, 56)}\n        ${product.categorySlug} → ${move.to}\n        ${move.why}`,
      );
      if (!apply) continue;
      await client
        .patch(product.id)
        .set({ category: { _type: "reference", _ref: target.id } })
        .commit();
      moved += 1;
    }
  }

  console.log(
    `\n${apply ? `Done — ${crossListed} cross-listed, ${moved} moved.` : "Dry run. Re-run with --apply to write."}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
