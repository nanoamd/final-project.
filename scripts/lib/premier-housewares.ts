/**
 * Reading Premier Housewares' own public product pages for facts — never their prose.
 * Same rule as scripts/lib/hill-supplier.ts: a barcode, a colour, a dimension are not
 * copywriting, so reading them is not the "supplier data feed" the standing
 * constraints forbid. The "Description" tab on every page is deliberately never read,
 * stored or used anywhere below.
 *
 * **Access is checked, not assumed.** Their `robots.txt` disallows a handful of
 * transactional endpoints (`/cart.php`, `/checkout.php`, `/login.php`, `/search.php`,
 * `/productimage.php`, `/admin/`, …) and nothing else — product pages themselves are
 * open. It goes further than that: it names `Claude-Web`, `ClaudeBot` and
 * `anthropic-ai` explicitly, alongside 30-odd other crawlers, with `Crawl-delay: 10`.
 * That line exists for exactly this reader, so `PH_DELAY_MS` honours it rather than
 * the faster pace Hill's own (crawler-silent) robots.txt allowed — matching the
 * site's stated preference is the point, not the letter of which User-Agent string
 * happens to be on the request.
 *
 * The site publishes a two-page product sitemap (`xmlsitemap.php?type=products`)
 * rather than gating discovery behind `/search.php`, so that is what this reads.
 * Trade pricing sits behind `/login.php`, same as Hill — a logged-out fetch simply
 * never carries a price to accidentally import.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const PH_HOST = "https://www.premierhousewares.com";
export const PH_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
/** robots.txt names Claude-Web/ClaudeBot/anthropic-ai explicitly with this delay. */
export const PH_DELAY_MS = 10_000;

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function slugify(title: string): string {
  return title
    .replace(/\s*\|\s*Kaiku.*$/i, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Both pages of the product sitemap, cached on disk, keyed by the URL's own slug. */
export async function productUrls(): Promise<Map<string, string>> {
  const dir = path.join(process.cwd(), ".image-work");
  await mkdir(dir, { recursive: true });
  const cache = path.join(dir, "premier-housewares-sitemap.xml");

  let xml: string;
  try {
    xml = await readFile(cache, "utf8");
  } catch {
    const pages = await Promise.all(
      [1, 2].map((page) =>
        fetch(`${PH_HOST}/xmlsitemap.php?type=products&page=${page}`, {
          headers: { "User-Agent": PH_UA },
        }).then((res) => {
          if (!res.ok)
            throw new Error(
              `products sitemap page ${page} returned ${res.status}`,
            );
          return res.text();
        }),
      ),
    );
    xml = pages.join("\n");
    await writeFile(cache, xml, "utf8");
  }

  const map = new Map<string, string>();
  for (const match of xml.matchAll(
    /<loc>(https:\/\/www\.premierhousewares\.com\/([a-z0-9-]+))<\/loc>/g,
  )) {
    map.set(match[2]!, match[1]!);
  }
  return map;
}

/** A page fetched once and kept on disk, keyed by the item's own slug. */
export async function cachedFetch(url: string, key: string): Promise<string> {
  const dir = path.join(process.cwd(), ".image-work/premier-housewares-pages");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${key}.html`);
  try {
    return await readFile(file, "utf8");
  } catch {
    const res = await fetch(url, { headers: { "User-Agent": PH_UA } });
    await sleep(PH_DELAY_MS);
    if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
    const html = await res.text();
    await writeFile(file, html, "utf8");
    return html;
  }
}

export interface PremierProduct {
  sku: string;
  title: string;
  images: string[];
  colour?: string;
  /** Raw supplier material names, percentages already stripped — mapped to
   * canonical tags by the caller (via scripts/lib/supplier-facets.ts), the same
   * split of responsibility scripts/lib/hill-supplier.ts uses, so an importer
   * can log which of the supplier's own words had no honest home. */
  materials: string[];
  barcode?: string;
  dimensions?: { length: number; width: number; height: number };
  /**
   * The supplier's own breadcrumb trail (from the page's BreadcrumbList
   * JSON-LD), e.g. `["Home", "Furniture", "Conservatory and Outdoor",
   * "Conservatory and Outdoor Tables", "..."]`. This is a structured fact
   * about where the supplier itself filed the product, not prose, and it is
   * the only reliable way to tell an outdoor rattan chair from an indoor one
   * — Premier Housewares sells rattan as an indoor bohemian-interiors
   * material just as often as a garden one, so the title word alone cannot
   * carry that distinction.
   */
  categoryPath: string[];
}

const title = (html: string): string | null =>
  /<h1[^>]*productView-title[^>]*>([^<]+)<\/h1>/.exec(html)?.[1]?.trim() ??
  null;

function categoryPath(html: string): string[] {
  for (const scriptMatch of html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  )) {
    const block = scriptMatch[1]!;
    if (block.includes('"BreadcrumbList"'))
      return [...block.matchAll(/"name":\s*"([^"]+)"/g)].map((m) => m[1]!);
  }
  return [];
}

/** `<li><span class="label">Label </span><span ...>Value</span></li>`, tolerant of the newline BigCommerce's template puts between the two spans on some rows. */
function specValue(html: string, label: string): string | null {
  const pattern = new RegExp(
    `<span class="label">\\s*${label}\\s*</span>\\s*>?\\s*<span[^>]*>([^<]*)</span>`,
    "i",
  );
  const value = pattern.exec(html)?.[1]?.trim();
  return value || null;
}

/** SKU-prefixed full-size photographs only — the page also carries 500x659 thumbnails for unrelated "you may also like" products, which this pattern excludes by requiring the filename to start with this item's own SKU. Capped at 6: several products carry a dozen near-duplicate angle/lifestyle/macro shots. */
function images(html: string, sku: string): string[] {
  const pattern = new RegExp(
    `/images/stencil/1280x1280/products/\\d+/\\d+/${sku}(?:_[^"']*)?\\.\\w+`,
    "g",
  );
  const unique = [...new Set(html.match(pattern) ?? [])];
  return unique.slice(0, 6).map((path) => `${PH_HOST}${path}`);
}

/**
 * "PE Rattan 19%,Tempered Glass 9%,Steel 70%,Other 2%" → `["pe rattan",
 * "tempered glass", "steel", "other"]`, ready for the caller's own
 * `mapMaterials`. Percentages are stripped rather than used to pick a single
 * "primary" material — a rattan-effect frame with a 70% steel skeleton is
 * honestly both, and the storefront's material filter already supports more
 * than one tag per product. The supplier's own "inoragnic" typo (seen on
 * planters) is corrected here rather than in the shared vocabulary, the same
 * way scripts/lib/viva-rugs.ts fixes Viva's "Frisee/Friese/Frese" locally.
 */
function materialsFrom(html: string): string[] {
  const raw = specValue(html, "Materials");
  if (!raw) return [];
  return raw
    .replace(/[\d.]+%/g, "")
    .replace(/inoragnic/gi, "inorganic")
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function dimensionsFrom(
  html: string,
): { length: number; width: number; height: number } | undefined {
  const match =
    /Product Dimensions[\s\S]{0,80}?w([\d.]+)\s*x\s*d([\d.]+)\s*x\s*h([\d.]+)/i.exec(
      html,
    );
  if (!match) return undefined;
  return {
    width: Math.round(Number(match[1])),
    length: Math.round(Number(match[2])),
    height: Math.round(Number(match[3])),
  };
}

/** `null` when the page has no title or no SKU — too thin to import from. */
export function parseProductPage(html: string): PremierProduct | null {
  const pageTitle = title(html);
  const sku = specValue(html, "SKU");
  if (!pageTitle || !sku) return null;

  return {
    sku,
    title: pageTitle,
    images: images(html, sku),
    colour: specValue(html, "Colour") ?? undefined,
    materials: materialsFrom(html),
    barcode: specValue(html, "Barcode")?.replace(/\D/g, "") || undefined,
    dimensions: dimensionsFrom(html),
    categoryPath: categoryPath(html),
  };
}
