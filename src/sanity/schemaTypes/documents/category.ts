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
    /**
     * The fields that turn a category into a landing page rather than a grid.
     *
     * The brief is explicit: "Every category page needs: SEO introduction, buying
     * guidance, FAQs, internal links, related categories, product explanations. No
     * empty product grids." Until now a category carried a one-line `description`
     * and nothing else, so 22 stocked categories were a heading and a grid — which
     * ranks for nothing, because there is no text on the page for a query to match.
     *
     * `description` stays as the short line used in tiles, cards and meta
     * descriptions. These are the page's own content.
     */
    defineField({
      name: "intro",
      title: "SEO introduction",
      type: "richText",
      description:
        "Two or three paragraphs at the top of the category, written for someone deciding what to buy — not a keyword list. This is the text the page ranks on.",
    }),
    defineField({
      name: "buyingGuide",
      title: "Buying guidance",
      type: "richText",
      description:
        "How to choose: sizes, materials, what suits which room, what to measure first. The questions asked before a purchase, answered on the page rather than in an email.",
    }),
    defineField({
      name: "faqs",
      title: "Category FAQs",
      type: "array",
      of: [{ type: "faqEntry" }],
      description:
        "Questions about the range as a whole, not one product. Rendered as FAQ structured data, so these can appear directly in search results.",
    }),
    defineField({
      name: "relatedCategories",
      title: "Related categories",
      type: "array",
      of: [{ type: "reference", to: [{ type: "category" }] }],
      description:
        "Two to four categories a shopper here would plausibly want next. These are the internal links the brief asks for, and they are how link equity reaches the categories nothing else points at.",
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
