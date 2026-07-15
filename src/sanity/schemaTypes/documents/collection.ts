import { LayoutGridIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

/**
 * A curated, cross-cutting merchandising grouping (e.g. "Best Sellers", "New
 * In") — manually curated in v1. Can span categories/departments, unlike
 * Category which is the primary shop-routing unit.
 */
export const collection = defineType({
  name: "collection",
  title: "Collection",
  type: "document",
  icon: LayoutGridIcon,
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "description", type: "text", rows: 2 }),
    defineField({
      name: "heroImage",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "products",
      title: "Products",
      type: "array",
      of: [{ type: "reference", to: [{ type: "product" }] }],
    }),
    defineField({ name: "seo", type: "seo" }),
  ],
  preview: {
    select: { title: "title", subtitle: "slug.current", media: "heroImage" },
  },
});
