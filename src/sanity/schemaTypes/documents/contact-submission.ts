import { MailIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

/**
 * A submission from the public contact form. Created only by the
 * `submitContactForm` server action — never edited in Studio, just read.
 */
export const contactSubmission = defineType({
  name: "contactSubmission",
  title: "Contact Submission",
  type: "document",
  icon: MailIcon,
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "email",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "message",
      type: "text",
      rows: 6,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "submittedAt",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    {
      title: "Newest first",
      name: "submittedAtDesc",
      by: [{ field: "submittedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "name", subtitle: "email" },
  },
});
