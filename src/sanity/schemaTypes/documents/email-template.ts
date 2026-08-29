import { MailboxIcon } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

import { EMAIL_KIND_OPTIONS } from "@/lib/emails/catalogue";

/**
 * An email Damien can edit himself — subject line, images, wording, buttons —
 * without anyone touching TypeScript.
 *
 * His question: "How can I fully customise my emails and add images etc on
 * newsletters and confirmations and make them exactly how I want them?"
 *
 * The split matters, so it is worth stating. **Content lives here; rendering
 * stays in code.** Not to keep control in the code, but because email HTML is
 * genuinely hostile: Outlook renders through Word's engine with no flexbox and
 * no `max-width`, Gmail strips `<style>` blocks, and every client blocks remote
 * images until the reader allows them. A rich-text editor that emitted its own
 * HTML would produce mail that looks right in the editor and breaks in Outlook.
 * So the blocks below are *intent* — "a heading", "an image", "a button" — and
 * src/server/emails/template-renderer.ts turns each one into the table-based,
 * inline-styled markup that survives those clients.
 *
 * **A template here overrides the built-in version of that email; delete it and
 * the built-in comes back.** Nothing breaks if a template is missing,
 * half-written, or has no blocks at all — see the renderer's fallback. That is
 * deliberate: a transactional email that fails to send because somebody was
 * mid-edit is worse than one that looks slightly out of date.
 */

/** Variables the renderer substitutes, per email kind. Documented in the UI so
 *  the editor does not have to guess what is available. */
const VARIABLE_HELP =
  "Insert live order details with double braces: {{customerName}}, {{orderNumber}}, {{orderTotal}}, {{customerNote}}, {{orderStatusUrl}}, {{trackingUrl}}, {{trackingNumber}}, {{carrier}}, {{leadTime}}, {{shopUrl}}, {{unsubscribeUrl}}. {{customerNote}} is the per-order note you type on the order itself in /admin/orders — put it where you want your own words about that specific order to appear, and it disappears cleanly on orders where you did not write one. On the Second order offer email specifically, {{code}}, {{minimum}} and {{percentOff}} are also available (the customer's personal discount code, the £ minimum spend as text, and the percentage off). Anything unrecognised is left alone rather than blanked, so a stray brace never eats your copy.";

export const emailTemplate = defineType({
  name: "emailTemplate",
  title: "Email",
  type: "document",
  icon: MailboxIcon,
  fields: [
    defineField({
      name: "key",
      title: "Which email is this?",
      type: "string",
      description:
        "Each email can have one template. Two templates with the same key: the most recently updated one wins.",
      options: { list: EMAIL_KIND_OPTIONS },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "enabled",
      title: "Use this instead of the built-in version",
      type: "boolean",
      initialValue: false,
      description:
        "Off while you are drafting — the built-in email keeps sending. Turn it on when you are happy.",
    }),
    defineField({
      name: "subject",
      title: "Subject line",
      type: "string",
      description: `What lands in the inbox. ${VARIABLE_HELP}`,
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: "preheader",
      title: "Preview text",
      type: "string",
      description:
        "The grey line the inbox shows after the subject. Left empty, clients grab the first words of the email, which is usually a wasted opportunity. Keep it under about 90 characters.",
      validation: (rule) => rule.max(140),
    }),
    defineField({
      name: "blocks",
      title: "The email itself",
      type: "array",
      description: `Stacked top to bottom. ${VARIABLE_HELP}`,
      of: [
        defineArrayMember({
          type: "object",
          name: "emailHeading",
          title: "Heading",
          fields: [
            {
              name: "text",
              type: "string",
              validation: (rule) => rule.required(),
            },
            {
              name: "eyebrow",
              title: "Small label above it",
              type: "string",
              description: 'Optional, e.g. "Order confirmed".',
            },
          ],
          preview: {
            select: { title: "text", subtitle: "eyebrow" },
            prepare: ({ title, subtitle }) => ({
              title: title || "Heading",
              subtitle: subtitle ? `Heading · ${subtitle}` : "Heading",
            }),
          },
        }),
        defineArrayMember({
          type: "object",
          name: "emailText",
          title: "Paragraph",
          fields: [
            {
              name: "text",
              type: "text",
              rows: 4,
              validation: (rule) => rule.required(),
            },
            {
              name: "small",
              title: "Small print",
              type: "boolean",
              initialValue: false,
              description:
                "Quieter and smaller — for legal notes and reference numbers.",
            },
          ],
          preview: {
            select: { title: "text", small: "small" },
            prepare: ({ title, small }) => ({
              title: title || "Paragraph",
              subtitle: small ? "Small print" : "Paragraph",
            }),
          },
        }),
        defineArrayMember({
          type: "object",
          name: "emailImage",
          title: "Image",
          fields: [
            {
              name: "asset",
              title: "Image",
              type: "image",
              options: { hotspot: true },
              validation: (rule) => rule.required(),
            },
            {
              name: "alt",
              title: "Description",
              type: "string",
              description:
                "Required, and it does real work: Gmail, Outlook and Apple Mail block images until the reader allows them, so for a good share of recipients this text IS the image.",
              validation: (rule) => rule.required(),
            },
            {
              name: "width",
              title: "Width in pixels",
              type: "number",
              initialValue: 600,
              description:
                "600 is full width. Anything larger is capped — the email is 600px wide.",
              validation: (rule) => rule.min(40).max(600),
            },
            {
              name: "href",
              title: "Link to",
              type: "url",
              description: "Optional — makes the image clickable.",
            },
          ],
          preview: {
            select: { title: "alt", media: "asset" },
            prepare: ({ title, media }) => ({
              title: title || "Image",
              subtitle: "Image",
              media,
            }),
          },
        }),
        defineArrayMember({
          type: "object",
          name: "emailButton",
          title: "Button",
          fields: [
            {
              name: "label",
              type: "string",
              validation: (rule) => rule.required(),
            },
            {
              name: "href",
              title: "Links to",
              type: "string",
              description:
                "A full URL, or a variable like {{trackingUrl}} or {{shopUrl}}.",
              validation: (rule) => rule.required(),
            },
          ],
          preview: {
            select: { title: "label", subtitle: "href" },
            prepare: ({ title, subtitle }) => ({
              title: title || "Button",
              subtitle: `Button → ${subtitle ?? ""}`,
            }),
          },
        }),
        defineArrayMember({
          type: "object",
          name: "emailOrderSummary",
          title: "Order summary (what they bought)",
          description:
            "The line items, quantities and total, built from the real order. Nothing to fill in.",
          fields: [
            {
              name: "note",
              title: "Note",
              type: "string",
              readOnly: true,
              initialValue: "Filled from the order automatically.",
            },
          ],
          preview: {
            prepare: () => ({
              title: "Order summary",
              subtitle: "Line items and total, from the real order",
            }),
          },
        }),
        defineArrayMember({
          type: "object",
          name: "emailDivider",
          title: "Divider",
          fields: [
            {
              name: "note",
              type: "string",
              readOnly: true,
              initialValue: "A hairline rule.",
            },
          ],
          preview: { prepare: () => ({ title: "Divider" }) },
        }),
        defineArrayMember({
          type: "object",
          name: "emailSpacer",
          title: "Space",
          fields: [
            {
              name: "height",
              title: "Height in pixels",
              type: "number",
              initialValue: 20,
              validation: (rule) => rule.min(4).max(80),
            },
          ],
          preview: {
            select: { height: "height" },
            prepare: ({ height }) => ({ title: `Space · ${height ?? 20}px` }),
          },
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: { key: "key", enabled: "enabled", subject: "subject" },
    prepare: ({ key, enabled, subject }) => ({
      title: key ?? "Email",
      subtitle: `${enabled ? "Live" : "Draft — built-in still sending"}${subject ? ` · ${subject}` : ""}`,
    }),
  },
});
