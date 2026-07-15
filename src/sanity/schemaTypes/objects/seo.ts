import { SearchIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

/**
 * Reusable SEO fields embedded in every content type. Empty fields fall back
 * to `seoDefaults` at render time — see src/lib/sanity/queries/seo.ts.
 */
export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  icon: SearchIcon,
  fields: [
    defineField({
      name: "metaTitle",
      title: "Meta title",
      type: "string",
      description: "Falls back to the site default template if left empty.",
    }),
    defineField({
      name: "metaDescription",
      title: "Meta description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "ogImage",
      title: "Social share image",
      type: "image",
      options: { hotspot: true },
    }),
  ],
  options: { collapsible: true, collapsed: true },
});
