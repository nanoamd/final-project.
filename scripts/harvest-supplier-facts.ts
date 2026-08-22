/**
 * Reads the facts a supplier already publishes on the product's own page.
 *
 * Damien: "Weights can be extracted from the supplier link unless they don't
 * specify." Every product carries a `sourceUrl`, and the three suppliers that
 * serve those pages normally publish a full specification block on them. This
 * reads it and records what is genuinely there.
 *
 * **Three hosts only, and that is a hard limit.** Hill Interiors, Premier
 * Housewares and AW Dropship answer an ordinary request. D.I. Designs returns a
 * challenge (202) and Aosom blocks with Akamai (403); both are left alone.
 * Nothing here defeats, evades or works around bot protection — that is a
 * standing instruction from Damien and it is not bent for a deadline. Products
 * on those two hosts are reported as unreachable, not harvested by other means.
 *
 * Polite by construction: one request at a time per host with a delay, a
 * descriptive user agent, and an on-disk cache so a re-run costs the supplier
 * nothing.
 *
 * **Never overwrites a value we already hold with a different one.** A
 * disagreement between our record and theirs is reported, not silently
 * resolved — we may have corrected a supplier's error deliberately.
 *
 *   pnpm tsx --env-file=.env.local scripts/harvest-supplier-facts.ts
 *   pnpm tsx --env-file=.env.local scripts/harvest-supplier-facts.ts --limit 40
 *   pnpm tsx --env-file=.env.local scripts/harvest-supplier-facts.ts --apply
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");
const limitArg = process.argv.indexOf("--limit");
const LIMIT =
  limitArg === -1 ? Infinity : Number(process.argv[limitArg + 1] ?? Infinity);

const CACHE = ".audit/pages";
const USER_AGENT =
  "Mozilla/5.0 (compatible; KaikuBot/1.0; +https://kaikuhome.com)";
/** Milliseconds between requests to the same host. */
const POLITE_DELAY = 400;

/** Hosts that answer an ordinary request. Nothing else is fetched. */
const FETCHABLE = new Set([
  "www.hill-interiors.com",
  "www.premierhousewares.com",
  "www.aw-dropship.com",
]);
/** Hosts behind bot protection. Recorded so the report can say why. */
const PROTECTED_HOSTS: Record<string, string> = {
  "www.aosom.co.uk": "Akamai returns 403",
  "didesigns.co.uk": "returns a 202 challenge",
};

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

export interface HarvestedFacts {
  /**
   * The supplier's own description, kept as source material only.
   *
   * Never published. Kaiku's brief is explicit that "every product is written
   * individually, not copied from the supplier's description", and this copy
   * is written for trade buyers anyway — it says things like "an ideal choice
   * for retailers seeking to meet the growing demand". It is held so that
   * facts inside it (a finish, a collection, the pieces that coordinate) can
   * be extracted and restated in Kaiku's own words.
   */
  supplierCopy?: string;
  /** Premier prints a numbered feature list; each row is a discrete fact. */
  features?: string[];
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  weightKg?: number;
  /** True when the supplier publishes only a packed/carton weight. */
  weightIsCartonOnly?: boolean;
  material?: string;
  colour?: string;
  barcode?: string;
  assembly?: string;
  /** Any other labelled spec row, for answering questions we cannot otherwise. */
  extra: Record<string, string>;
}

/** Strips tags and collapses whitespace. */
export function toText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const num = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

/**
 * Hill Interiors publishes a flat run of `Label: value` pairs:
 *   Length: 14cm Height: 33cm Width: 14cm Weight: 3.50kg CBM: 0.0200 …
 */
/**
 * The specification labels Hill Interiors actually publishes, in the order the
 * page prints them. Counted across the cached pages rather than guessed.
 */
const HILL_SPEC_LABELS = [
  "Battery Type",
  "Assembly Required",
  "Indoor Outdoor Use",
  "Candle Type",
  "Product Warning",
  "Bulb Type",
  "Wattage",
  "Care Instructions",
  "Drainage",
];

/**
 * The supplier's descriptive paragraph, from between the page furniture and
 * the specification block.
 */
export function extractSupplierCopy(text: string): string | undefined {
  const match = text.match(
    /Q&A's\s*(.{120,2400}?)(?:\s+Length:|\s+Specification|\s+PDF Download|$)/s,
  );
  const copy = match?.[1]?.replace(/\s+/g, " ").trim();
  return copy && copy.length > 120 ? copy : undefined;
}

export function parseHill(text: string): HarvestedFacts {
  const facts: HarvestedFacts = { extra: {} };
  facts.supplierCopy = extractSupplierCopy(text);
  const grab = (label: string) =>
    text.match(new RegExp(`${label}:\\s*([0-9.]+)`, "i"))?.[1];
  facts.lengthCm = num(grab("Length"));
  facts.widthCm = num(grab("Width"));
  facts.heightCm = num(grab("Height"));
  facts.weightKg = num(grab("Weight"));
  // Stop at the next label. Hill prints "Material: stone Inner Qty: 1", and a
  // greedy character class swallowed "stone Inner Qty" as the material.
  const untilNextLabel = (label: string) =>
    text
      // No "i" flag: it would make [A-Z] match lowercase, so the lookahead
      // fired on "glass" and cut "mirrored glass" down to "mirrored". Hill
      // prints these labels capitalised, so case-sensitive is correct.
      .match(
        new RegExp(`${label}:\\s*(.+?)(?=\\s+[A-Z][A-Za-z ]{1,20}:|$)`),
      )?.[1]
      ?.trim();
  facts.material = untilNextLabel("Material");
  facts.colour = untilNextLabel("Colour");
  facts.barcode = text.match(/Barcode:\s*(\d{8,14})/i)?.[1];

  // Extra labelled rows. Matched against an explicit label list rather than a
  // generic "Word: value" pattern, because the page also contains a
  // "Customers Also Bought" list full of "<product name> Code: 19994" pairs
  // that a generic pattern happily mistakes for specifications.
  //
  // "Candle Type: Use With LED Faux Candles Only" is the difference between an
  // FAQ we can answer and one we have to delete, and "Product Warning: Keep
  // Button Battery Away From Children" is a safety notice that currently
  // appears nowhere on the Kaiku page at all.
  for (const label of HILL_SPEC_LABELS) {
    const pattern = new RegExp(
      `${label}:\\s*(.+?)(?=\\s+(?:${HILL_SPEC_LABELS.join("|")}):|\\s+PDF Download|$)`,
      "i",
    );
    const value = text.match(pattern)?.[1]?.trim();
    if (value && value.length > 1 && value.length < 160)
      facts.extra[label] = value;
  }
  return facts;
}

/**
 * Premier Housewares publishes an explicit orientation, which is worth more
 * than it looks — it is the only supplier that says which axis is which:
 *   Product Dimensions w60.000000 x d3.000000 x h90.000000
 *
 * Its only weight is `Cart Weight (kg)`, which is the packed carton, not the
 * product. Recorded as such rather than as the product's weight.
 */
export function parsePremier(text: string): HarvestedFacts {
  const facts: HarvestedFacts = { extra: {} };

  // Premier leads with a written description, then a numbered feature list —
  // "Feature 1 Padded seat", "Feature 2 Cream fabric upholstery". The list is
  // the more useful half: each row is one discrete, checkable fact.
  const description = text.match(
    /(?:Product Description|Description)\s+(.{120,1200}?)(?=\s+Features\b|\s+Specification|\s+Product Dimensions)/s,
  )?.[1];
  if (description) facts.supplierCopy = description.replace(/\s+/g, " ").trim();

  const features: string[] = [];
  for (const match of text.matchAll(
    /Feature\s*\d+\s+([A-Za-z][^\n]{2,60}?)(?=\s+Feature\s*\d|\s{2,}|$)/g,
  )) {
    const value = match[1]?.replace(/\s+/g, " ").trim();
    if (value && value.length > 2 && !features.includes(value))
      features.push(value);
  }
  if (features.length) facts.features = features.slice(0, 8);
  const dims = text.match(
    /Product Dimensions\s*w([0-9.]+)\s*x\s*d([0-9.]+)\s*x\s*h([0-9.]+)/i,
  );
  if (dims) {
    facts.widthCm = num(dims[1]);
    facts.lengthCm = num(dims[2]); // depth, stored in the length field
    facts.heightCm = num(dims[3]);
  }
  const carton = num(text.match(/Cart Weight \(kg\)\s*([0-9.]+)/i)?.[1]);
  if (carton !== undefined) {
    facts.weightKg = carton;
    facts.weightIsCartonOnly = true;
  }
  // Stops before the next label. Premier prints "Materials Iron 40%,Mdf 30%,
  // Glass 30% Cart Weight (kg) 11", and a greedy class took "Cart Weight" as a
  // material.
  facts.material = text
    .match(
      /Materials\s+(.+?)(?=\s+(?:Cart|Number|Barcode|Assembly|Product|Country)\b|$)/,
    )?.[1]
    ?.trim();
  facts.barcode = text.match(/Barcode\s+(\d{8,14})/i)?.[1];
  facts.assembly = text
    .match(/Assembly Info\s+([A-Za-z ]{2,30})/i)?.[1]
    ?.trim();
  return facts;
}

export function parseAw(text: string): HarvestedFacts {
  const facts: HarvestedFacts = { extra: {} };
  facts.weightKg = num(text.match(/Weight[:\s]+([0-9.]+)\s*kg/i)?.[1]);
  const dims = text.match(
    /([0-9.]+)\s*(?:cm)?\s*[x×]\s*([0-9.]+)\s*(?:cm)?\s*[x×]\s*([0-9.]+)\s*cm/i,
  );
  if (dims) {
    facts.lengthCm = num(dims[1]);
    facts.widthCm = num(dims[2]);
    facts.heightCm = num(dims[3]);
  }
  return facts;
}

export function parseFor(host: string, text: string): HarvestedFacts {
  if (host === "www.hill-interiors.com") return parseHill(text);
  if (host === "www.premierhousewares.com") return parsePremier(text);
  return parseAw(text);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchCached(url: string): Promise<string | null> {
  mkdirSync(CACHE, { recursive: true });
  const key = createHash("sha1").update(url).digest("hex").slice(0, 20);
  const path = `${CACHE}/${key}.html`;
  if (existsSync(path)) return readFileSync(path, "utf8");
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(25_000),
    });
    if (!response.ok) return null;
    const body = await response.text();
    writeFileSync(path, body);
    await sleep(POLITE_DELAY);
    return body;
  } catch {
    return null;
  }
}

async function main() {
  const rows: {
    _id: string;
    title?: string;
    sourceUrl?: string;
    weight?: { value?: number; unit?: string };
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
      unit?: string;
    };
    gtin?: string;
  }[] = await client.fetch(
    `*[_type == "product" && defined(sourceUrl)]{ _id, title, sourceUrl, weight, dimensions, gtin }`,
  );

  const stats = {
    considered: 0,
    unreachableHost: 0,
    fetchFailed: 0,
    weightFound: 0,
    weightAlreadyHeld: 0,
    weightCartonOnly: 0,
    weightNotPublished: 0,
    dimsFound: 0,
    dimsAlreadyHeld: 0,
    conflicts: 0,
    extraSpecs: 0,
  };
  const patches: { id: string; set: Record<string, unknown> }[] = [];
  const conflicts: string[] = [];
  const notPublished: string[] = [];
  const harvested: Record<string, HarvestedFacts & { title: string }> = {};

  let processed = 0;
  for (const row of rows) {
    if (processed >= LIMIT) break;
    let host: string;
    try {
      host = new URL(row.sourceUrl!).hostname;
    } catch {
      continue;
    }
    stats.considered++;
    if (!FETCHABLE.has(host)) {
      stats.unreachableHost++;
      continue;
    }
    processed++;

    const html = await fetchCached(row.sourceUrl!);
    if (!html) {
      stats.fetchFailed++;
      continue;
    }
    const facts = parseFor(host, toText(html));
    harvested[row._id] = { ...facts, title: row.title ?? "" };
    if (Object.keys(facts.extra).length) stats.extraSpecs++;

    const set: Record<string, unknown> = {};

    // --- Weight ---------------------------------------------------------
    const held = row.weight?.value;
    if (facts.weightKg === undefined) {
      stats.weightNotPublished++;
      if (notPublished.length < 12)
        notPublished.push(`${row.title?.slice(0, 46)} (${host})`);
    } else if (facts.weightIsCartonOnly) {
      // Packed weight is not the product's weight. Counted, never written.
      stats.weightCartonOnly++;
    } else if (typeof held === "number" && held > 0) {
      stats.weightAlreadyHeld++;
      if (Math.abs(held - facts.weightKg) > 0.05) {
        stats.conflicts++;
        if (conflicts.length < 12)
          conflicts.push(
            `weight ${row.title?.slice(0, 40)}: ours ${held}kg, theirs ${facts.weightKg}kg`,
          );
      }
    } else {
      set.weight = { _type: "weight", unit: "kg", value: facts.weightKg };
      stats.weightFound++;
    }

    // --- Dimensions -----------------------------------------------------
    const heldDims = row.dimensions;
    const hasHeld =
      heldDims && (heldDims.length || heldDims.width || heldDims.height);
    if (facts.lengthCm || facts.widthCm || facts.heightCm) {
      if (hasHeld) {
        stats.dimsAlreadyHeld++;
      } else {
        set.dimensions = {
          _type: "dimensions",
          unit: "cm",
          ...(facts.lengthCm ? { length: facts.lengthCm } : {}),
          ...(facts.widthCm ? { width: facts.widthCm } : {}),
          ...(facts.heightCm ? { height: facts.heightCm } : {}),
        };
        stats.dimsFound++;
      }
    }

    // --- GTIN -----------------------------------------------------------
    if (facts.barcode && !row.gtin) set.gtin = facts.barcode;

    if (Object.keys(set).length) patches.push({ id: row._id, set });
    if (processed % 100 === 0) console.log(`  …${processed} pages read`);
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    ".audit/harvested-facts.json",
    JSON.stringify(harvested, null, 0),
  );

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — supplier facts\n`);
  console.log(`Products with a sourceUrl        ${stats.considered}`);
  console.log(`  on a host we may not fetch     ${stats.unreachableHost}`);
  for (const [host, why] of Object.entries(PROTECTED_HOSTS))
    console.log(`      ${host} — ${why}`);
  console.log(`  pages read                     ${processed}`);
  console.log(`  fetch failed                   ${stats.fetchFailed}`);
  console.log(`\nWeight`);
  console.log(`  recovered (we had none)        ${stats.weightFound}`);
  console.log(`  we already held one            ${stats.weightAlreadyHeld}`);
  console.log(
    `  supplier gives carton only     ${stats.weightCartonOnly}  (not written)`,
  );
  console.log(`  supplier does not publish it   ${stats.weightNotPublished}`);
  console.log(`\nDimensions`);
  console.log(`  recovered (we had none)        ${stats.dimsFound}`);
  console.log(`  we already held them           ${stats.dimsAlreadyHeld}`);
  console.log(`\nExtra spec rows captured on    ${stats.extraSpecs} products`);
  console.log(`Documents to patch              ${patches.length}`);

  if (conflicts.length) {
    console.log(
      `\n──── DISAGREEMENTS (${stats.conflicts}) — reported, never overwritten ────`,
    );
    conflicts.forEach((line) => console.log(`  ${line}`));
  }
  if (notPublished.length) {
    console.log(`\n──── supplier does not publish a weight ────`);
    notPublished.forEach((line) => console.log(`  ${line}`));
  }

  if (!apply) {
    console.log("\nNothing written. Re-run with --apply.");
    return;
  }
  let done = 0;
  for (const patch of patches) {
    await client.patch(patch.id).set(patch.set).commit();
    if (++done % 50 === 0) console.log(`  patched ${done}/${patches.length}`);
  }
  console.log(`\nPatched ${done} documents.`);
}

/**
 * Only run when executed directly. Without this, importing the module for a
 * test runs the whole script — which is exactly what happened: the Tier 2
 * test file was quietly performing a live Sanity fetch on every test run.
 */
const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
