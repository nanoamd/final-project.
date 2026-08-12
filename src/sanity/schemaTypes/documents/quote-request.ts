import { FileTextIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

/**
 * A quotation request from the public form. Created only by the
 * `submitQuoteRequest` server action.
 *
 * The one document type in this project that is both written by the site and
 * genuinely worked on in Studio: a quote request is a live sales conversation, so
 * `status` and `internalNotes` exist to be edited by hand as it progresses. Every
 * other field is a record of what the customer sent and should be read, not
 * changed.
 *
 * Nothing here is required except the three things the form itself insists on —
 * name, email and the requirements text. A quote request that arrives missing its
 * budget or its postcode is still a lead, and Studio refusing to display it because
 * a field is absent would be the worst possible failure mode for this document.
 */
export const quoteRequest = defineType({
  name: "quoteRequest",
  title: "Quote Request",
  type: "document",
  icon: FileTextIcon,
  groups: [
    { name: "enquiry", title: "Enquiry", default: true },
    { name: "project", title: "Project" },
    { name: "handling", title: "Handling" },
  ],
  fields: [
    /**
     * The reference the customer is shown on screen and quoted in any reply.
     * Read-only because it is generated at submission; editing it here would
     * silently break the only shared handle on the conversation.
     */
    defineField({
      name: "reference",
      type: "string",
      readOnly: true,
      group: "enquiry",
    }),
    defineField({
      name: "status",
      type: "string",
      description: "Where this enquiry has got to.",
      options: {
        list: [
          { title: "New", value: "new" },
          { title: "Quoted", value: "quoted" },
          { title: "Won", value: "won" },
          { title: "Lost", value: "lost" },
          { title: "Spam", value: "spam" },
        ],
        layout: "radio",
      },
      initialValue: "new",
      group: "handling",
    }),
    defineField({
      name: "submittedAt",
      type: "datetime",
      readOnly: true,
      group: "enquiry",
    }),
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required(),
      group: "enquiry",
    }),
    defineField({
      name: "email",
      type: "string",
      validation: (rule) => rule.required(),
      group: "enquiry",
    }),
    defineField({ name: "phone", type: "string", group: "enquiry" }),
    defineField({ name: "company", type: "string", group: "enquiry" }),

    defineField({
      name: "projectTypes",
      title: "What they are asking about",
      type: "array",
      of: [{ type: "string" }],
      group: "project",
    }),
    defineField({
      name: "products",
      title: "Products mentioned",
      type: "string",
      group: "project",
    }),
    defineField({
      name: "postcode",
      description: "Delivery and access are priced from this.",
      type: "string",
      group: "project",
    }),
    defineField({ name: "timescale", type: "string", group: "project" }),
    defineField({ name: "budget", type: "string", group: "project" }),
    defineField({
      name: "siteReadiness",
      title: "Site readiness",
      type: "string",
      group: "project",
    }),
    defineField({
      name: "powerSupply",
      title: "Power supply",
      type: "string",
      group: "project",
    }),
    defineField({
      name: "requirements",
      type: "text",
      rows: 8,
      validation: (rule) => rule.required(),
      group: "project",
    }),

    /**
     * Photographs and plans, uploaded to Sanity's asset store by the action
     * before this document is created — so an upload failure can never leave a
     * document pointing at an asset that does not exist.
     */
    defineField({
      name: "attachments",
      type: "array",
      of: [
        {
          type: "object",
          name: "quoteAttachment",
          fields: [
            defineField({ name: "originalName", type: "string" }),
            defineField({ name: "contentType", type: "string" }),
            defineField({ name: "asset", type: "file" }),
          ],
          preview: {
            select: { title: "originalName", subtitle: "contentType" },
          },
        },
      ],
      group: "project",
    }),
    /**
     * What did not make it. A file rejected for type or size is recorded rather
     * than dropped, so a reply can ask for it again instead of the customer
     * assuming it arrived.
     */
    defineField({
      name: "attachmentNotes",
      title: "Attachment problems",
      type: "text",
      rows: 3,
      readOnly: true,
      group: "project",
    }),

    /**
     * The whole enquiry as one block of text.
     *
     * Duplicates the fields above on purpose. It is what gets pasted into a reply
     * or read on a phone at a supplier's trade counter, and it is the fallback the
     * action logs if Sanity is unreachable — so the same shape that reaches the log
     * also reaches Studio.
     */
    defineField({
      name: "summary",
      type: "text",
      rows: 14,
      readOnly: true,
      group: "enquiry",
    }),
    defineField({
      name: "internalNotes",
      title: "Internal notes",
      description: "Not visible to the customer.",
      type: "text",
      rows: 5,
      group: "handling",
    }),
    defineField({
      name: "spamSuspected",
      title: "Suspected spam",
      type: "boolean",
      readOnly: true,
      description:
        "Set by the form's own checks. The enquiry is still stored — a false positive must never silently discard a real customer.",
      group: "handling",
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
    select: {
      title: "name",
      subtitle: "email",
      status: "status",
      reference: "reference",
    },
    prepare({ title, subtitle, status, reference }) {
      return {
        title: `${title ?? "Unnamed"}${status && status !== "new" ? ` — ${status}` : ""}`,
        subtitle: [reference, subtitle].filter(Boolean).join(" · "),
      };
    },
  },
});
