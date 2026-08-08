/**
 * Adds Brown to the storage crates' Colour option.
 *
 * "Brown Wooden Storage Crates (Set of 3)" listed Bluewash, Greenwash and
 * Whitewash — every finish except the one in its own name. A shopper arriving
 * from a "brown wooden crates" search found three colours on offer and none of
 * them brown, which reads as the wrong product rather than a missing option.
 *
 * Brown goes first, because it is the product's own name and the default a
 * visitor expects to be selected. The other three keep their order.
 *
 * Only touches the Colour option's values. The option's _key is preserved, so
 * nothing downstream that references it by key breaks.
 *
 * Dry run by default. Add --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/add-brown-crate-colour.ts
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

const SLUG = "brown-wooden-storage-crates-set-of-3";
const COLOUR = "Brown";

interface Option {
  _key: string;
  _type: string;
  label?: string;
  values?: string[];
}

async function main() {
  const docs = await client.fetch<
    { _id: string; title: string; options: Option[] | null }[]
  >(`*[_type == "product" && slug.current == $slug]{_id, title, options}`, {
    slug: SLUG,
  });
  if (!docs.length) {
    console.error(`✗ no product with slug "${SLUG}" — aborting.`);
    process.exit(1);
  }

  const planned: {
    _id: string;
    title: string;
    index: number;
    values: string[];
  }[] = [];

  for (const doc of docs) {
    const options = doc.options ?? [];
    const index = options.findIndex(
      (o) => (o.label ?? "").toLowerCase() === "colour",
    );
    if (index === -1) {
      console.error(`✗ ${doc._id}: no Colour option to add to — aborting.`);
      process.exit(1);
    }
    const current = options[index]!.values ?? [];
    if (current.some((v) => v.toLowerCase() === COLOUR.toLowerCase())) continue;
    planned.push({
      _id: doc._id,
      title: doc.title,
      index,
      values: [COLOUR, ...current],
    });
  }

  if (!planned.length) {
    console.log("\nNothing to do — Brown is already an option.\n");
    return;
  }

  console.log("");
  for (const p of planned)
    console.log(
      `  ${p._id.startsWith("drafts.") ? "[draft] " : ""}${p.title.slice(0, 44)}\n    → ${p.values.join(", ")}`,
    );
  console.log("");

  if (!apply) {
    console.log("Dry run — nothing written. Re-run with --apply.\n");
    return;
  }
  for (const p of planned) {
    await client
      .patch(p._id)
      .set({ [`options[${p.index}].values`]: p.values })
      .commit();
    console.log(`✓ ${p.title.slice(0, 50)}: ${p.values.join(", ")}`);
  }
  console.log("\nDone.\n");
}

main().catch((err) => {
  console.error("add-brown-crate-colour failed:", err);
  process.exit(1);
});
