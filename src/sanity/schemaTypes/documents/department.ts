import { LayersIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

/**
 * Top-level vertical (Outdoor Living, Living Room, Bedroom, …). Organisational
 * metadata for navigation only — it never appears in shop URLs, which stay
 * /shop/[category] exactly as today.
 */
export const department = defineType({
  name: "department",
  title: "Department",
  type: "document",
  icon: LayersIcon,
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "description", type: "text", rows: 2 }),
    defineField({
      name: "heroImage",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "order",
      type: "number",
      description: "Lower numbers appear first in navigation.",
      initialValue: 0,
    }),
    /**
     * A room can exist without occupying a slot in the main navigation.
     *
     * Cold Plunge and Outdoor Kitchen hold one and two products. As top-level
     * entries they cost the same header space as Living Room's fifty-eight and
     * lead to a near-empty page. Turning this off re-parents them under Outdoor
     * Living rather than deleting anything: the room keeps its URL, its page and
     * its categories, and stays reachable from the room it belongs to.
     */
    defineField({
      name: "showInMainNav",
      title: "Show in main navigation",
      type: "boolean",
      description:
        "Off means the room keeps its page and URL but gives up its top-level nav slot — for ranges too small to earn one yet. Reach it through its parent room instead.",
      initialValue: true,
    }),
    defineField({ name: "seo", type: "seo" }),
  ],
  orderings: [
    {
      title: "Display order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "slug.current" },
  },
});
