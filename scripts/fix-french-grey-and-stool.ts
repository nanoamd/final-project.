/**
 * Two corrections found by looking at the photographs before writing copy about them.
 *
 * **1. The "French Grey" range is sage green.** Five products carry French Grey in
 * their title — the Alto table, the Axis chair and carver, the Kyra chair, the Echo
 * chair — and the supplier's colour field says `grey`, so the enrichment tagged them
 * Grey. The photographs show unmistakably sage-green furniture. French Grey is a paint
 * name, not a description of the finish.
 *
 * That matters more than a wrong label usually would, because colour is a *filter*.
 * scripts/lib/product-tags.ts states the principle: "A colour filter that returns a
 * white table when someone asked for black costs more trust than an empty filter
 * does." A shopper filtering Grey garden furniture would be shown four green chairs.
 *
 * `Green` rather than `Greenwash`, even though the sage is lighter than the Green
 * swatch: facets.ts is explicit that a wash is a finish where the grain shows through,
 * and these are solid painted plastic. Green is the right family; Greenwash would be a
 * different kind of wrong.
 *
 * **2. The Adjustable Tractor Seat is not a sofa.** It sits in `sofas` under
 * `living-room`. It is a tractor-seat bar stool, and the supplier's own photograph
 * shows a pair of them pulled up to a kitchen island. `kitchen-furniture` is its
 * honest home — and that category currently holds zero products, so this fills a real
 * gap rather than padding one, which is the distinction
 * scripts/fill-empty-categories.ts is careful about.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-french-grey-and-stool.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-french-grey-and-stool.ts --apply
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

async function main() {
  console.log(`\n${apply ? "APPLYING" : "DRY RUN"}\n`);

  /* ------------------------------------------------------- French Grey is green -- */

  const frenchGrey = await client.fetch<
    { _id: string; title: string; primaryColour: string | null }[]
  >(`*[_type == "product" && title match "*French Grey*"]{
    _id, title, primaryColour
  } | order(title asc)`);

  console.log(`"French Grey" products — ${frenchGrey.length}`);
  for (const row of frenchGrey) {
    const draft = row._id.startsWith("drafts.") ? "draft" : "live ";
    console.log(
      `  ${draft}  ${(row.primaryColour ?? "none").padEnd(6)} → Green   ${row.title.replace(/\s*\|\s*Kaiku.*$/, "")}`,
    );
    if (!apply) continue;
    await client
      .patch(row._id)
      .set({ primaryColour: "Green", colourTags: ["Green"] })
      .commit();
  }

  /* ------------------------------------------------------ the stool is not a sofa -- */

  const stool = await client.fetch<{ _id: string; title: string } | null>(
    `*[_type == "product" && title match "*Tractor Seat*"][0]{ _id, title }`,
  );
  const kitchen = await client.fetch<{ _id: string } | null>(
    `*[_type == "category" && !(_id in path("drafts.**")) && slug.current == "kitchen-furniture"][0]{ _id }`,
  );

  console.log(`\nAdjustable Tractor Seat`);
  if (!stool) {
    console.log("  ! not found");
  } else if (!kitchen) {
    console.log("  ! no kitchen-furniture category to move it to");
  } else {
    console.log(`  sofas → kitchen-furniture   ${stool.title}`);
    if (apply)
      await client
        .patch(stool._id)
        .set({
          category: {
            _type: "reference",
            _ref: kitchen._id,
          },
        })
        .commit();
  }

  console.log(
    apply ? "\nDone.\n" : "\nDry run — nothing written. Re-run with --apply.\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
