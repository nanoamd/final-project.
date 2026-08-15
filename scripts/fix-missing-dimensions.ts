/**
 * Puts dimensions on the products that have none, starting with the dearest.
 *
 * Found by asking why the garden visualiser rendered the Pennine Barrel sauna at the
 * wrong size. Damien: *"the sauna obviously isn't that big"*. The model was never told
 * how big it is — but the deeper problem is that **nobody is**, because
 * `saunaplunge-pennine-barrel-6-person-outdoor-sauna` carried
 * `{height: null, length: null, width: null, unit: null}` and no Dimensions row in its
 * specs either. A £6,379 sauna with no size anywhere on its page.
 *
 * That costs more than a bad render:
 *
 *   - a customer cannot tell whether it fits the space they have, on the single most
 *     expensive thing in the catalogue
 *   - Google Merchant Centre wants product dimensions on furniture-type items
 *   - the visualiser has nothing to scale against, which is where this started
 *
 * **The figures are the supplier's own, not estimated.** Taken from the Pennine
 * Barrel's page on outdoorliving365.co.uk — Kaiku's own supplier for the SaunaPlunge
 * range, and not one of the sites with bot protection I have refused to work around.
 * The page states 240cm (H) × 180cm (W) × 180cm (D) and about 320kg assembled.
 *
 * A note on that labelling: 240cm is almost certainly the barrel's length along its
 * axis rather than its height, since a 6-person barrel is roughly 2.4m long with a
 * 1.8m diameter. It is stored exactly as the supplier states it rather than corrected,
 * because guessing at their axes is how a wrong number ends up looking authoritative.
 * The bounding box is right either way, which is all the visualiser needs.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-missing-dimensions.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-missing-dimensions.ts --apply
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

interface Fix {
  slug: string;
  /** As the supplier states them. */
  dimensions: {
    height: number;
    width: number;
    length: number;
    unit: "cm" | "mm";
  };
  weightKg?: number;
  source: string;
}

const FIXES: Fix[] = [
  {
    slug: "saunaplunge-pennine-barrel-6-person-outdoor-sauna",
    dimensions: { height: 240, width: 180, length: 180, unit: "cm" },
    weightKg: 320,
    source:
      "outdoorliving365.co.uk/collections/saunaplunge/products/the-pennine-barrel-traditional-outdoor-luxury-6-person",
  },
];

async function main() {
  console.log(`\n${apply ? "APPLYING" : "DRY RUN"}\n`);

  for (const fix of FIXES) {
    const product = await client.fetch<{
      _id: string;
      title: string;
      dimensions?: { height?: number | null } | null;
    } | null>(
      `*[_type == "product" && !(_id in path("drafts.**")) && slug.current == $slug][0]{
        _id, title, dimensions
      }`,
      { slug: fix.slug },
    );

    if (!product) {
      console.log(`  !  ${fix.slug} — no such published product`);
      continue;
    }
    // An editor's own measurement is never overwritten; a null-filled object is not a
    // measurement, which is exactly the state this exists to fix.
    if (product.dimensions?.height) {
      console.log(`  ok ${fix.slug} already has dimensions`);
      continue;
    }

    const { height, width, length, unit } = fix.dimensions;
    console.log(
      `  →  ${fix.slug}\n     ${height} × ${width} × ${length} ${unit}` +
        (fix.weightKg ? `, ${fix.weightKg}kg` : "") +
        `\n     source: ${fix.source}`,
    );
    if (!apply) continue;

    await client
      .patch(product._id)
      .set({
        dimensions: { _type: "dimensions", height, width, length, unit },
        ...(fix.weightKg
          ? { weight: { _type: "weight", value: fix.weightKg, unit: "kg" } }
          : {}),
      })
      .commit();
  }

  // Everything else still missing, so the gap stays visible rather than being closed
  // for one product and forgotten for the rest.
  const missing = await client.fetch<{ slug: string; title: string }[]>(
    `*[_type == "product" && !(_id in path("drafts.**")) && !defined(dimensions.height)]{
      "slug": slug.current, title
    } | order(title asc)`,
  );

  console.log(
    `\n${missing.length} published product(s) still without dimensions:\n`,
  );
  for (const product of missing)
    console.log(`  ${product.slug.padEnd(46)} ${product.title.slice(0, 40)}`);

  console.log(
    apply
      ? "\nWritten. Re-run to see what is left.\n"
      : "\nDry run — nothing written.\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
