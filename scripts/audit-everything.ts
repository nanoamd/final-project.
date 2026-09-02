/**
 * Broad catalogue audit: every defect class in one pass, so we find things
 * before Damien does. Read-only.
 *
 * The first version of this script reported 906 products with "no lead time",
 * "no seoTitle" and "no seoDescription" — i.e. every product in the catalogue.
 * That was three wrong field names on my part, not three real defects: SEO is
 * a nested `seo` object with `metaTitle`/`metaDescription`, lead time is
 * `deliveryLeadTime`, the was/now price is `compareAtPrice` (not salePrice),
 * and there is no `mainImage` field at all — imagery is the `gallery` array.
 * An all-906 row in a defect audit is almost always the auditor being wrong.
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-everything.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

type Row = Record<string, unknown> & { _id: string; title?: string };

async function main() {
  const p: Row[] =
    await client.fetch(`*[_type=="product" && !(_id in path("drafts.**"))]{
    _id, title, "slug": slug.current, summary, tagline,
    "seoTitle": seo.metaTitle, "seoDescription": seo.metaDescription,
    price, compareAtPrice, costPrice, sku, deliveryLeadTime, stockStatus,
    "cat": category->title, "catSlug": category->slug.current,
    "gallery": gallery[]{ "url": asset->url, alt },
    faqs, specs, dimensions, weight,
    "h2": count(description[style=="h2"]), "chars": length(pt::text(description))
  }`);

  const out: Record<string, Record<string, unknown>[]> = {};
  const add = (k: string, d: Row, extra?: Record<string, unknown>) => {
    const bucket = (out[k] ??= []);
    bucket.push({ id: d._id, title: d.title, slug: d.slug, ...extra });
  };
  const push = (m: Map<string, string[]>, key: string, id: string) => {
    const list = m.get(key);
    if (list) list.push(id);
    else m.set(key, [id]);
  };

  const titles = new Map<string, string[]>();
  const slugs = new Map<string, string[]>();
  const seoTitles = new Map<string, string[]>();

  for (const d of p) {
    const title = typeof d.title === "string" ? d.title : "";
    const slug = typeof d.slug === "string" ? d.slug : "";
    const price = typeof d.price === "number" ? d.price : null;
    const compareAt =
      typeof d.compareAtPrice === "number" ? d.compareAtPrice : null;
    const costPrice = typeof d.costPrice === "number" ? d.costPrice : null;
    const seoTitle = typeof d.seoTitle === "string" ? d.seoTitle.trim() : "";
    const seoDesc =
      typeof d.seoDescription === "string" ? d.seoDescription.trim() : "";

    // identity / routing
    if (!slug) add("missing slug", d);
    if (!d.cat) add("no category", d);
    if (!d.sku) add("no SKU", d);
    push(titles, title, d._id);
    if (slug) push(slugs, slug, d._id);

    // pricing
    if (price == null) add("no price", d);
    else {
      if (price <= 0) add("price <= 0", d, { price });
      if (!Number.isFinite(price)) add("price not finite", d);
      if (Math.round(price * 100) !== Math.round(price * 100 * 1e6) / 1e6)
        add("price has sub-penny precision", d, { price });
      else if (Math.abs(price * 100 - Math.round(price * 100)) > 1e-9)
        add("price has sub-penny precision", d, { price });
      if (compareAt != null && compareAt <= price)
        add("compare-at price not above price", d, { price, compareAt });
      if (costPrice != null && costPrice >= price)
        add("cost price >= sell price", d, { cost: costPrice, price });
    }

    // logistics
    if (typeof d.deliveryLeadTime !== "string" || !d.deliveryLeadTime.trim())
      add("no delivery lead time", d);
    if (!d.stockStatus) add("no stock status", d);

    // imagery
    const gallery = Array.isArray(d.gallery)
      ? (d.gallery as { url?: string; alt?: string }[])
      : [];
    if (gallery.length === 0) add("no images at all", d);
    const missingAlt = gallery.filter((x) => !x?.alt?.trim()).length;
    if (missingAlt)
      add("gallery images missing alt", d, { missingAlt, of: gallery.length });
    if (gallery.some((x) => !x?.url)) add("gallery image with no asset", d);

    // SEO
    if (!seoTitle) add("no seo meta title", d);
    else {
      if (seoTitle.length > 60)
        add("seo meta title over 60 chars", d, { len: seoTitle.length });
      push(seoTitles, seoTitle, d._id);
    }
    if (!seoDesc) add("no seo meta description", d);
    else if (seoDesc.length > 160)
      add("seo meta description over 160 chars", d, { len: seoDesc.length });
    else if (seoDesc.length < 70)
      add("seo meta description under 70 chars", d, { len: seoDesc.length });

    // content
    if (typeof d.summary !== "string" || !d.summary.trim())
      add("no summary", d);
    if (typeof d.h2 === "number" && d.h2 < 2)
      add("description under 2 sections", d, { h2: d.h2 });
    if (typeof d.chars === "number" && d.chars < 400)
      add("description under 400 chars", d, { chars: d.chars });

    const faqs = Array.isArray(d.faqs)
      ? (d.faqs as { question?: string; answer?: unknown }[])
      : [];
    if (faqs.length === 0) add("no FAQs", d);
    else {
      const qs = faqs.map((f) => (f.question ?? "").trim().toLowerCase());
      if (new Set(qs).size !== qs.length) add("duplicate FAQ questions", d);
      if (faqs.some((f) => !f.question?.trim()))
        add("FAQ with empty question", d);
      if (faqs.some((f) => !f.answer)) add("FAQ with empty answer", d);
      const typos = faqs
        .map((f) => f.question ?? "")
        .filter((q) => /^s\s/i.test(q));
      if (typos.length)
        add("FAQ question typo (leading 's ')", d, { questions: typos });
    }

    const specs = Array.isArray(d.specs)
      ? (d.specs as { label?: string; value?: string }[])
      : [];
    if (specs.length === 0) add("no specs", d);
    else {
      if (specs.some((s) => !s?.label?.trim() || !s?.value?.trim()))
        add("spec row with empty label or value", d);
      const labels = specs.map((s) => (s.label ?? "").trim().toLowerCase());
      if (new Set(labels).size !== labels.length)
        add("duplicate spec labels", d);
    }

    const dims = (d.dimensions ?? {}) as {
      length?: number;
      width?: number;
      height?: number;
    };
    if (dims.length == null && dims.width == null && dims.height == null)
      add("no dimensions", d);
    if (!d.weight) add("no weight", d);
  }

  for (const [t, ids] of titles)
    if (ids.length > 1) (out["duplicate title"] ??= []).push({ title: t, ids });
  for (const [s, ids] of slugs)
    if (ids.length > 1) (out["duplicate slug"] ??= []).push({ slug: s, ids });
  for (const [s, ids] of seoTitles)
    if (ids.length > 1)
      (out["duplicate seo meta title"] ??= []).push({ seoTitle: s, ids });

  console.log(`Audited ${p.length} published products\n`);
  const rows = Object.entries(out).sort((a, b) => b[1].length - a[1].length);
  for (const [k, v] of rows) console.log(String(v.length).padStart(5), k);
  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/.tmp-audit-everything.json",
    JSON.stringify(out, null, 2),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
