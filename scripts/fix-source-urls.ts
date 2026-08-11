/**
 * Points every product's sourceUrl at its own product page.
 *
 * All 78 published products already record a sourceUrl, but three of them record
 * the wrong thing:
 *
 *   - Elmley Grey End Table and Pershore Rectangular Aged Oak Coffee Table both
 *     record https://didesigns.co.uk/basket/ — the shopping basket, captured from
 *     the wrong browser tab. Nothing can be verified against a basket.
 *   - Sweet Birch Essential Oil 10ml records the Eucalyptus oil's URL (.../eo/eo-03).
 *     Its own supplier code is EO-76, so it should be .../eo/eo-76.
 *
 * Where a saved supplier page exists, the replacement comes from that page's own
 * canonical link rather than from a guess — the page states its address.
 *
 * Dry run by default; --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/fix-source-urls.ts
 */
import { existsSync, readFileSync } from "node:fs";

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

/**
 * URLs that are not a product page, however well-formed they look.
 *
 * Matches only a named non-product path or a bare domain. An earlier version also
 * treated any URL ending in a slash as suspect, which is every product URL on
 * didesigns.co.uk — so it reported all 78 as broken and offered to replace them
 * with themselves.
 */
const NOT_A_PRODUCT =
  /\/(basket|cart|checkout|my-account|account|shop|collections|product-brands)\/?$|^https?:\/\/[^/]+\/?$/i;

/**
 * A saved page's own canonical address, or null.
 *
 * Preferred over constructing a URL from the slug: the page says what it is, and a
 * constructed URL that 404s is worse than no URL at all.
 */
function canonicalFrom(file: string): string | null {
  if (!existsSync(file)) return null;
  const html = readFileSync(file, "utf8");
  const match =
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i.exec(html) ??
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i.exec(html);
  return match?.[1] ?? null;
}

/** Corrections that cannot come from a saved page, with why each is right. */
const MANUAL: { id: string; url: string; why: string }[] = [
  {
    // Its own supplier code is EO-76; eo-03 is the Eucalyptus oil.
    id: "product-aw-eo-76",
    url: "https://www.aw-dropship.com/aromatherapy/aweo/eo/eo-76",
    why: "was pointing at the Eucalyptus oil's page",
  },
  {
    // Canonical address taken from the saved Elmley-Grey-Glass-Top-End-Table page,
    // which the manifest does not pair automatically because the Elmley range has
    // a console table with nearly the same title.
    id: "product-import-elmley-grey-glass-top-end-table",
    url: "https://didesigns.co.uk/product/elmley-end-table-grey/",
    why: "was pointing at the basket",
  },
  {
    // No saved page for this one. Found on the supplier's site: the Pershore
    // rectangular coffee table in aged oak and oak veneer, 110W × 80D × 40H cm,
    // 28kg. The stored dimensions match; the stored weight is 21kg, which does
    // not. Flagged rather than overwritten — the discrepancy needs the page itself
    // to settle, not a search result.
    id: "product-di-di-pershore-ct-oak",
    url: "https://didesigns.co.uk/product/rectangular-coffee-table-aged-oak-and-oak-veneer/",
    why: "was pointing at the basket",
  },
];

async function main() {
  const products = await client.fetch<
    {
      _id: string;
      title: string;
      sourceUrl: string | null;
      supplierSku: string | null;
    }[]
  >(`*[_type == "product" && !(_id in path("drafts.**"))]{
      _id, title, sourceUrl, supplierSku
    }|order(title asc)`);

  // Every saved page, by its canonical address, so a product can be matched to the
  // page that claims to be it.
  const manifest = JSON.parse(
    readFileSync("product-copy/manifest.json", "utf8"),
  ) as { productId: string; supplierPage: string | null }[];
  const pageFor = new Map(
    manifest.map((m) => [m.productId, m.supplierPage] as const),
  );

  const fixes: {
    id: string;
    title: string;
    from: string;
    to: string;
    why: string;
  }[] = [];

  for (const product of products) {
    const manual = MANUAL.find((m) => m.id === product._id);
    if (manual) {
      if (product.sourceUrl !== manual.url)
        fixes.push({
          id: product._id,
          title: product.title,
          from: product.sourceUrl ?? "(none)",
          to: manual.url,
          why: manual.why,
        });
      continue;
    }

    const url = product.sourceUrl ?? "";
    const broken = !url || NOT_A_PRODUCT.test(url);
    if (!broken) continue;

    const page = pageFor.get(product._id);
    const canonical = page ? canonicalFrom(page) : null;
    if (!canonical) {
      console.log(
        `✗ ${product.title.slice(0, 56)}\n` +
          `    sourceUrl is "${url || "(none)"}" and no saved page gives its address.\n` +
          `    Needs the real product URL pasted in by hand.`,
      );
      continue;
    }
    fixes.push({
      id: product._id,
      title: product.title,
      from: url || "(none)",
      to: canonical,
      why: "was pointing at the basket, not a product",
    });
  }

  for (const fix of fixes) {
    console.log(`${apply ? "✓" : "·"} ${fix.title.slice(0, 56)}`);
    console.log(`    ${fix.why}`);
    console.log(`    ${fix.from}`);
    console.log(`    → ${fix.to}`);
    if (apply) await client.patch(fix.id).set({ sourceUrl: fix.to }).commit();
  }

  console.log(
    `\n${fixes.length} sourceUrl(s) ${apply ? "corrected" : "to correct"}.` +
      (apply ? "\n" : "\nDry run — nothing written. Re-run with --apply.\n"),
  );
}

main().catch((err) => {
  console.error("fix-source-urls failed:", err);
  process.exit(1);
});
