import { FolderIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

const ICON_NAMES = [
  "warehouse",
  "droplets",
  "columns3",
  "sofa",
  "flame",
  "cooking-pot",
  "lightbulb",
  "sprout",
  "waves",
  "package",
  "rows3",
  "home",
  "leaf",
] as const;

export const category = defineType({
  name: "category",
  title: "Category",
  type: "document",
  icon: FolderIcon,
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
    defineField({
      name: "department",
      title: "Primary room",
      type: "reference",
      to: [{ type: "department" }],
      description:
        "The room this category belongs to first. Drives its breadcrumb and its URL's place in the hierarchy.",
    }),
    /**
     * A category can be shopped from more than one room.
     *
     * Wellness Accessories is the case that forced this: the oils and buckets
     * belong under Sauna and under Outdoor Living, and `department` is a single
     * reference, so it could only ever be one. Mirroring how a product already
     * carries `additionalCategories`.
     */
    defineField({
      name: "additionalDepartments",
      title: "Also shown in these rooms",
      type: "array",
      of: [{ type: "reference", to: [{ type: "department" }] }],
      description:
        "Extra rooms this category should be selectable from. The primary room above does not need repeating here.",
    }),
    /**
     * Some categories should be reachable from a room without being poured into
     * that room's product grid.
     *
     * Tapping Sauna should show saunas. It should not show four bottles of
     * essential oil alongside a £5,279 cabin, even though those oils are
     * legitimately part of the sauna world and should be one tap away.
     */
    defineField({
      name: "excludeFromRoomGrid",
      title: "Keep out of room product grids",
      type: "boolean",
      description:
        "The category stays selectable from its rooms, but its products do not appear in those rooms' combined grids. For accessory ranges that would otherwise swamp the products someone came for.",
      initialValue: false,
    }),
    defineField({ name: "tagline", type: "string" }),
    defineField({ name: "description", type: "text", rows: 3 }),
    defineField({
      name: "heroImage",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "iconName",
      title: "Icon",
      type: "string",
      description: "Resolved to a matching icon in the storefront.",
      options: { list: [...ICON_NAMES] },
      initialValue: "leaf",
    }),
    defineField({
      name: "comingSoon",
      title: "Show as “coming soon”",
      type: "boolean",
      description:
        "Editorial override — show the coming-soon state even if products exist.",
      initialValue: false,
    }),
    defineField({
      name: "order",
      type: "number",
      initialValue: 0,
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
    select: { title: "title", subtitle: "slug.current", media: "heroImage" },
  },
});
