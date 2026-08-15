/**
 * Fills in the facts our drafts are missing — material, colour, weight, barcode —
 * from the supplier's own public product pages.
 *
 * **I told Damien these facts were not obtainable. That was wrong**, and he was right
 * to push back with "can you not look at the product on the website?". I had checked
 * what Sanity held and what a photograph could show, and never checked the obvious
 * third source. The supplier's page carries, in a plain specification table:
 *
 *     Colour: beige
 *     Material: fabric, metal, synthetic fibres
 *     Weight: 49.0kg
 *     Barcode: 5050140391181
 *     Length / Height / Width, CBM, inner and outer quantities, a weight warning
 *
 * That is exactly the set his handwritten descriptions quote, and it removes almost
 * all of the fill-in sheet I had just sent him.
 *
 * **Why this is not the "supplier data feed" the standing constraints forbid.** The
 * rule is: no supplier feed, every product written individually, not copied from the
 * supplier's description. This takes *facts* — a material, a colour, a weight, a
 * barcode — and never a sentence. The description text on those pages is deliberately
 * not read, not stored and not used. A barcode is not prose and a weight is not
 * copywriting; what gets written from them still gets written from scratch, per
 * product.
 *
 * **Access is checked, not assumed.** Their robots.txt disallows `/search/`,
 * `/seasonal/`, `/roomsets/`, `/products/store-locator/` and `/item/pdfview/`. It
 * allows `/item/`, and they publish a sitemap listing 1,662 item URLs. So matching
 * goes through the sitemap rather than the search endpoint I first reached for, which
 * is the one thing robots.txt actually rules out. One request at a time with a pause
 * between, because there is no reason to hammer a trade supplier's site.
 *
 * The barcode is worth more than it looks: it is a GTIN, and the Merchant Center feed
 * is currently sending `identifier_exists=no` for products that have none. Real GTINs
 * are one of the strongest signals Shopping has for matching a listing to a product.
 *
 *   pnpm tsx --env-file=.env.local scripts/enrich-from-supplier.ts
 *   pnpm tsx --env-file=.env.local scripts/enrich-from-supplier.ts --limit 8
 *   pnpm tsx --env-file=.env.local scripts/enrich-from-supplier.ts --apply
 *
 * Dry run by default; prints every fact it found and every product it could not match.
 */
import { createClient } from "@sanity/client";

import {
  HILL_DELAY_MS,
  HILL_UA,
  itemUrls,
  parseFacts,
  sleep,
  slugify,
  type SupplierFacts,
} from "./lib/hill-supplier";
import { mapColour, mapMaterials, MATERIAL_MAP } from "./lib/supplier-facets";

const apply = process.argv.includes("--apply");
const limit = (() => {
  const i = process.argv.indexOf("--limit");
  const n = i > -1 ? Number(process.argv[i + 1]) : NaN;
  return Number.isFinite(n) ? n : Infinity;
})();

const token = process.env.SANITY_API_WRITE_TOKEN;
if (apply && !token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — refusing to --apply.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

interface Draft {
  id: string;
  title: string | null;
  slug: string | null;
  supplier: string | null;
  gtin: string | null;
  sourceUrl: string | null;
  primaryColour: string | null;
  materialCount: number;
  colourCount: number;
}

const QUERY = /* groq */ `
*[_type == "product" && _id in path("drafts.**")
  && !defined(*[_id == string::split(^._id, "drafts.")[1]][0])]{
  "id": _id, title,
  "slug": slug.current,
  "supplier": supplier->name,
  gtin, sourceUrl, primaryColour,
  "materialCount": count(materialTags),
  "colourCount": count(colourTags)
} | order(title asc)`;

async function main() {
  const drafts = await client.fetch<Draft[]>(QUERY);
  const hill = drafts.filter((d) =>
    (d.supplier ?? "").toLowerCase().includes("hill"),
  );
  const urls = await itemUrls();

  console.log(
    `\n${drafts.length} unpublished drafts · ${hill.length} from Hill Interiors · ` +
      `${urls.size} item URLs in their sitemap\n${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  const matched: { draft: Draft; url: string; facts: SupplierFacts }[] = [];
  const unmatched: Draft[] = [];
  let processed = 0;

  for (const draft of hill) {
    if (processed >= limit) break;
    const key = slugify(draft.title ?? "");
    const url = urls.get(key);
    if (!url) {
      unmatched.push(draft);
      continue;
    }
    processed += 1;
    const res = await fetch(url, { headers: { "User-Agent": HILL_UA } });
    await sleep(HILL_DELAY_MS);
    if (!res.ok) {
      console.log(`  ! ${res.status}  ${key}`);
      continue;
    }
    const facts = parseFacts(await res.text());
    matched.push({ draft, url, facts });
    console.log(
      `  ✓ ${draft.title
        ?.replace(/\s*\|\s*Kaiku.*$/i, "")
        .slice(0, 44)
        .padEnd(44)}` +
        ` ${facts.material ?? "—"} · ${facts.colour ?? "—"}` +
        ` · ${facts.weightKg ? `${facts.weightKg}kg` : "—"}` +
        ` · ${facts.barcode ? `GTIN ${facts.barcode}` : "no barcode"}`,
    );
  }

  console.log(
    `\nmatched ${matched.length} · could not match ${unmatched.length}` +
      `${processed >= limit ? ` · stopped at --limit ${limit}` : ""}`,
  );
  for (const draft of unmatched.slice(0, 12))
    console.log(`   ?  ${slugify(draft.title ?? "")}`);
  if (unmatched.length > 12)
    console.log(`   … and ${unmatched.length - 12} more`);

  const withBarcode = matched.filter((m) => m.facts.barcode).length;
  const mappedColour = matched.filter((m) => mapColour(m.facts.colour)).length;
  const mappedMaterial = matched.filter(
    (m) => mapMaterials(m.facts.material).length,
  ).length;
  console.log(
    `\nof the ${matched.length} matched:\n` +
      `  ${withBarcode} barcodes (GTIN)\n` +
      `  ${mappedColour} colours map to the canonical vocabulary\n` +
      `  ${mappedMaterial} have at least one canonical material\n`,
  );

  // Anything the vocabularies cannot hold, so the gaps are visible rather than silent.
  const unmappedColours = new Set<string>();
  const unmappedMaterials = new Set<string>();
  for (const { facts } of matched) {
    if (facts.colour && !mapColour(facts.colour))
      unmappedColours.add(facts.colour.toLowerCase());
    for (const part of (facts.material ?? "").split(/,\s*/))
      if (part && !MATERIAL_MAP[part.trim().toLowerCase()])
        unmappedMaterials.add(part.trim().toLowerCase());
  }
  if (unmappedColours.size)
    console.log(
      `  colours with no canonical tag: ${[...unmappedColours].join(", ")}`,
    );
  if (unmappedMaterials.size)
    console.log(
      `  materials with no canonical tag: ${[...unmappedMaterials].join(", ")}`,
    );
  console.log();

  if (!apply) {
    console.log("Dry run — nothing written. Re-run with --apply.\n");
    return;
  }

  let written = 0;
  for (const { draft, url, facts } of matched) {
    const patch: Record<string, unknown> = {};

    const materials = mapMaterials(facts.material);
    if (materials.length && !draft.materialCount)
      patch.materialTags = materials;

    const colour = mapColour(facts.colour);
    if (colour && !draft.colourCount) patch.colourTags = [colour];
    if (colour && !draft.primaryColour) patch.primaryColour = colour;

    if (facts.barcode && !draft.gtin) patch.gtin = facts.barcode;
    if (facts.weightKg)
      patch.weight = { _type: "weight", value: facts.weightKg, unit: "kg" };

    // The supplier page this came from. Damien asked for it explicitly, and it is
    // what makes every fact above re-checkable by a person later.
    if (!draft.sourceUrl) patch.sourceUrl = url;

    /* Deliberately NOT written: deliveryLeadTime. Damien said not to fill it, and
     * "do not change lead times" is a standing constraint. The supplier's stock and
     * arrival dates are not our published lead time. */

    if (!Object.keys(patch).length) continue;
    await client.patch(draft.id).set(patch).commit();
    written += 1;
    console.log(`  ✓ ${draft.slug}  ${Object.keys(patch).join(", ")}`);
  }
  console.log(`\nWrote ${written} of ${matched.length} matched drafts.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
