import { deliveryWindow } from "@/lib/catalog/delivery";
import type { SanityProduct } from "@/types/sanity-content";

/**
 * Turns a set of products into comparison rows.
 *
 * The hard part of a comparison table is not the layout, it is that the data is
 * ragged. Roughly a third of the catalogue is missing at least one spec, suppliers
 * label the same fact differently ("Materials" on one product, "Finish" on another),
 * and a row that renders as a column of blanks is worse than no row: it reads as a
 * broken table rather than as unknown data.
 *
 * So: rows are built from what the products actually have, a row every product
 * leaves empty is dropped entirely, and a single missing value says so in words.
 *
 * `differs` is the useful part. On two coffee tables from the same collection most
 * rows are identical, and the buyer only cares about the three that are not — so
 * the renderer can lead with those rather than making someone read twenty rows to
 * find the difference themselves.
 */

export interface CompareRow {
  label: string;
  /** One value per product, in the order given. `null` means not specified. */
  values: (string | null)[];
  /** True when at least two products give different answers. */
  differs: boolean;
}

/** Shown in place of a missing value. Says "we do not know", not "none". */
export const NOT_SPECIFIED = "Not specified";

/**
 * Spec labels that mean the same thing, mapped to one heading.
 *
 * Suppliers are inconsistent and the importer preserved their wording faithfully,
 * which is right for a product page and wrong for a table with one row per fact.
 * Without this, comparing two products yields a "Materials" row with one value and
 * a "Finish" row with the other, and neither row can be compared.
 */
const SPEC_ALIASES: Record<string, string> = {
  material: "Materials",
  materials: "Materials",
  construction: "Materials",
  finish: "Finish",
  colour: "Colour",
  color: "Colour",
  dimensions: "Dimensions",
  size: "Dimensions",
  weight: "Weight",
  assembly: "Assembly",
  "assembly required": "Assembly",
};

function canonicalLabel(label: string): string {
  return SPEC_ALIASES[label.trim().toLowerCase()] ?? label.trim();
}

/** "W110 × D80 × H40cm", or null when nothing is recorded. */
export function formatDimensions(product: SanityProduct): string | null {
  const d = product.dimensions;
  if (!d) return null;
  const unit = d.unit ?? "cm";
  const parts = [
    d.length != null ? `W${d.length}` : null,
    d.width != null ? `D${d.width}` : null,
    d.height != null ? `H${d.height}` : null,
  ].filter(Boolean);
  return parts.length ? `${parts.join(" × ")}${unit}` : null;
}

export function formatWeight(product: SanityProduct): string | null {
  const w = product.weight;
  if (!w || w.value == null) return null;
  return `${w.value} ${w.unit ?? "kg"}`;
}

/**
 * Every spec on a product, keyed by canonical label. Later entries do not
 * overwrite earlier ones: if a product carries both "Material" and "Materials",
 * the first is the one the supplier led with.
 */
function specsByLabel(product: SanityProduct): Map<string, string> {
  const map = new Map<string, string>();
  for (const spec of product.specs ?? []) {
    if (!spec.label || !spec.value) continue;
    const label = canonicalLabel(spec.label);
    if (!map.has(label)) map.set(label, spec.value);
  }
  return map;
}

/**
 * Rows in a fixed order for the facts every product should have, then whatever
 * else the products themselves carry.
 *
 * The fixed head matters: price, size and material are what a buyer compares, and
 * they should be in the same place on every comparison rather than wherever the
 * supplier happened to list them.
 */
export function buildCompareRows(products: SanityProduct[]): CompareRow[] {
  if (products.length === 0) return [];

  const rows: CompareRow[] = [];
  const push = (label: string, values: (string | null)[]) => {
    // A row nobody answers is noise. One product answering is still useful —
    // "this one tells you, that one does not" is a real difference.
    if (values.every((value) => value == null)) return;
    const given = values.filter((value): value is string => value != null);
    rows.push({
      label,
      values,
      differs: new Set(given).size > 1 || given.length !== values.length,
    });
  };

  push(
    "Price",
    products.map((p) =>
      p.price != null
        ? new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: p.currency ?? "GBP",
            maximumFractionDigits: p.price % 1 === 0 ? 0 : 2,
          }).format(p.price)
        : null,
    ),
  );
  push(
    "Dimensions",
    products.map(
      (p) => formatDimensions(p) ?? specsByLabel(p).get("Dimensions") ?? null,
    ),
  );
  push(
    "Weight",
    products.map(
      (p) => formatWeight(p) ?? specsByLabel(p).get("Weight") ?? null,
    ),
  );
  push(
    "Materials",
    products.map((p) => specsByLabel(p).get("Materials") ?? null),
  );
  push(
    "Finish",
    products.map((p) => specsByLabel(p).get("Finish") ?? null),
  );
  push(
    "Colour",
    products.map((p) => specsByLabel(p).get("Colour") ?? null),
  );
  push(
    "Best suited to",
    products.map((p) => p.categoryName ?? null),
  );
  push(
    "Delivery",
    // deliveryWindow, not the raw field — the comparison table sits beside the
    // product pages it compares, so a different window here would be the most
    // visible inconsistency on the site. See src/lib/catalog/delivery.ts.
    products.map((p) => deliveryWindow(p)),
  );
  push(
    "Availability",
    products.map((p) => p.stockStatus ?? null),
  );

  // Anything else the products carry, in the order first encountered, so a spec
  // unique to one product still appears rather than being silently dropped.
  const covered = new Set(rows.map((row) => row.label));
  const extras: string[] = [];
  for (const product of products)
    for (const label of specsByLabel(product).keys())
      if (!covered.has(label) && !extras.includes(label)) extras.push(label);

  for (const label of extras)
    push(
      label,
      products.map((p) => specsByLabel(p).get(label) ?? null),
    );

  return rows;
}

/** The slugs in `?products=` — deduplicated, capped, order preserved. */
export function parseCompareSlugs(raw: string | undefined, max = 4): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const slugs: string[] = [];
  for (const part of raw.split(",")) {
    const slug = part.trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
    if (slugs.length >= max) break;
  }
  return slugs;
}
