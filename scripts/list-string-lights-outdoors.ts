/**
 * Makes the string lights count as an outdoor product, so the garden visualiser can
 * actually use them.
 *
 * Damien asked the visualiser to *"add lighting etc and just give the kaiku
 * aesthetic"*. I told him the catalogue had no outdoor lighting at all — that was true
 * when I checked and it is not true now: **13.6m Warm White Decorative LED String
 * Lights** is published at £29. It is exactly the product those renders want, and the
 * tool cannot see it.
 *
 * Why: the visualiser's `suitsOutdoors()` accepts a product if it sits in an outdoor
 * department, or if its room tags mention Garden or Outdoor. The string lights sit in
 * `lighting` under the `lighting` department, carry no additional categories, and have
 * no room tags — so they fail both tests, and the `light` role in an outdoor set is
 * never filled. The one thing needed to make a terrace look like a Kaiku photograph is
 * invisible to the tool that stages terraces.
 *
 * Two changes, both true rather than convenient:
 *
 *   1. **Cross-list into `garden-lighting`.** That category exists and holds nothing,
 *      so it is currently excluded from the sitemap for being an empty page. String
 *      lights genuinely belong there, so this fills a real gap rather than padding a
 *      category — the thing `scripts/fill-empty-categories.ts` is careful about.
 *   2. **Tag the rooms Garden and Living room.** Warm white string lights are used in
 *      both, and the tag is what the visualiser reads.
 *
 * This does not move the product. `category` stays `lighting`, so its URL and its
 * primary home are unchanged.
 *
 *   pnpm tsx --env-file=.env.local scripts/list-string-lights-outdoors.ts
 *   pnpm tsx --env-file=.env.local scripts/list-string-lights-outdoors.ts --apply
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

const SLUG = "13-6m-warm-white-decorative-led-string-lights";
const EXTRA_CATEGORY = "garden-lighting";
const ROOM_TAGS = ["Garden", "Living room"];

async function main() {
  console.log(`\n${apply ? "APPLYING" : "DRY RUN"}\n`);

  const product = await client.fetch<{
    _id: string;
    title: string;
    extras: string[] | null;
    roomTags: string[] | null;
  } | null>(
    `*[_type == "product" && !(_id in path("drafts.**")) && slug.current == $slug][0]{
      _id, title,
      "extras": additionalCategories[]->slug.current,
      roomTags
    }`,
    { slug: SLUG },
  );

  if (!product) {
    console.log(`  !  no published product at ${SLUG}`);
    return;
  }

  const category = await client.fetch<{ _id: string; title: string } | null>(
    `*[_type == "category" && !(_id in path("drafts.**")) && slug.current == $slug][0]{ _id, title }`,
    { slug: EXTRA_CATEGORY },
  );
  if (!category) {
    console.log(`  !  no category at ${EXTRA_CATEGORY}`);
    return;
  }

  const alreadyListed = (product.extras ?? []).includes(EXTRA_CATEGORY);
  const missingTags = ROOM_TAGS.filter(
    (tag) => !(product.roomTags ?? []).includes(tag),
  );

  console.log(`  ${product.title}`);
  console.log(
    `     cross-list into ${EXTRA_CATEGORY}: ${alreadyListed ? "already there" : "yes"}`,
  );
  console.log(
    `     room tags to add: ${missingTags.length ? missingTags.join(", ") : "none"}`,
  );

  if (alreadyListed && !missingTags.length) {
    console.log("\nNothing to do.\n");
    return;
  }
  if (!apply) {
    console.log("\nDry run — nothing written.\n");
    return;
  }

  const patch = client.patch(product._id);
  if (!alreadyListed)
    patch
      .setIfMissing({ additionalCategories: [] })
      .append("additionalCategories", [
        {
          _type: "reference",
          _ref: category._id,
          _key: `extra-${EXTRA_CATEGORY}`,
        },
      ]);
  if (missingTags.length)
    patch.set({ roomTags: [...(product.roomTags ?? []), ...missingTags] });
  await patch.commit();

  console.log(
    "\nDone. The visualiser can now fill the light role in an outdoor set, and " +
      "garden-lighting is no longer an empty category.\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
