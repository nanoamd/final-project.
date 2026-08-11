/**
 * Finds everything in a product description that gives away how it was written.
 *
 * Read-only. Reports; changes nothing. The fixes live in separate scripts so that
 * what gets removed is a decision made from a list, not a side effect of a scan.
 *
 * Six kinds of problem, in rough order of how badly they read to a shopper:
 *
 *   ARTEFACT   Another retailer's name, a URL, a citation marker, or a phrase left
 *              behind by the tool that drafted the copy. A shopper who reads
 *              "according to Olivia's" on a Kaiku page learns where the text came
 *              from.
 *   DUPLICATE  Delivery, Warranty or FAQ content inside the description when the
 *              document already has deliveryNotes, warrantyNotes and faqs fields.
 *              The page renders both, so the same text appears twice.
 *   UNTITLED   A long run of paragraphs with no heading above it. This is what
 *              makes a page read as one unbroken block.
 *   STUFFING   A bullet list that is really a keyword list — "Interior Designers,
 *              Architects, Boutique Hotels, Property Developers".
 *   HEADINGS   Inconsistent capitalisation between headings in the same document.
 *   REPETITION The house phrases the brief calls out, counted across the catalogue
 *              so it is clear which are actually overused.
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-description-artefacts.ts
 *   pnpm tsx --env-file=.env.local scripts/audit-description-artefacts.ts --kind ARTEFACT
 */
import { createClient } from "@sanity/client";

const kindIndex = process.argv.indexOf("--kind");
const onlyKind =
  kindIndex === -1 ? undefined : process.argv[kindIndex + 1]?.toUpperCase();

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

interface Block {
  _type?: string;
  _key?: string;
  style?: string;
  listItem?: string;
  children?: { text?: string; marks?: string[] }[];
  markDefs?: { _type?: string; href?: string }[];
}

const text = (b: Block) =>
  (b.children ?? [])
    .map((c) => c.text ?? "")
    .join("")
    .trim();

/**
 * Retailers whose names have no business on a Kaiku page. Includes the trade
 * supplier itself: naming D.I. Designs in customer copy tells a shopper exactly
 * where to look for the same item, and the supplier is trade-only anyway.
 */
const RETAILERS = [
  "Olivia's",
  "Olivias",
  "Nicholas John",
  "Cuckooland",
  "Sweetpea",
  "Furniture Village",
  "Wayfair",
  "Made.com",
  "Barker & Stonehouse",
  "Heal's",
  "Atkin & Thyme",
  "John Lewis",
  "Dunelm",
  "Amazon",
  "Etsy",
  "eBay",
  "D.I. Designs",
  "DI Designs",
  "Dutchbone",
  "Nkuku",
];

/** Phrases that only appear when a drafting tool wrote the text. */
const TOOL_TELLS: [RegExp, string][] = [
  [/\bas an AI\b/i, "assistant self-reference"],
  [/\bI hope this helps\b/i, "chat sign-off"],
  [/\bCertainly[!,]/i, "chat opener"],
  [/\bHere('|’)s (a|the|your)\b/i, "chat opener"],
  [/\bfeel free to\b/i, "chat filler"],
  [/\bIn conclusion\b/i, "essay filler"],
  [/\bLet me know\b/i, "chat sign-off"],
  [/^note\s*:/i, "note to author"],
  [/\bSEO[- ]friendly\b/i, "note to author"],
  [/\bkeyword\b/i, "note to author"],
  [/\bplaceholder\b/i, "placeholder"],
  [/\b(TODO|FIXME|TBC|XXX)\b/, "marker"],
  [/\blorem ipsum\b/i, "filler text"],
  [/\bword count\b/i, "note to author"],
  [/\[\d+\]/, "citation marker"],
  [/【.*?】/, "citation marker"],
  [/\bsource\s*:/i, "citation"],
  [/\baccording to\b/i, "citation"],
  [/ Copy$/, "drafting label"],
];

const URL_RE = /https?:\/\/[^\s)>\]]+|\bwww\.[a-z0-9-]+\.[a-z]{2,}/i;

/** Section names that have their own field on the document. */
const OWN_FIELD_SECTIONS = [
  "delivery",
  "returns",
  "warranty",
  "faq",
  "frequently asked",
  "specification",
];

/** The phrases the brief names as overused. */
const HOUSE_PHRASES = [
  "luxury homes",
  "boutique hotel",
  "timeless craftsmanship",
  "interior designer",
  "premium materials",
  "contemporary elegance",
  "timeless",
  "effortlessly",
  "elevate",
  "focal point",
  "designed to last",
  "commercial interiors",
  "property developer",
  "show home",
  "hospitality",
];

interface Finding {
  kind: string;
  title: string;
  detail: string;
}

async function main() {
  const docs = await client.fetch<
    {
      _id: string;
      title: string;
      description: Block[] | null;
      hasDeliveryNotes: boolean;
      hasWarrantyNotes: boolean;
      faqCount: number | null;
      specCount: number | null;
    }[]
  >(`*[_type == "product" && defined(description)]{
      _id, title, description,
      "hasDeliveryNotes": defined(deliveryNotes),
      "hasWarrantyNotes": defined(warrantyNotes),
      "faqCount": count(faqs),
      "specCount": count(specs)
    }|order(title asc)`);

  const findings: Finding[] = [];
  const phraseCounts = new Map<string, number>();
  const phraseProducts = new Map<string, Set<string>>();

  for (const doc of docs) {
    const label = `${doc._id.startsWith("drafts.") ? "draft" : "live "} ${doc.title.slice(0, 46)}`;
    const blocks = (doc.description ?? []).filter((b) => b._type === "block");
    const whole = blocks.map(text).join("\n");

    for (const retailer of RETAILERS)
      if (
        new RegExp(
          `\\b${retailer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
          "i",
        ).test(whole)
      )
        findings.push({
          kind: "ARTEFACT",
          title: label,
          detail: `mentions "${retailer}"`,
        });

    for (const b of blocks) {
      const t = text(b);
      if (!t) continue;
      for (const [re, why] of TOOL_TELLS)
        if (re.test(t))
          findings.push({
            kind: "ARTEFACT",
            title: label,
            detail: `${why}: "${t.slice(0, 72)}"`,
          });
      if (URL_RE.test(t))
        findings.push({
          kind: "ARTEFACT",
          title: label,
          detail: `URL in copy: "${t.slice(0, 72)}"`,
        });
      for (const def of b.markDefs ?? [])
        if (def._type === "link" && def.href)
          findings.push({
            kind: "ARTEFACT",
            title: label,
            detail: `link to ${def.href.slice(0, 60)}`,
          });
    }

    // Sections the document already stores in a dedicated field.
    for (const b of blocks) {
      if (!b.style?.startsWith("h")) continue;
      const heading = text(b).toLowerCase();
      const match = OWN_FIELD_SECTIONS.find((s) => heading.startsWith(s));
      if (!match) continue;
      const alreadyStored =
        match === "delivery" || match === "returns"
          ? doc.hasDeliveryNotes
          : match === "warranty"
            ? doc.hasWarrantyNotes
            : match === "specification"
              ? (doc.specCount ?? 0) > 0
              : (doc.faqCount ?? 0) > 0;
      if (alreadyStored)
        findings.push({
          kind: "DUPLICATE",
          title: label,
          detail: `"${text(b)}" is in the description and in its own field`,
        });
    }

    // A long stretch with no heading above it.
    let sinceHeading = 0;
    let worst = 0;
    for (const b of blocks) {
      if (b.style?.startsWith("h")) sinceHeading = 0;
      else if (!b.listItem) sinceHeading++;
      worst = Math.max(worst, sinceHeading);
    }
    if (worst >= 5)
      findings.push({
        kind: "UNTITLED",
        title: label,
        detail: `${worst} consecutive paragraphs with no heading`,
      });

    // Bullet runs that are keyword lists: mostly two-or-three-word noun phrases,
    // no verbs, no sentences.
    const bullets = blocks.filter((b) => b.listItem).map(text);
    const naked = bullets.filter(
      (t) => t.split(/\s+/).length <= 3 && !/[.!?]$/.test(t) && !/\d/.test(t),
    );
    if (naked.length >= 12)
      findings.push({
        kind: "STUFFING",
        title: label,
        detail: `${naked.length} of ${bullets.length} bullets are bare keyword phrases`,
      });

    // Headings that do not agree on capitalisation.
    const headings = blocks
      .filter((b) => b.style?.startsWith("h"))
      .map(text)
      .filter(Boolean);
    const titleCase = headings.filter(
      (h) =>
        h.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).length >
        h.split(/\s+/).length / 2,
    ).length;
    if (headings.length >= 3 && titleCase > 0 && titleCase < headings.length)
      findings.push({
        kind: "HEADINGS",
        title: label,
        detail: `${titleCase} of ${headings.length} headings are Title Case, the rest are not`,
      });

    for (const phrase of HOUSE_PHRASES) {
      const hits = whole.toLowerCase().split(phrase).length - 1;
      if (!hits) continue;
      phraseCounts.set(phrase, (phraseCounts.get(phrase) ?? 0) + hits);
      if (!phraseProducts.has(phrase)) phraseProducts.set(phrase, new Set());
      phraseProducts.get(phrase)!.add(doc.title);
    }
  }

  const kinds = ["ARTEFACT", "DUPLICATE", "UNTITLED", "STUFFING", "HEADINGS"];
  for (const kind of kinds) {
    if (onlyKind && kind !== onlyKind) continue;
    const rows = findings.filter((f) => f.kind === kind);
    console.log(`\n=== ${kind} (${rows.length}) ===`);
    // Grouped by product, since a page is fixed as a whole.
    const byTitle = new Map<string, string[]>();
    for (const r of rows) {
      if (!byTitle.has(r.title)) byTitle.set(r.title, []);
      byTitle.get(r.title)!.push(r.detail);
    }
    for (const [title, details] of byTitle) {
      console.log(`  ${title}`);
      for (const d of [...new Set(details)].slice(0, 4))
        console.log(`      ${d}`);
      if (new Set(details).size > 4)
        console.log(`      … and ${new Set(details).size - 4} more`);
    }
    if (!rows.length) console.log("  none");
  }

  if (!onlyKind) {
    console.log(`\n=== REPETITION across ${docs.length} descriptions ===`);
    const sorted = [...phraseCounts.entries()].sort((a, b) => b[1] - a[1]);
    for (const [phrase, count] of sorted)
      console.log(
        `  ${String(count).padStart(4)} uses  ${String(phraseProducts.get(phrase)?.size ?? 0).padStart(3)} products  "${phrase}"`,
      );
  }

  console.log(
    `\n${findings.length} finding(s) across ${new Set(findings.map((f) => f.title)).size} of ${docs.length} descriptions.\n`,
  );
}

main().catch((err) => {
  console.error("audit-description-artefacts failed:", err);
  process.exit(1);
});
