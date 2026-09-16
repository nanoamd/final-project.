/**
 * Maps Kaiku's categories onto eBay's numeric category IDs, from eBay's own file.
 *
 * Damien: _"just find the product on the suppliers website and fill it in
 * yourself"_. The IDs are not on the supplier's website — they are eBay's own
 * taxonomy. And eBay returns 403 to automated requests on both its search and
 * its category pages, which is bot protection and not something to work around.
 *
 * So the authoritative list has to come from inside Damien's seller account,
 * and it is one download rather than nineteen lookups:
 *
 *   Seller Hub > Reports > Upload > Get template
 *     Source: Listings
 *     Type:   Create new listings template
 *
 * (Note: "File Exchange" is the old name. eBay folded it into **Seller Hub
 * Reports**, which is where the template and the category IDs now live.)
 *
 * Save whatever it gives you — CSV, or the XLSX saved as CSV — to:
 *
 *   docs/change-log/ebay-categories.csv
 *
 * Then run this. It finds the ID and name columns itself rather than assuming a
 * layout, scores every eBay category against each of ours, and PRINTS the
 * proposal for confirmation. It does not write anything.
 *
 * It prints rather than applies on purpose. Listing 127 products into the wrong
 * category is worse than listing none — eBay suppresses or removes them and it
 * counts against a new account. A fuzzy match is a suggestion, not a decision,
 * and the decision is Damien's.
 *
 *   pnpm tsx --env-file=.env.local scripts/map-ebay-categories.ts
 */
import { existsSync, readFileSync } from "node:fs";

const SOURCE = "docs/change-log/ebay-categories.csv";

/** The categories that need an ID, and the words a buyer would use for each. */
const WANTED: Record<string, string[]> = {
  lighting: ["ceiling lights", "chandeliers", "lamps", "lighting"],
  vases: ["vases", "vase"],
  "garden-furniture": [
    "garden furniture",
    "patio furniture",
    "outdoor furniture",
  ],
  "console-tables": ["console tables", "hall tables", "side tables"],
  "side-tables": ["side tables", "end tables", "occasional tables"],
  "living-room-storage": ["sideboards", "cabinets", "storage", "display units"],
  "bedside-tables": ["bedside tables", "nightstands", "bedside cabinets"],
  "candles-and-lanterns": ["candle holders", "lanterns", "candles"],
  sofas: ["sofas", "settees", "armchairs", "couches"],
  "coffee-tables": ["coffee tables"],
  "bedroom-mirrors": ["mirrors", "wall mirrors"],
  mirrors: ["mirrors", "wall mirrors"],
  "bathroom-mirrors": ["bathroom mirrors", "mirrors"],
  planters: ["plant pots", "planters", "pots", "window boxes"],
  shelving: ["shelves", "shelving", "wall shelves", "bookcases"],
  "wall-art": ["wall art", "prints", "pictures", "posters"],
  desks: ["desks", "computer desks", "writing desks"],
  "kitchen-furniture": ["kitchen furniture", "dining tables", "kitchen tables"],
  "tv-units": ["tv stands", "tv units", "entertainment units", "media units"],
  "christmas-decorations": ["christmas decorations", "christmas"],
};

/** Split a CSV line, honouring quoted fields. */
function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "",
    inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** How well an eBay category name answers one of our categories. */
function score(ebayName: string, terms: string[]): number {
  const hay = norm(ebayName);
  let best = 0;
  for (const t of terms) {
    const needle = norm(t);
    if (hay === needle) best = Math.max(best, 100);
    else if (hay.endsWith(` ${needle}`)) best = Math.max(best, 90);
    else if (hay.includes(needle)) best = Math.max(best, 70);
    else {
      const words = needle.split(" ").filter((w) => w.length > 3);
      if (words.length && words.every((w) => hay.includes(w)))
        best = Math.max(best, 55);
    }
  }
  // A leaf category beats a broad parent when both match.
  return best - Math.min(hay.split(">").length - 1, 3);
}

function main() {
  if (!existsSync(SOURCE)) {
    console.error(`\nNot found: ${SOURCE}\n`);
    console.error("Download it first:");
    console.error("  Seller Hub > Reports > Upload > Get template");
    console.error("  Source: Listings   Type: Create new listings template");
    console.error(`\nSave it as ${SOURCE} and run this again.\n`);
    process.exit(1);
  }

  const lines = readFileSync(SOURCE, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (!lines.length) {
    console.error("File is empty.");
    process.exit(1);
  }

  // Find the ID and name columns rather than assuming eBay's layout, which has
  // changed before and differs between the CSV and the XLSX export.
  let headerRow = 0,
    idCol = -1,
    nameCol = -1;
  for (let r = 0; r < Math.min(lines.length, 12); r++) {
    const cells = splitCsv(lines[r]!).map(norm);
    const id = cells.findIndex((c) => /category ?id|categoryid|^id$/.test(c));
    const nm = cells.findIndex((c) =>
      /category (name|path)|categoryname|^category$|full path/.test(c),
    );
    if (id >= 0 && nm >= 0) {
      headerRow = r;
      idCol = id;
      nameCol = nm;
      break;
    }
  }
  if (idCol < 0 || nameCol < 0) {
    console.error(
      "\nCould not find a category-ID column and a category-name column.",
    );
    console.error(
      "First row of the file, so you can tell me the right column names:\n",
    );
    console.error("  " + splitCsv(lines[0]!).slice(0, 12).join(" | "));
    process.exit(1);
  }

  const cats: { id: string; name: string }[] = [];
  for (const line of lines.slice(headerRow + 1)) {
    const c = splitCsv(line);
    const id = (c[idCol] ?? "").trim();
    const name = (c[nameCol] ?? "").trim();
    if (/^\d{3,9}$/.test(id) && name) cats.push({ id, name });
  }
  console.log(`\n${cats.length} eBay categories read from ${SOURCE}\n`);
  if (!cats.length) {
    console.error("No usable rows.");
    process.exit(1);
  }

  const lines2: string[] = [];
  let confident = 0;
  for (const [slug, terms] of Object.entries(WANTED)) {
    const ranked = cats
      .map((c) => ({ ...c, s: score(c.name, terms) }))
      .filter((c) => c.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 3);
    const top = ranked[0];
    const mark = !top ? "NO MATCH" : top.s >= 70 ? "ok" : "CHECK";
    if (top && top.s >= 70) confident++;
    console.log(`  ${slug}`);
    if (!top)
      console.log(`      no eBay category matched — set this one by hand`);
    for (const r of ranked)
      console.log(
        `      [${String(r.s).padStart(3)}] ${r.id.padEnd(8)} ${r.name.slice(0, 66)}`,
      );
    console.log(`      -> ${mark}\n`);
    lines2.push(
      `  "${slug}": "${top?.id ?? ""}",${mark === "ok" ? "" : `  // ${mark} — ${top?.name ?? "nothing matched"}`}`,
    );
  }

  console.log(
    `${confident} of ${Object.keys(WANTED).length} matched confidently.\n`,
  );
  console.log(
    "Paste into EBAY_CATEGORY_IDS in scripts/build-ebay-file-exchange.ts",
  );
  console.log("after checking anything marked CHECK or NO MATCH:\n");
  console.log(lines2.join("\n"));
  console.log("");
}

main();
