/**
 * Catalog domain types.
 *
 * These describe the *shape* of product data the storefront renders. The
 * placeholder catalog (src/features/storefront/data) conforms to them today;
 * the same types will later be satisfied by projections from the Intelligence
 * Layer, so the UI does not change when real supplier data arrives.
 */

/** Line-art motif used by placeholder imagery while photography is pending. */
export type IllustrationKind =
  "sauna" | "barrel" | "plunge" | "heater" | "chiller" | "leaf";

/** Warm tonal surface used behind placeholder imagery. */
export type SurfaceTone = "sand" | "clay" | "stone" | "mist" | "charcoal";

export interface Category {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  illustration: IllustrationKind;
  tone: SurfaceTone;
  /** True once real products exist; false renders an honest "coming soon". */
  available: boolean;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductFaq {
  question: string;
  answer: string;
}

export interface Product {
  slug: string;
  name: string;
  /** Owning category slug. */
  category: string;
  categoryName: string;
  tagline: string;
  summary: string;
  /** Indicative starting price in whole GBP. */
  priceFrom: number;
  /** Short neutral descriptors (e.g. "2–3 person"). Never trust signals. */
  badges?: string[];
  illustration: IllustrationKind;
  tone: SurfaceTone;
  highlights: string[];
  specs: ProductSpec[];
  delivery: string;
  warranty: string;
  faqs: ProductFaq[];
}
