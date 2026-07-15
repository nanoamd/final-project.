import { defineField, defineType } from "sanity";

/**
 * An inline question/answer pair for content specific to one document (e.g. a
 * product's own FAQs). The standalone `faq` document type is for the
 * site-wide FAQ page instead — this stays lightweight on purpose.
 */
export const faqEntry = defineType({
  name: "faqEntry",
  title: "FAQ",
  type: "object",
  fields: [
    defineField({
      name: "question",
      title: "Question",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "answer",
      title: "Answer",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { select: { title: "question" } },
});
