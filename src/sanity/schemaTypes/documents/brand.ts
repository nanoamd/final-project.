import { TagIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

/**
 * Referenced by products so a brand name is entered once and reused —
 * prevents typo'd/duplicate brand strings across a large catalog.
 */
export const brand = defineType({
  name: "brand",
  title: "Brand",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "logo", type: "image" }),
    defineField({ name: "description", type: "text", rows: 2 }),
  ],
  preview: {
    select: { title: "name", media: "logo" },
  },
});
