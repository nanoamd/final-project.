/**
 * Reading Hill Interiors' own public product pages for facts — never their prose.
 *
 * scripts/enrich-from-supplier.ts and scripts/import-hill-decor.ts both need this: one
 * fills in facts on products that already exist, the other creates new ones from
 * products that don't. Kept as a plain library module, with no top-level execution and
 * nothing gated behind `process.argv`, specifically so a second script can import it
 * without accidentally running the first one's `main()` as a side effect — which is
 * exactly what happened when import-hill-decor.ts first imported straight from
 * enrich-from-supplier.ts, and is why this file exists instead.
 *
 * **Why reading this page is not the "supplier data feed" the standing constraints
 * forbid.** The rule is: no supplier feed, every product written individually, not
 * copied from the supplier's description. This module takes *facts* — a material, a
 * colour, a weight, a barcode, a title, a photograph — and never a sentence. The
 * description paragraph on these pages is deliberately not read, not stored and not
 * used anywhere below. A barcode is not prose and a weight is not copywriting; what
 * gets written from them still gets written from scratch, per product.
 *
 * **Access is checked, not assumed.** Their robots.txt disallows `/search/`,
 * `/seasonal/`, `/roomsets/`, `/products/store-locator/` and `/item/pdfview/`. It
 * allows `/item/`, and they publish a sitemap listing every item URL, so matching goes
 * through that sitemap rather than the search endpoint — the one thing robots.txt
 * actually rules out. One request at a time with a pause between, and every page
 * fetched is cached to disk, because there is no reason to ask a trade supplier's site
 * for the same page twice.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const HILL_HOST = "https://www.hill-interiors.com";
export const HILL_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
/** One request at a time, with this gap. A trade supplier's site is not a load test. */
export const HILL_DELAY_MS = 500;

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function slugify(title: string): string {
  return title
    .replace(/\s*\|\s*Kaiku.*$/i, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** The sitemap, cached on disk so repeated runs cost the supplier one request. */
export async function itemUrls(): Promise<Map<string, string>> {
  const dir = path.join(process.cwd(), ".image-work");
  await mkdir(dir, { recursive: true });
  const cache = path.join(dir, "supplier-sitemap.xml");

  let xml: string;
  try {
    xml = await readFile(cache, "utf8");
  } catch {
    const res = await fetch(`${HILL_HOST}/sitemap.xml`, {
      headers: { "User-Agent": HILL_UA },
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

/**
 * A page fetched once and kept on disk. `key` should be the item's own code or slug —
 * whichever the caller already has to hand — so a rerun of a large import after a
 * network hiccup costs nothing for the items it already has.
 */
export async function cachedFetch(url: string, key: string): Promise<string> {
  const dir = path.join(process.cwd(), ".image-work/hill-pages");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${key}.html`);
  try {
    return await readFile(file, "utf8");
  } catch {
    const res = await fetch(url, { headers: { "User-Agent": HILL_UA } });
    await sleep(HILL_DELAY_MS);
    if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
    const html = await res.text();
    await writeFile(file, html, "utf8");
    return html;
  }
}

/** Labels the specification table uses, and where each one belongs on our document. */
export interface SupplierFacts {
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
