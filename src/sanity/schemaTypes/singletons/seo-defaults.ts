import { SearchIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

/** Site-wide SEO fallback used when a document's own `seo` fields are empty. */
export const seoDefaults = defineType({
  name: "seoDefaults",
  title: "SEO Defaults",
  type: "document",
  icon: SearchIcon,
  fields: [
    defineField({
      name: "defaultMetaTitleTemplate",
      type: "string",
      description: 'Use "%s" as the page-title placeholder, e.g. "%s — Kaiku".',
    }),
    defineField({ name: "defaultMetaDescription", type: "text", rows: 3 }),
    defineField({
      name: "defaultOgImage",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "twitterHandle", type: "string" }),
    defineField({
      name: "robotsIndexByDefault",
      title: "Allow indexing by default",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    prepare() {
      return { title: "SEO Defaults" };
    },
  },
});
