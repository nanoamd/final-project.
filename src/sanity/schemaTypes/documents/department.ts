import { LayersIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

/**
 * Top-level vertical (Outdoor Living, Living Room, Bedroom, …). Organisational
 * metadata for navigation only — it never appears in shop URLs, which stay
 * /shop/[category] exactly as today.
 */
export const department = defineType({
  name: "department",
  title: "Department",
  type: "document",
  icon: LayersIcon,
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
      name: "order",
      type: "number",
      description: "Lower numbers appear first in navigation.",
      initialValue: 0,
    }),
    defineField({ name: "seo", type: "seo" }),
  ],
  orderings: [
    {
      title: "Display order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "slug.current" },
  },
});
