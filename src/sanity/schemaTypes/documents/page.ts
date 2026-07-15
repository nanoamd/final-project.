import { FileTextIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

/**
 * Generic informational page — powers Contact, Returns, Delivery, Privacy
 * Policy, Terms & Conditions and About. Editors write and edit all of it in
 * Studio; no code change is ever needed to update a policy.
 */
export const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  icon: FileTextIcon,
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
      description:
        "Must match the route's known slug (e.g. \"returns\", \"privacy\").",
    }),
    defineField({ name: "intro", title: "Intro copy", type: "text", rows: 3 }),
    defineField({ name: "body", type: "richText" }),
    defineField({ name: "seo", type: "seo" }),
  ],
  preview: {
    select: { title: "title", subtitle: "slug.current" },
  },
});
