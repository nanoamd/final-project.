/**
 * Turns a Sanity product document into a `QualityInput`.
 *
 * Shared by the offline audit script and the live admin readiness screen so the
 * two cannot drift apart — a report that disagreed with the screen it links to
 * would be worse than having no report.
 *
 * Portable Text is flattened here rather than in the scorer, which keeps the
 * scorer free of any Sanity dependency and therefore trivially testable.
 */

import type { QualityInput } from "./quality";

interface PortableBlock {
  _type?: string;
  style?: string;
  children?: { text?: string }[];
}

/** Every heading in a Portable Text description, in document order. */
export function headingsOf(description: unknown): string[] {
  if (!Array.isArray(description)) return [];
  return (description as PortableBlock[])
    .filter((b) => b?.style === "h2" || b?.style === "h3")
    .map((b) =>
      (b.children ?? [])
        .map((c) => c?.text ?? "")
        .join("")
        .trim(),
    )
    .filter(Boolean);
}

/** A Portable Text description as plain text, headings included. */
export function plainTextOf(description: unknown): string {
  if (!Array.isArray(description)) return "";
  return (description as PortableBlock[])
    .filter((b) => b?._type === "block")
    .map((b) => (b.children ?? []).map((c) => c?.text ?? "").join(""))
    .join("\n")
    .trim();
}

/** The shape the audit script and the admin screen both fetch. */
export interface ProductDocument {
  _id: string;
  title?: string | null;
  slug?: string | null;
  summary?: string | null;
  description?: unknown;
  faqs?: { question?: string | null; answer?: string | null }[] | null;
  price?: number | null;
  costPrice?: number | null;
  shippingCost?: number | null;
  sku?: string | null;
  supplierSku?: string | null;
  gtin?: string | null;
  supplier?: string | null;
  category?: string | null;
  dimensions?: unknown;
  weight?: unknown;
  stockStatus?: string | null;
  galleryCount?: number | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export function toQualityInput(doc: ProductDocument): QualityInput {
  return {
    title: doc.title ?? "",
    slug: doc.slug ?? null,
    summary: doc.summary ?? null,
    descriptionText: plainTextOf(doc.description),
    headings: headingsOf(doc.description),
    faqs: doc.faqs ?? null,
    price: doc.price ?? null,
    costPrice: doc.costPrice ?? null,
    shippingCost: doc.shippingCost ?? null,
    sku: doc.sku ?? null,
    supplierSku: doc.supplierSku ?? null,
    gtin: doc.gtin ?? null,
    supplier: doc.supplier ?? null,
    category: doc.category ?? null,
    dimensions: doc.dimensions ?? null,
    weight: doc.weight ?? null,
    stockStatus: doc.stockStatus ?? null,
    galleryCount: doc.galleryCount ?? 0,
    seoTitle: doc.seoTitle ?? null,
    seoDescription: doc.seoDescription ?? null,
    published: !doc._id.startsWith("drafts."),
  };
}

/** The GROQ projection both callers use. Kept here so they cannot diverge. */
export const QUALITY_PROJECTION = /* groq */ `{
  _id, _createdAt, _updatedAt, title, summary, description, faqs,
  "slug": slug.current,
  "category": category->title,
  "supplier": supplier->name,
  price, costPrice, shippingCost, sku, supplierSku, gtin,
  stockStatus, dimensions, weight,
  "galleryCount": count(gallery),
  "seoTitle": seo.metaTitle,
  "seoDescription": seo.metaDescription
}`;
