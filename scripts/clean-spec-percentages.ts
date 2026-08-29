/**
 * Takes the supplier's percentage composition out of the Materials spec.
 *
 * Damien, on a description: *"90% 10% what is the need in saying that, you
 * have weird descriptions"*. That pass cleaned the prose and left the spec
 * table alone, so the Mize over-door mirror still shows
 *
 *   Materials: Glass 63%, Iron 5%, Paper 9%, Plastic 23%
 *
 * on the live page, and five wire baskets proudly declare "Iron 100%". It is
 * the supplier's manufacturing breakdown, printed at a shopper deciding
 * whether a mirror suits their hallway. Nobody has ever wanted it.
 *
 * `dominantMaterial` already exists and is tested: it takes the largest
 * component, ignores 0% entries, and drops feed column names like "cart
 * weight". "Glass 63%, Iron 5%, Paper 9%, Plastic 23%" becomes "Glass"; "Iron
 * 100%" becomes "Iron".
 *
 * Only the value is rewritten, and only when it actually carries percentages —
 * a spec already reading "Solid Oak" is left exactly as it is.
 *
 *   pnpm tsx --env-file=.env.local scripts/clean-spec-percentages.ts
 *   pnpm tsx --env-file=.env.local scripts/clean-spec-percentages.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { formatMaterialSpec, hasPercentages } from "@/lib/catalog/percentages";

const apply = process.argv.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

interface Spec {
  _key?: string;
  label?: string;
  value?: string;
}

interface Product {
  _id: string;
  title: string;
  specs?: Spec[] | null;
}

async function main() {
  const products = await client.fetch<Product[]>(
    `*[_type == "product" && defined(specs)]{ _id, title, specs }`,
  );

  const changes: {
    _id: string;
    title: string;
    label: string;
    from: string;
    to: string;
  }[] = [];
  const unresolved: string[] = [];

  for (const product of products) {
    const specs = product.specs ?? [];
    let touched = false;
    const next = specs.map((spec) => {
      const value = spec?.value;
      if (typeof value !== "string" || !hasPercentages(value)) return spec;

      const cleaned = formatMaterialSpec(value);
      if (!cleaned) {
        // Nothing usable survives — leave it rather than blank the spec, and
        // report it so it can be looked at by hand.
        unresolved.push(`${product.title} :: ${spec.label}: ${value}`);
        return spec;
      }
      changes.push({
        _id: product._id,
        title: product.title,
        label: spec.label ?? "",
        from: value,
        to: cleaned,
      });
      touched = true;
      return { ...spec, value: cleaned };
    });

    if (touched && apply) {
      try {
        await client.patch(product._id).set({ specs: next }).commit();
      } catch (error) {
        // A draft deleted mid-run must not abandon the rest of the catalogue.
        console.log(`  FAILED ${product.title}: ${(error as Error).message}`);
      }
    }
  }

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — percentages in specs\n`);
  for (const change of changes.slice(0, 25))
    console.log(
      `  ${change.title.slice(0, 46).padEnd(46)} ${change.label}: "${change.from}" -> "${change.to}"`,
    );
  if (changes.length > 25) console.log(`  … and ${changes.length - 25} more`);

  const products_touched = new Set(changes.map((c) => c._id)).size;
  console.log(`\n${changes.length} specs across ${products_touched} products.`);
  if (unresolved.length) {
    console.log(`\n${unresolved.length} left alone (no material survived):`);
    for (const line of unresolved.slice(0, 10)) console.log(`  ${line}`);
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-spec-percentages.json`,
    JSON.stringify({ applied: apply, changes, unresolved }, null, 2),
  );

  if (!apply) console.log("\nNothing written. Re-run with --apply.");
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
