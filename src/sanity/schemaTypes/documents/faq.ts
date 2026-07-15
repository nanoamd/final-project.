import { HelpCircleIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

/** A general, site-wide FAQ entry (grouped by topic on the /faq page). */
export const faq = defineType({
  name: "faq",
  title: "FAQ",
  type: "document",
  icon: HelpCircleIcon,
  fields: [
    defineField({
      name: "question",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "answer",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "topic",
      type: "string",
      description: 'Groups related questions, e.g. "Delivery", "Saunas".',
      options: { list: ["General", "Delivery", "Returns", "Products", "Trade"] },
      initialValue: "General",
    }),
    defineField({
      name: "order",
      type: "number",
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: "Display order",
      name: "orderAsc",
      by: [
        { field: "topic", direction: "asc" },
        { field: "order", direction: "asc" },
      ],
    },
  ],
  preview: {
    select: { title: "question", subtitle: "topic" },
  },
});
