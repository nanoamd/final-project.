/**
 * Writes the filter facets — colour, material, style, room, product type — onto
 * every product, from what each document already says about itself.
 *
 * The rules live in scripts/lib/product-tags.ts, which has existed for a while
 * and had never been run. Everything it does is evidence-based: each tag carries
 * the exact string it was read out of, and anything ambiguous is dropped rather
 * than guessed. The reason that matters is in that file's header, but the short
 * version is that a colour filter returning a white table when someone asked for
 * black costs more trust than an empty filter does.
 *
 * Dry run prints every tag with the text it came from, so the decisions can be
 * read before any of them are written:
 *   pnpm tsx --env-file=.env.local scripts/derive-product-tags.ts
 *   pnpm tsx --env-file=.env.local scripts/derive-product-tags.ts --apply
 *
 * `--notes` also prints the contradictions and unmapped values it found, which
 * is where the catalogue's own data problems show up.
 *
 * Published documents only, and existing values are overwritten — these fields
 * are derived, not editorial. An editor who wants to override one should change
 * the document's own text, which is the thing the site reads anyway.
 *
 * **Do not re-run this to refresh rooms or materials without reading this first.**
 * It writes `colourTags` and `primaryColour` from the product's *text*, and both
 * have since been corrected from the *photographs* by
 * `scripts/derive-image-colours.ts` — which dropped Oak from the black Grafton
 * console, Oak from the grey-washed Bentley and Black from the plain oak Broadway
 * chest. No amount of reading a title establishes any of that; the title is
 * exactly what got them wrong. Re-running this would silently put all three back,
 * and the only visible sign would be a shopper filtering Oak and being shown a
 * black steel console.
 *
 * If you need to refresh the other facets, either narrow the `set` below to the
 * fields you actually want, or re-run `derive-image-colours.ts` straight
 * afterwards to restore the colours.
 */
import { createClient } from "@sanity/client";

import {
  COLOUR_TAGS,
  MATERIAL_TAGS,
  ROOM_TAGS,
  STYLE_TAGS,
  USE_TAGS,
} from "../src/lib/catalog/facets";
import { deriveFacets, facetValues, type TagInput } from "./lib/product-tags";

const apply = process.argv.includes("--apply");
const showNotes = process.argv.includes("--notes");

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

interface Row extends TagInput {
  id: string;
}

/**
 * Every emitted tag must exist in the storefront's vocabulary.
 *
 * The schema constrains these fields to those lists, so a tag outside them is
 * not merely untidy — Studio will show it as an invalid value and the filter bar
 * will never offer it, so the product becomes unfilterable on that facet. Caught
 * here, before writing, rather than discovered as a gap in the filters later.
 */
const VOCABULARIES: Record<string, readonly string[]> = {
  primaryColour: COLOUR_TAGS,
  colourTags: COLOUR_TAGS,
  materialTags: MATERIAL_TAGS,
  styleTags: STYLE_TAGS,
  roomTags: ROOM_TAGS,
  useTags: USE_TAGS,
};

async function main() {
  const products = await client.fetch<Row[]>(
    `*[_type == "product" && !(_id in path("drafts.**"))]{
      "id": _id,
      title,
      "category": category->title,
      "categorySlug": category->slug.current,
      "extraCategorySlugs": additionalCategories[]->slug.current,
      "department": category->department->title,
      "extraDepartments": additionalCategories[]->department->title,
      "specs": specs[]{ label, value },
      "options": options[]{ label, values },
      styleTags,
      "description": pt::text(description)
    }|order(title asc)`,
  );

  console.log(
    `\n${products.length} published products. ${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  const patches: { id: string; title: string; set: Record<string, unknown> }[] =
    [];
  const coverage = new Map<string, number>();
  const allNotes: string[] = [];
  const invalid: string[] = [];

  for (const product of products) {
    const facets = deriveFacets(product);
    const values = facetValues(facets);

    // styleTags is left exactly as it is. It is an editorial field the drill-nav
    // already reads, and overwriting an editor's curation with a derivation would
    // be a regression dressed up as an improvement.
    const set: Record<string, unknown> = {
      primaryColour: values.primaryColour,
      colourTags: values.colours,
      materialTags: values.materials,
      roomTags: values.rooms,
      useTags: values.uses,
    };

    for (const [field, value] of Object.entries(set)) {
      const vocab = VOCABULARIES[field];
      if (!vocab) continue;
      for (const tag of Array.isArray(value) ? value : value ? [value] : [])
        if (!vocab.includes(String(tag)))
          invalid.push(`${field}: "${String(tag)}" (${product.title})`);
    }

    for (const [field, value] of Object.entries(set)) {
      const n = Array.isArray(value) ? value.length : value ? 1 : 0;
      if (n) coverage.set(field, (coverage.get(field) ?? 0) + 1);
    }

    patches.push({ id: product.id, title: product.title, set });

    if (!apply) {
      const line = (
        label: string,
        tags: { tag: string; evidence: string }[],
      ) =>
        tags.length
          ? `      ${label.padEnd(9)} ${tags.map((t) => t.tag).join(", ")}`
          : null;
      const parts = [
        facets.primaryColour
          ? `      primary   ${facets.primaryColour.tag}  ← ${facets.primaryColour.evidence.slice(0, 70)}`
          : null,
        line("colours", facets.colours),
        line("materials", facets.materials),
        line("styles", facets.styles),
        line("rooms", facets.rooms),
        line("type", facets.uses),
      ].filter(Boolean);
      if (parts.length) {
        console.log(`  ${product.title.slice(0, 66)}`);
        for (const part of parts) console.log(part);
      }
    }

    allNotes.push(...facets.notes.map((n) => `${product.title}: ${n}`));
  }

  if (invalid.length) {
    console.error(
      `\nAborting: ${invalid.length} tag(s) are outside the storefront vocabulary ` +
        `in src/lib/catalog/facets.ts, so the filter bar would never offer them:\n` +
        invalid
          .slice(0, 20)
          .map((i) => `  - ${i}`)
          .join("\n"),
    );
    process.exit(1);
  }

  console.log("\nCoverage");
  for (const field of Object.keys(VOCABULARIES)) {
    if (field === "styleTags") continue;
    const n = coverage.get(field) ?? 0;
    console.log(
      `  ${field.padEnd(14)} ${String(n).padStart(3)} of ${products.length} products`,
    );
  }

  if (showNotes && allNotes.length) {
    console.log(
      `\nNotes — contradictions and unmapped values (${allNotes.length})`,
    );
    for (const note of allNotes.slice(0, 60)) console.log(`  ${note}`);
    if (allNotes.length > 60)
      console.log(`  … and ${allNotes.length - 60} more`);
  } else if (allNotes.length) {
    console.log(
      `\n${allNotes.length} notes — re-run with --notes to read them`,
    );
  }

  if (!apply) {
    console.log("\nDry run — nothing written. Re-run with --apply.\n");
    return;
  }

  for (const patch of patches)
    await client.patch(patch.id).set(patch.set).commit({ visibility: "async" });

  console.log(`\nTagged ${patches.length} products.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
