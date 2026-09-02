/**
 * Finds products carrying another product's content.
 *
 * Damien spotted the symptom: the Contour Collection 3 Drawer Console had the
 * Capri Outdoor Foot Stool's meta title. Checking the whole document showed it
 * also had all fifteen of the footstool's FAQs — "Is the wicker real rattan?",
 * "Can the footstool stay outside?" — on a black wood hallway console. Its own
 * title, summary and description were fine, so nothing that checks for missing
 * or thin content would ever have flagged it.
 *
 * Two independent detectors, because each catches what the other misses:
 *
 *   1. DUPLICATE SETS. Two products whose FAQ questions are identical as a list.
 *      Legitimate for genuine variants of one product (the same jar in four
 *      sizes), so a shared set is reported with both titles for judgement rather
 *      than assumed wrong.
 *
 *   2. FOREIGN RANGE NAMES. A product whose FAQ, summary or description text
 *      names a range that is not its own. "Capri" appearing in the Contour
 *      console's FAQs is the giveaway.
 *
 * Range names are taken from the catalogue's own titles and filtered hard: a
 * name must be capitalised, appear in at least two titles that share it, and not
 * be an ordinary furniture, colour or material word — otherwise "Black", "Large"
 * and "Garden" flag several hundred products each and the signal is lost.
 *
 * Read-only.
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-cross-contamination.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

/**
 * Words that begin a product title without being a range name.
 *
 * Everything here is either a material, a colour, a shape, a size, a product
 * type or an ordinary adjective. A range name is a proper noun that means
 * nothing outside this catalogue — Capri, Contour, Freska, Hampton — and that is
 * what makes its appearance in the wrong product's copy diagnostic.
 */
const NOT_A_RANGE = new Set(
  (
    "the a an and or of with for in on at from set pair large small medium tall short mini maxi " +
    "black white grey gray brown beige cream ivory natural silver gold golden bronze copper brass " +
    "chrome nickel green blue red pink purple yellow orange teal aqua clear frosted antique rustic " +
    "vintage modern contemporary classic traditional industrial scandinavian minimalist elegant " +
    "wood wooden oak teak pine walnut mango acacia bamboo rattan wicker glass metal iron steel " +
    "aluminium ceramic stoneware marble resin plastic fabric velvet linen leather stone concrete " +
    "recycled reclaimed handmade handcrafted folding portable outdoor indoor garden patio kitchen " +
    "bathroom bedroom office living solar led electric gas propane wall floor table desk side " +
    "coffee console dining bedside tv media chair stool sofa bench bed wardrobe chest drawer " +
    "shelf shelving unit cabinet mirror clock vase lamp light lantern planter pot basket tray " +
    "candle holder frame art canvas print rug screen pergola gazebo fountain feature barbecue " +
    "sauna plunge round square rectangular oval hexagonal octagonal curved slim wide deep low " +
    "high tier tiered piece seater burner drawer door panel top base stand storage box crate " +
    "tub jar bowl plate board tumbler dispenser dish rail hook cushion cover new luxury premium " +
    "decorative pre lit two three four five six seven eight nine ten"
  ).split(/\s+/),
);

interface Doc {
  _id: string;
  title: string;
  summary?: string;
  faqs?: { question?: string; answer?: string }[];
  descText?: string;
}

/** The capitalised, non-generic tokens in a title — its candidate range names. */
function rangeTokens(title: string): string[] {
  const head = title.split("|")[0] ?? title;
  return head
    .split(/[^A-Za-z]+/)
    .filter(Boolean)
    .filter(
      (word) =>
        word.length >= 4 &&
        /^[A-Z][a-z]+$/.test(word) &&
        !NOT_A_RANGE.has(word.toLowerCase()),
    );
}

async function main() {
  const docs = await client.fetch<Doc[]>(
    `*[_type=="product" && !(_id in path("drafts.**"))]{
      _id, title, summary, faqs, "descText": pt::text(description)
    }`,
  );

  /*
   * A range name has to be the FIRST word of a title to count.
   *
   * The first version of this took any capitalised non-generic word anywhere in
   * a title, which produced 818 findings and no signal: "Design", "Hanging",
   * "Warm" and "Water" all appear mid-title somewhere in 906 products, and they
   * also appear in the section headings of every description I wrote ("Design
   * and Materials"), so almost everything matched almost everything.
   *
   * A leading token is different. "Capri", "Contour", "Freska", "Hampton" lead
   * their titles because they name the range, and a range name has no reason to
   * appear in another product's copy. Still requires two products to share it —
   * a name unique to one product appears in that product's copy by right.
   */
  const nameCount = new Map<string, Set<string>>();
  for (const d of docs) {
    const lead = rangeTokens(d.title)[0];
    if (!lead) continue;
    const head = d.title.split("|")[0]?.trim() ?? "";
    // Only if it really is the first word of the title, not merely the first
    // non-generic one — "Large Reclaimed Wood Coffee Table" must not register
    // "Reclaimed" as a range.
    if (!head.startsWith(lead)) continue;
    const set = nameCount.get(lead) ?? new Set<string>();
    set.add(d._id);
    nameCount.set(lead, set);
  }
  const ranges = new Set(
    [...nameCount.entries()].filter(([, ids]) => ids.size >= 2).map(([n]) => n),
  );

  const findings: Record<string, unknown>[] = [];

  // 1. Identical FAQ question lists shared between products.
  const bySet = new Map<string, Doc[]>();
  for (const d of docs) {
    if (!d.faqs?.length) continue;
    const key = d.faqs
      .map((f) => (f.question ?? "").trim().toLowerCase())
      .join("||");
    bySet.set(key, [...(bySet.get(key) ?? []), d]);
  }
  for (const [, group] of bySet) {
    if (group.length < 2) continue;
    findings.push({
      kind: "shared FAQ set",
      count: group.length,
      titles: group.map((d) => d.title),
      ids: group.map((d) => d._id),
      firstQuestion: group[0]?.faqs?.[0]?.question,
    });
  }

  // 2. Copy naming a range that is not this product's own.
  for (const d of docs) {
    const own = new Set(rangeTokens(d.title));
    const faqText = (d.faqs ?? [])
      .map((f) => `${f.question ?? ""} ${f.answer ?? ""}`)
      .join(" ");
    /*
     * FAQs, summary and description are all checked, but the description and
     * summary were written per product in this project and carry fixed section
     * headings, so a foreign name there is far more likely to be a legitimate
     * cross-reference ("it matches the other Contour pieces") than a mistake.
     * The FAQ set is the field that gets pasted wholesale, so it is the one that
     * matters — findings are labelled by field so the two can be told apart.
     */
    for (const [field, text] of [
      ["faqs", faqText],
      ["summary", d.summary ?? ""],
      ["description", d.descText ?? ""],
    ] as const) {
      if (!text.trim()) continue;
      const foreign = [...ranges].filter(
        (name) => !own.has(name) && new RegExp(`\\b${name}\\b`).test(text),
      );
      if (foreign.length) {
        findings.push({
          kind: "foreign range name",
          field,
          id: d._id,
          title: d.title,
          foreign,
          excerpt: text
            .slice(Math.max(0, text.indexOf(foreign[0] ?? "") - 60), 200)
            .replace(/\s+/g, " "),
        });
      }
    }
  }

  const shared = findings.filter((f) => f.kind === "shared FAQ set");
  const foreign = findings.filter((f) => f.kind === "foreign range name");
  console.log(`Scanned ${docs.length} published products`);
  console.log(`Range names in use (shared by 2+ products): ${ranges.size}`);
  console.log(`\nShared FAQ sets:      ${shared.length}`);
  for (const f of shared)
    console.log(
      `  ×${f.count}  ${(f.titles as string[]).join("  ||  ")}\n        first Q: ${f.firstQuestion}`,
    );
  const foreignFaq = foreign.filter((f) => f.field === "faqs");
  console.log(`\nForeign range names in FAQs: ${foreignFaq.length}`);
  for (const f of foreignFaq)
    console.log(
      `  ${f.title}\n        names: ${(f.foreign as string[]).join(", ")}\n        ...${f.excerpt}`,
    );
  console.log(
    `\nForeign range names elsewhere (usually legitimate cross-references): ${foreign.length - foreignFaq.length}`,
  );
  for (const f of foreign.filter((f) => f.field !== "faqs"))
    console.log(
      `  [${f.field}] ${f.title}\n        names: ${(f.foreign as string[]).join(", ")}\n        ...${f.excerpt}`,
    );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/.tmp-cross-contamination.json",
    JSON.stringify(findings, null, 2),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
