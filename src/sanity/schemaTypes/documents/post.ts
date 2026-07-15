import { EditIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

/** A journal/blog article, distinct from the more instructional `buyingGuide`. */
export const post = defineType({
  name: "post",
  title: "Blog Post",
  type: "document",
  icon: EditIcon,
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
    defineField({ name: "excerpt", type: "text", rows: 3 }),
    defineField({
      name: "coverImage",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "body", type: "richText" }),
    defineField({
      name: "author",
      type: "reference",
      to: [{ type: "author" }],
    }),
    defineField({
      name: "publishedAt",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "tags",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "relatedProducts",
      type: "array",
      of: [{ type: "reference", to: [{ type: "product" }] }],
    }),
    defineField({ name: "seo", type: "seo" }),
  ],
  orderings: [
    {
      title: "Published, newest first",
      name: "publishedDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "publishedAt", media: "coverImage" },
  },
});
