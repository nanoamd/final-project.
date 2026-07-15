import { FolderIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

const ICON_NAMES = [
  "warehouse",
  "droplets",
  "columns3",
  "sofa",
  "flame",
  "cooking-pot",
  "lightbulb",
  "sprout",
  "waves",
  "package",
  "rows3",
  "home",
  "leaf",
] as const;

export const category = defineType({
  name: "category",
  title: "Category",
  type: "document",
  icon: FolderIcon,
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
    defineField({
      name: "department",
      type: "reference",
      to: [{ type: "department" }],
    }),
    defineField({ name: "tagline", type: "string" }),
    defineField({ name: "description", type: "text", rows: 3 }),
    defineField({
      name: "heroImage",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "iconName",
      title: "Icon",
      type: "string",
      description: "Resolved to a matching icon in the storefront.",
      options: { list: [...ICON_NAMES] },
      initialValue: "leaf",
    }),
    defineField({
      name: "comingSoon",
      title: "Show as “coming soon”",
      type: "boolean",
      description:
        "Editorial override — show the coming-soon state even if products exist.",
      initialValue: false,
    }),
    defineField({
      name: "order",
      type: "number",
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
    select: { title: "title", subtitle: "slug.current", media: "heroImage" },
  },
});
