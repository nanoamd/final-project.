import { PackageIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

import { MarginDisplay } from "@/sanity/components/margin-display";

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  icon: PackageIcon,
  groups: [
    { name: "identity", title: "Identity", default: true },
    { name: "commerce", title: "Pricing" },
    { name: "identifiers", title: "Identifiers & Supplier" },
    { name: "logistics", title: "Logistics" },
    { name: "merchandising", title: "Merchandising" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    // Identity ----------------------------------------------------------
    defineField({
      name: "title",
      type: "string",
      group: "identity",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "identity",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      type: "reference",
      group: "identity",
      to: [{ type: "category" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "brand",
      type: "reference",
      group: "identity",
      to: [{ type: "brand" }],
    }),
    defineField({ name: "tagline", type: "string", group: "identity" }),
    defineField({
      name: "summary",
      title: "Short summary",
      type: "text",
      rows: 3,
      group: "identity",
    }),
    defineField({
      name: "description",
      title: "Full description",
      type: "richText",
      group: "identity",
    }),

    // Commerce ------------------------------------------------------------
    defineField({
      name: "price",
      title: "Price",
      type: "number",
      group: "commerce",
      validation: (rule) => rule.required().positive(),
    }),
    defineField({
      name: "compareAtPrice",
      title: "Compare-at price (was/now)",
      type: "number",
      group: "commerce",
    }),
    defineField({
      name: "costPrice",
      title: "Cost price",
      type: "number",
      group: "commerce",
      description: "Not shown on the storefront — internal only.",
    }),
    defineField({
      name: "currency",
      type: "string",
      group: "commerce",
      initialValue: "GBP",
      options: { list: ["GBP", "EUR", "USD"] },
    }),
    defineField({
      name: "marginDisplay",
      title: "Margin",
      type: "string",
      group: "commerce",
      components: { field: MarginDisplay },
      readOnly: true,
    }),

    // Identifiers & Supplier ----------------------------------------------
    defineField({
      name: "sku",
      title: "SKU",
      type: "string",
      group: "identifiers",
    }),
    defineField({
      name: "gtin",
      title: "GTIN / EAN",
      type: "string",
      group: "identifiers",
    }),
    defineField({
      name: "mpn",
      title: "MPN",
      type: "string",
      group: "identifiers",
    }),
    defineField({
      name: "supplier",
      type: "reference",
      group: "identifiers",
      to: [{ type: "supplier" }],
    }),
    defineField({
      name: "sourceUrl",
      title: "Source URL",
      type: "url",
      group: "identifiers",
      description:
        "The supplier page this product was imported from, if created via the admin URL importer.",
    }),

    // Logistics -------------------------------------------------------------
    defineField({ name: "dimensions", type: "dimensions", group: "logistics" }),
    defineField({ name: "weight", type: "weight", group: "logistics" }),
    defineField({
      name: "deliveryLeadTime",
      title: "Delivery lead time",
      type: "string",
      group: "logistics",
      description: 'Free text, e.g. "3–6 weeks".',
    }),
    defineField({
      name: "stockStatus",
      title: "Stock status",
      type: "string",
      group: "logistics",
      options: {
        list: [
          "In Stock",
          "Out of Stock",
          "Backorder",
          "Made to Order",
          "Coming Soon",
        ],
      },
      initialValue: "In Stock",
    }),
    defineField({
      name: "stockQuantity",
      title: "Stock quantity",
      type: "number",
      group: "logistics",
    }),
    defineField({
      name: "deliveryNotes",
      title: "Delivery & returns copy",
      type: "text",
      rows: 3,
      group: "logistics",
    }),
    defineField({
      name: "warrantyNotes",
      title: "Warranty copy",
      type: "text",
      rows: 3,
      group: "logistics",
    }),

    // Merchandising ---------------------------------------------------------
    defineField({
      name: "gallery",
      type: "array",
      group: "merchandising",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [{ name: "alt", title: "Alt text", type: "string" }],
        },
      ],
    }),
    defineField({
      name: "badges",
      title: "Badges",
      type: "array",
      group: "merchandising",
      of: [{ type: "string" }],
      description: 'Short neutral descriptors, e.g. "2–3 person".',
    }),
    defineField({
      name: "highlights",
      title: "Feature highlights",
      type: "array",
      group: "merchandising",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "specs",
      title: "Specifications",
      type: "array",
      group: "merchandising",
      of: [{ type: "productSpec" }],
    }),
    defineField({
      name: "options",
      title: "Configurable options",
      type: "array",
      group: "merchandising",
      of: [{ type: "productOption" }],
    }),
    defineField({
      name: "downloads",
      title: "Downloads (PDFs)",
      type: "array",
      group: "merchandising",
      of: [
        {
          type: "object",
          name: "download",
          fields: [
            { name: "label", type: "string" },
            { name: "file", type: "file" },
          ],
        },
      ],
    }),
    defineField({
      name: "relatedProducts",
      title: "Related products",
      type: "array",
      group: "merchandising",
      of: [{ type: "reference", to: [{ type: "product" }] }],
      description:
        "Falls back to other products in the same category if left empty.",
    }),
    defineField({
      name: "faqs",
      title: "FAQs",
      type: "array",
      group: "merchandising",
      of: [{ type: "faqEntry" }],
    }),
    defineField({
      name: "rating",
      type: "number",
      group: "merchandising",
      validation: (rule) => rule.min(0).max(5),
    }),
    defineField({
      name: "reviewCount",
      title: "Review count",
      type: "number",
      group: "merchandising",
    }),

    defineField({ name: "seo", type: "seo", group: "seo" }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "sku",
      media: "gallery.0",
    },
  },
});
