import { SettingsIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  icon: SettingsIcon,
  fields: [
    defineField({ name: "siteName", type: "string" }),
    defineField({ name: "legalName", type: "string" }),
    defineField({ name: "tagline", type: "string" }),
    defineField({ name: "description", type: "text", rows: 2 }),
    defineField({ name: "logo", type: "image" }),
    defineField({ name: "email", type: "string" }),
    defineField({ name: "phone", type: "string" }),
    defineField({
      name: "address",
      type: "object",
      fields: [
        { name: "line1", type: "string" },
        { name: "line2", type: "string" },
        { name: "city", type: "string" },
        { name: "postcode", type: "string" },
        { name: "country", type: "string" },
      ],
    }),
    defineField({
      name: "socialLinks",
      type: "array",
      of: [
        {
          type: "object",
          name: "socialLink",
          fields: [
            {
              name: "platform",
              type: "string",
              options: {
                list: ["Instagram", "Facebook", "Pinterest", "TikTok", "LinkedIn"],
              },
            },
            { name: "url", type: "url" },
          ],
          preview: { select: { title: "platform", subtitle: "url" } },
        },
      ],
    }),
    defineField({
      name: "defaultCurrency",
      type: "string",
      options: { list: ["GBP", "EUR", "USD"] },
      initialValue: "GBP",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site Settings" };
    },
  },
});
