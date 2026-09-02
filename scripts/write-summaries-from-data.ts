/**
 * Writes factual summaries for the 166 products whose old summary was pure
 * supplier marketing — the ones scripts/fix-summary-marketing-voice.ts
 * deliberately refused to publish, because stripping the adjectives alone
 * would have left hollow phrasing ("an elegant addition" -> "an addition").
 *
 * These are composed from each document's own fields rather than improvised:
 * product type, materials, dimensions, weight, assembly state, bulb
 * requirement, capacity. That is a deliberate choice for this particular job.
 * A summary's role on the page is a short factual precis — the rich
 * description directly beneath it carries the detail and the voice — and 166
 * hand-improvised variations of "a console table in mango wood" would be no
 * better than a composed one while being far easier to get wrong.
 *
 * Every value written here comes from the document. Nothing is inferred.
 * Where a field is absent the clause is simply omitted, which is why the
 * output length varies.
 *
 * Anything the composer cannot make a decent sentence of is reported rather
 * than published, and gets written by hand.
 *
 *   pnpm tsx --env-file=.env.local scripts/write-summaries-from-data.ts
 *   pnpm tsx --env-file=.env.local scripts/write-summaries-from-data.ts --apply
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");
const token = process.env.SANITY_API_WRITE_TOKEN;
if (apply && !token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — refusing to --apply.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

const SOURCE_LOG =
  "docs/change-log/2026-09-02-fix-summary-marketing-voice.json";

interface Spec {
  label?: string;
  value?: string;
}
interface Product {
  _id: string;
  title: string;
  summary?: string;
  cat?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  weight?: { value?: number; unit?: string };
  specs?: Spec[];
  /** The (already rewritten) description, flattened to style + text. */
  blocks?: { style?: string; text?: string[] }[];
}

/**
 * Headings whose first paragraph describes what the product IS, and so can
 * stand as a summary.
 *
 * This restriction exists because of a real bug: the first attempt took the
 * first body paragraph of the description regardless of the heading above it.
 * On the Vitus wall clock that produced "Source wall fixings suited to your
 * wall type separately" as the summary, and on a mirror it produced a note
 * about qualified electricians. Descriptions do not all open with a materials
 * section, so the heading has to be checked.
 */
const IDENTITY_HEADING =
  /^(design|materials|what it is|what a|design and materials|materials and construction|what you get|the piece|why|scale)/i;

/** The first paragraph sitting under an identity heading, or "". */
function identityOpener(p: Product): string {
  const blocks = p.blocks ?? [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b?.style !== "h2") continue;
    const heading = (b.text ?? []).join("").trim();
    if (!IDENTITY_HEADING.test(heading)) continue;
    const next = blocks[i + 1];
    if (next?.style !== "normal") continue;
    return (next.text ?? []).join("").replace(/\s+/g, " ").trim();
  }
  return "";
}

/* ---------------------------- helpers ---------------------------- */

function name(title: string): string {
  return (title.split("|")[0] ?? title).trim();
}

/**
 * The product noun, taken from the title where the title states it, falling
 * back to the category. Longest match first so "coffee table" wins over
 * "table" and "floor lamp" over "lamp".
 */
const NOUNS = [
  "chest of drawers",
  "toothbrush holder",
  "lotion dispenser",
  "soap dispenser",
  "tissue box",
  "storage chest",
  "plant pot",
  "tumbler",
  "jar",
  "bedside table",
  "console table",
  "coffee table",
  "dining table",
  "dining chair",
  "side table",
  "wall mirror",
  "table mirror",
  "wall clock",
  "wall plaque",
  "plant stand",
  "media unit",
  "sofa bed",
  "chaise sofa",
  "floor lamp",
  "table lamp",
  "pendant light",
  "pendant shade",
  "wall lights",
  "chandelier",
  "bookshelf",
  "bookcase",
  "sideboard",
  "wall shelf",
  "privacy screen",
  "water feature",
  "fire pit table",
  "barbecue",
  "hanging chair",
  "lounge chair",
  "accent chair",
  "armchair",
  "wall art",
  "planter",
  "lantern",
  "basket",
  "bench",
  "stool",
  "sofa",
  "chair",
  "table",
  "mirror",
  "desk",
  "vase",
  "bed",
  "set",
];

const CATEGORY_NOUN: Record<string, string> = {
  "Console Tables": "console table",
  "Coffee Tables": "coffee table",
  "Side Tables": "side table",
  "Bedside Tables": "bedside table",
  "Wall Clocks": "wall clock",
  "Wall Art": "wall art",
  Mirrors: "mirror",
  Planters: "planter",
  Sofas: "sofa",
  Storage: "storage piece",
  Shelving: "shelving unit",
  "TV Units": "media unit",
  Vases: "vase",
  Desks: "desk",
  Beds: "bed",
  "Water Features": "water feature",
  "Privacy Screens": "privacy screen",
  "Candles & Lanterns": "lantern",
  Accessories: "bathroom accessory",
  Lighting: "light fitting",
  "Garden Furniture": "garden furniture piece",
  Furniture: "furniture piece",
  "Fire Pits & Heating": "fire pit table",
  "Outdoor Kitchens": "gas barbecue",
};

function productNoun(p: Product): string | null {
  const t = name(p.title).toLowerCase();
  for (const n of NOUNS) if (t.includes(n)) return n;
  return CATEGORY_NOUN[p.cat ?? ""] ?? null;
}

/** Tidy a supplier material string into a readable list. */
function materials(specs: Spec[] | undefined): string[] {
  // Anchored /^materials?$/ missed "Material Composition" and similar, which
  // is why some products composed with no materials at all on the first run.
  const raw = (specs ?? []).find((s) =>
    /^materials?\b|material composition/i.test(s.label ?? ""),
  )?.value;
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (let part of raw.split(/[,/]/)) {
    part = part
      .replace(/\(\s*\)/g, "")
      .replace(/\b\d+(\.\d+)?%/g, "")
      .replace(/\bwith\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim()
      .replace(/[.\s]+$/, "");
    if (!part) continue;
    // British spelling and sensible casing.
    let clean = part.toLowerCase().replace(/\bfiber\b/g, "fibre");
    if (clean === "mdf" || clean === "pe" || clean === "eva" || clean === "pvc")
      clean = clean.toUpperCase();
    if (clean === "pb board") clean = "engineered board";
    if (clean === "other" || clean === "100" || clean === "wires") continue;
    if (seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
  }
  return out.slice(0, 4);
}

function list(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0]!;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function dims(p: Product): string {
  const d = p.dimensions;
  if (!d || d.length == null || d.width == null || d.height == null) return "";
  const u = d.unit ?? "cm";
  return `${d.length} x ${d.width} x ${d.height}${u}`;
}

/**
 * Product weight, with a fallback into `specs`.
 *
 * Many documents store no `weight` object and put the figure in a spec
 * instead, which is why 27 products first composed too short to publish.
 *
 * "Cart Weight" is the shipped/carton weight, not the product weight, so it
 * is reported separately rather than passed off as the product's own.
 */
function weight(p: Product): { value: string; shipped: boolean } | null {
  const w = p.weight;
  if (w && w.value != null) {
    return { value: `${w.value}${w.unit ?? "kg"}`, shipped: false };
  }
  const own = spec(p, /^(weight|product weight|empty weight)$/i);
  const ownMatch = own.match(/([\d.]+)\s*(kg|g)\b/i);
  if (ownMatch) {
    return {
      value: `${ownMatch[1]}${ownMatch[2]!.toLowerCase()}`,
      shipped: false,
    };
  }
  const cart = spec(p, /^(cart weight|carton weight|packed weight)/i);
  const cartMatch = cart.match(/([\d.]+)\s*(kg|g)\b/i);
  if (cartMatch) {
    return {
      value: `${cartMatch[1]}${cartMatch[2]!.toLowerCase()}`,
      shipped: true,
    };
  }
  return null;
}

/**
 * Battery requirement, stated plainly including when a battery is NOT
 * supplied. That fact matters — a customer who buys a wall clock expecting it
 * to run and finds no battery in the box has been failed by the description,
 * and trimming "(not supplied)" to make copy read cleanly is exactly the
 * mistake this catalogue has been correcting.
 */
function batteryClause(p: Product): string {
  const b = spec(p, /batter/i);
  if (!b) return "";
  const m = b.match(/(\d+)\s*x?\s*(AA|AAA|C|D|CR\d+)/i);
  if (!m) return "";
  const notSupplied = /not supplied|not included/i.test(b);
  const usb = /usb/i.test(b);
  let s = `Takes ${m[1]} x ${m[2]!.toUpperCase()}`;
  if (usb) s += " or USB";
  if (notSupplied) s += ", not supplied";
  return `${s}.`;
}

function spec(p: Product, re: RegExp): string {
  return (
    (p.specs ?? []).find((s) => re.test(s.label ?? ""))?.value?.trim() ?? ""
  );
}

/** Reads the bulb specs into one plain clause, or "" if they say nothing. */
function bulbClause(p: Product): string {
  const bulb = spec(p, /^bulb( cap type| info| type| included)?$/i);
  const watt = spec(p, /wattage/i);
  const capLike = /^(n|no|not included)$/i;

  const cap = /e\s?1?4|e\s?2?7|g\d|gu\d|led|smd|type-?[ab]/i;
  const capType =
    (bulb.match(/\b(E14|E27|G4|G9|GU10|LED SMD|LED|Type-?A|Type-?B)\b/i) ??
      watt.match(/\b(E14|E27|G4|G9|GU10|LED)\b/i))?.[0] ?? "";
  const maxW =
    (watt.match(/(\d+)\s*W/i) ?? bulb.match(/(\d+)\s*W/i))?.[1] ?? "";
  const count = (bulb.match(/^(\d+)\s*(?:x|qty)/i) ??
    watt.match(/^(\d+)\s*x/i) ??
    watt.match(/\*\s*(\d+)/))?.[1];

  const included = /\bincluded\b/i.test(bulb) && !/not included/i.test(bulb);
  const notIncluded =
    capLike.test(bulb) || /not included|not supplied/i.test(bulb + watt);

  if (!capType && !maxW) return "";

  const parts: string[] = [];
  if (count && capType) parts.push(`Takes ${count} ${capType} bulbs`);
  else if (capType) {
    // Article by how the cap type is said aloud, not by its first letter.
    // "an E27" and "an LED" are right; "an G4" and "an GU10" are not, which
    // is what a hardcoded "an" produced on the Abira lamps.
    const an = /^(E\d|LED|SMD)/i.test(capType);
    parts.push(`Takes ${an ? "an" : "a"} ${capType} bulb`);
  } else parts.push("Takes a bulb");
  if (maxW) parts.push(`up to ${maxW}W`);
  let s = parts.join(" ");
  if (included) s += ", included";
  else if (notIncluded) s += ", not included";
  return `${s}.`;
}

function assemblyClause(p: Product): string {
  const a = spec(p, /assembl/i).toLowerCase();
  if (!a) return "";
  if (/fully assembled|^assembled$/.test(a)) return "Arrives assembled.";
  if (/requires assembly|^yes$/.test(a)) return "Assembly required.";
  return "";
}

function capacityClause(p: Product): string {
  const c = spec(p, /^(capacity|weight capacity|max(imum)? capacity)$/i);
  const m = c.match(/(\d+(?:\.\d+)?)\s*(kg|litres?|l|ml)\b/i);
  if (!m) return "";
  const unit = m[2]!.toLowerCase();
  if (unit === "kg") return `Rated to ${m[1]}kg.`;
  if (unit.startsWith("litre") || unit === "l")
    return `${m[1]} litre capacity.`;
  return `${m[1]}ml capacity.`;
}

/* ---------------------------- composer ---------------------------- */

/**
 * The register here matches the summaries written by hand in the nine
 * description batches — a noun phrase, not a sentence about the product name:
 *
 *   "A round wooden side table in grey, 45 x 45 x 60cm and 5kg."
 *
 * The first attempt opened with "The <full product name> is a <noun>", which
 * produced tautologies ("The Vertex Rectangular Basket is a basket in iron")
 * and read badly. The product name is the H1 directly above the summary on the
 * page, so repeating it in full adds nothing.
 */
function compose(p: Product): string | null {
  const noun = productNoun(p);
  if (!noun) return null;

  const mats = materials(p.specs);
  const d = dims(p);
  const w = weight(p);

  // Opening noun phrase: "A console table in mango wood, iron and brass"
  const article = /^[aeiou]/i.test(noun) ? "An" : "A";
  let first = `${article} ${noun}`;
  if (mats.length) first += ` in ${list(mats)}`;

  // Measurements join the same sentence, as they do in the hand-written ones.
  if (d && w && !w.shipped) first += `, ${d} and ${w.value}.`;
  else if (d && w) first += `, ${d}. ${w.value} shipped.`;
  else if (d) first += `, ${d}.`;
  else if (w && !w.shipped) first += `, ${w.value}.`;
  else if (w) first += `. ${w.value} shipped.`;
  else first += ".";

  const rest = [
    bulbClause(p),
    batteryClause(p),
    assemblyClause(p),
    capacityClause(p),
  ].filter(Boolean);

  const out = [first, ...rest].filter(Boolean).join(" ");
  return out.replace(/\s{2,}/g, " ").trim();
}

/**
 * Guards the description-opener fallback. Descriptions were rewritten from
 * real facts, but a handful of openers still carry the register we are trying
 * to remove — no point importing it into the summary.
 */
const MARKETING_LEFTOVER =
  /\b(elegant|stunning|luxurious|sophisticated|beautiful|perfect for|adds? a touch|transform your|elevate your)\b/i;

function looksBroken(text: string): string | null {
  const checks: [RegExp, string][] = [
    [/\bis a a\b/i, "doubled article"],
    [/\bin \./i, "empty material list"],
    [/\bTakes a bulb\.$/i, "bulb clause says nothing"],
    [/\s,/, "space before comma"],
    [/,\s*\./, "comma before stop"],
    [/\ban [bcdfgjklmnpqrstvwxyz]/i, "wrong article"],
    [/\ba [aeiou]/i, "wrong article"],
  ];
  for (const [re, why] of checks) if (re.test(text)) return why;
  return null;
}

/* ---------------------------- main ---------------------------- */

async function main() {
  const log = JSON.parse(readFileSync(SOURCE_LOG, "utf8")) as {
    tooThin: { id: string }[];
  };
  const ids = log.tooThin.map((t) => t.id);

  const docs: Product[] = await client.fetch(
    `*[_id in $ids]{
      _id, title, summary, "cat": category->title, dimensions, weight,
      "specs": specs[]{label,value},
      "blocks": description[_type == "block"]{style, "text": children[].text}
    }`,
    { ids },
  );

  const written: { id: string; before: string; after: string }[] = [];
  const skipped: { id: string; title: string; why: string }[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const doc of docs) {
    const composed = compose(doc);

    /*
     * Where the fields are too sparse to compose a substantial summary, fall
     * back to the opening paragraph of the product's own description.
     *
     * That paragraph is not raw supplier text — every published description
     * was rewritten from real facts earlier in this session, so its first line
     * is already curated prose in the right voice. Using it as the summary is
     * what a precis is meant to be, and it beats padding a composed line out
     * with words that add nothing.
     */
    /*
     * There is deliberately no fallback to the description's opening
     * paragraph. It was tried and removed: even restricted to paragraphs under
     * an identity heading, it imported uncontrolled prose into the summary —
     * "stylish and functional design", "complements any decor style", and on
     * the Cassini swivel mirror an outright hedge ("No additional details
     * regarding the finish are specified"). A short composed line built from
     * real fields is better than a longer one carrying that back in.
     */
    if (!composed) {
      skipped.push({
        id: doc._id,
        title: doc.title,
        why: "no product noun could be derived",
      });
      continue;
    }
    if (composed.length < 45) {
      skipped.push({ id: doc._id, title: doc.title, why: "too little data" });
      continue;
    }
    const broken = looksBroken(composed);
    if (broken) {
      skipped.push({ id: doc._id, title: doc.title, why: broken });
      continue;
    }
    written.push({
      id: doc._id,
      before: doc.summary ?? "",
      after: composed,
    });
    if (apply) {
      transaction.patch(doc._id, (p) => p.set({ summary: composed }));
      queued += 1;
    }
  }

  console.log(`Composed: ${written.length}`);
  console.log(`Skipped for hand-writing: ${skipped.length}\n`);
  for (const x of written.slice(0, 20)) {
    console.log(
      `${x.id}\n  was: ${x.before.slice(0, 120)}\n  now: ${x.after}\n`,
    );
  }
  if (written.length > 20) console.log(`… and ${written.length - 20} more.\n`);
  if (skipped.length) {
    console.log("--- skipped ---");
    for (const s of skipped) console.log(`  ${s.id} (${s.why}) ${s.title}`);
  }

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} summaries updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-write-summaries-from-data.json",
    JSON.stringify({ apply, queued, written, skipped }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
