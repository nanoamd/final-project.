import { LinkIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

/**
 * A link that is either a reference to real content (preferred — can never
 * 404) or a plain external URL. Used by navigation and homepage CTAs so
 * editors pick real pages instead of typing hrefs by hand.
 */
export const link = defineType({
  name: "link",
  title: "Link",
  type: "object",
  icon: LinkIcon,
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "linkType",
      title: "Link type",
      type: "string",
      options: {
        list: [
          { title: "Internal page", value: "internal" },
          { title: "External URL", value: "external" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "internal",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "internalRef",
      title: "Page",
      type: "reference",
      to: [
        { type: "category" },
        { type: "department" },
        { type: "collection" },
        { type: "product" },
        { type: "page" },
        { type: "post" },
        { type: "buyingGuide" },
      ],
      hidden: ({ parent }) => parent?.linkType !== "internal",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { linkType?: string } | undefined;
          if (parent?.linkType === "internal" && !value) {
            return "Choose a page for an internal link.";
          }
          return true;
        }),
    }),
    defineField({
      name: "externalUrl",
      title: "URL",
      type: "url",
      hidden: ({ parent }) => parent?.linkType !== "external",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { linkType?: string } | undefined;
          if (parent?.linkType === "external" && !value) {
            return "Enter a URL for an external link.";
          }
          return true;
        }),
    }),
  ],
  preview: {
    select: { label: "label", linkType: "linkType", externalUrl: "externalUrl" },
    prepare({ label, linkType, externalUrl }) {
      return {
        title: label || "Untitled link",
        subtitle: linkType === "external" ? externalUrl : "Internal",
      };
    },
  },
});
