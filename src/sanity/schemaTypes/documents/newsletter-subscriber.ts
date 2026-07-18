import { MailIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

/**
 * A newsletter signup. Created only by the `subscribeToNewsletter` server
 * action — never edited in Studio, just read/exported.
 */
export const newsletterSubscriber = defineType({
  name: "newsletterSubscriber",
  title: "Newsletter Subscriber",
  type: "document",
  icon: MailIcon,
  fields: [
    defineField({
      name: "email",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "subscribedAt",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    {
      title: "Newest first",
      name: "subscribedAtDesc",
      by: [{ field: "subscribedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "email" },
  },
});
