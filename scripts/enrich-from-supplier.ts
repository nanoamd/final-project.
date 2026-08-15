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
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@sanity/client";

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

const HOST = "https://www.hill-interiors.com";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
/** One request at a time, with this gap. A trade supplier's site is not a load test. */
const DELAY_MS = 500;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function slugify(title: string): string {
  return title
    .replace(/\s*\|\s*Kaiku.*$/i, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** The sitemap, cached on disk so repeated runs cost the supplier one request. */
async function itemUrls(): Promise<Map<string, string>> {
  const dir = path.join(process.cwd(), ".image-work");
  await mkdir(dir, { recursive: true });
  const cache = path.join(dir, "supplier-sitemap.xml");

  let xml: string;
  try {
    xml = await readFile(cache, "utf8");
  } catch {
    const res = await fetch(`${HOST}/sitemap.xml`, {
      headers: { "User-Agent": UA },
    });
    if (!res.ok) throw new Error(`sitemap.xml returned ${res.status}`);
    xml = await res.text();
    await writeFile(cache, xml, "utf8");
  }

  const map = new Map<string, string>();
  for (const match of xml.matchAll(/<loc>([^<]*\/item\/([^/<]+)\/?)<\/loc>/g)) {
    map.set(match[2]!, match[1]!);
  }
  return map;
}

/** Labels the specification table uses, and where each one belongs on our document. */
interface SupplierFacts {
  colour?: string;
  material?: string;
  weightKg?: number;
  barcode?: string;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  weightWarning?: string;
}

/**
 * Pulls the label/value pairs out of the specification table.
 *
 * Tag-stripping rather than a DOM parse, deliberately: the page is a large
 * server-rendered document and the only thing wanted is a handful of `Label:` /
 * `value` pairs, which survive flattening intact. **The description paragraph is
 * skipped on purpose** — see the note at the top of this file.
 */
export function parseFacts(html: string): SupplierFacts {
  const stripped = html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, "\n");
  const lines = stripped
    .split("\n")
    .map((line) =>
      line
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
        .replace(/&#39;|&apos;/g, "'")
        .trim(),
    )
    .filter(Boolean);

  /** The value(s) following a `Label:` line, stopping at the next label. */
  const after = (label: string): string[] => {
    const index = lines.findIndex(
      (line) => line.toLowerCase() === `${label.toLowerCase()}:`,
    );
    if (index === -1) return [];
    const values: string[] = [];
    for (let i = index + 1; i < lines.length; i++) {
      const line = lines[i]!;
      if (/^[A-Z][A-Za-z ]{2,20}:$/.test(line)) break;
      values.push(line.replace(/,$/, "").trim());
      // Multi-value fields (Material: fabric, metal, synthetic fibres) arrive as
      // separate lines each ending in a comma; a line without one ends the run.
      if (!line.endsWith(",")) break;
    }
    return values.filter(Boolean);
  };

  const one = (label: string) => after(label)[0];
  const number = (label: string) => {
    const value = one(label);
    const parsed = value
      ? Number.parseFloat(value.replace(/[^\d.]/g, ""))
      : NaN;
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const material = after("Material").join(", ") || undefined;
  const warning = one("Weight Warning");

  return {
    colour: one("Colour"),
    material,
    weightKg: number("Weight"),
    barcode: one("Barcode")?.replace(/\D/g, "") || undefined,
    lengthCm: number("Length"),
    widthCm: number("Width"),
    heightCm: number("Height"),
    weightWarning: warning && warning.length > 20 ? warning : undefined,
  };
}

/**
 * Supplier colour word → the canonical colour tag, or null.
 *
 * `primaryColour` and `colourTags` are **closed vocabularies** (see
 * src/lib/catalog/facets.ts): 20 values shared by the Studio schema, the storefront
 * filter bar and the derivation script. Writing "beige" or "silver" straight through
 * would fail Studio validation and, worse, put a value in the filter bar that no
 * shopper can match — the schema's own words are "an empty swatch is better than a
 * wrong one".
 *
 * So anything without an honest home is left out rather than forced. `silver` has no
 * entry because the vocabulary has Gold, Brass and Bronze but no silver or chrome;
 * calling a chrome lamp Grey would answer a Grey filter with a mirror finish. `clear`
 * is not a colour at all.
 */
const COLOUR_MAP: Record<string, string | null> = {
  black: "Black",
  grey: "Grey",
  gray: "Grey",
  white: "White",
  ivory: "Ivory",
  cream: "Cream",
  taupe: "Taupe",
  brown: "Brown",
  natural: "Natural",
  neutral: "Neutral",
  // Beige is the supplier's most common value and sits between Cream and Taupe.
  // Neutral exists in the vocabulary for exactly this: a warm off-white that is not
  // committing to either.
  beige: "Neutral",
  // Coffee is a brown, and Brown is in the vocabulary.
  coffee: "Brown",
  oak: "Oak",
  walnut: "Walnut",
  green: "Green",
  blue: "Blue",
  gold: "Gold",
  brass: "Brass",
  bronze: "Bronze",
  silver: null,
  chrome: null,
  clear: null,
  red: null,
  pink: null,
  yellow: null,
  orange: null,
  purple: null,
  multi: null,
};

/**
 * Supplier material word → the canonical material tag, or null.
 *
 * Two deliberate omissions. `plastic` has no entry: the vocabulary does not carry it,
 * and a plastic garden table is not Wood or Metal. `synthetic fibres` has none either
 * — it is the supplier's term for the rattan-effect weave on the outdoor sets, and the
 * Materials field says in its own description that a material the piece only imitates
 * is excluded. Tagging those Rattan would be the exact mistake the field warns about.
 *
 * `ceramic` is missing from the vocabulary rather than from this map, which is worth
 * knowing: a good number of the lamps are ceramic and currently cannot be tagged at
 * all. That is a gap to add to facets.ts, not something to fudge here.
 */
const MATERIAL_MAP: Record<string, string | null> = {
  wood: "Wood",
  oak: "Oak",
  walnut: "Walnut",
  teak: "Teak",
  birch: "Birch",
  bamboo: "Bamboo",
  metal: "Metal",
  steel: "Steel",
  brass: "Brass",
  glass: "Glass",
  marble: "Marble",
  concrete: "Concrete",
  linen: "Linen",
  velvet: "Velvet",
  fabric: "Fabric",
  chenille: "Chenille",
  resin: "Resin",
  rattan: "Rattan",
  mdf: "MDF",
  // Present in MATERIAL_GROUPS and missed on the first pass.
  "mirrored glass": "Mirrored glass",
  // Added to facets.ts after this script's dry run reported them as unmapped.
  plastic: "Plastic",
  ceramic: "Ceramic",
  stoneware: "Stoneware",
  // Still null, and deliberately. "Synthetic fibres" is the supplier's term for the
  // rattan-effect weave on the outdoor sets, and the Materials field excludes a
  // material the piece only imitates. Rope has no canonical home.
  "synthetic fibres": null,
  "synthetic fibre": null,
  rope: null,
  stone: null,
  paper: null,
  wax: null,
  cotton: null,
  jute: null,
};

const mapColour = (value?: string): string | null =>
  value ? (COLOUR_MAP[value.trim().toLowerCase()] ?? null) : null;

const mapMaterials = (value?: string): string[] =>
  value
    ? [
        ...new Set(
          value
            .split(/,\s*/)
            .map((part) => MATERIAL_MAP[part.trim().toLowerCase()] ?? null)
            .filter((tag): tag is string => Boolean(tag)),
        ),
      ]
    : [];

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
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    await sleep(DELAY_MS);
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
