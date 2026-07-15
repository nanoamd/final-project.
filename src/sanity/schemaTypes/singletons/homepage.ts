import { HomeIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

/**
 * Singleton — maps 1:1 onto the five live homepage sections' current props
 * (Hero, TrustBar, ShopByCategory, GardenStudio, DesignedForLiving). Purely
 * makes today's hardcoded constants editable; no structural change.
 */
export const homepage = defineType({
  name: "homepage",
  title: "Homepage",
  type: "document",
  icon: HomeIcon,
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "trustBar", title: "Trust bar" },
    { name: "shopByCategory", title: "Shop by category" },
    { name: "gardenStudio", title: "Garden Studio" },
    { name: "designedForLiving", title: "Designed for living" },
  ],
  fields: [
    // Hero ------------------------------------------------------------
    defineField({ name: "heroEyebrow", type: "string", group: "hero" }),
    defineField({ name: "heroHeadline", type: "string", group: "hero" }),
    defineField({ name: "heroHighlight", title: "Highlighted word", type: "string", group: "hero" }),
    defineField({ name: "heroSubcopy", type: "text", rows: 2, group: "hero" }),
    defineField({
      name: "heroImage",
      type: "image",
      options: { hotspot: true },
      group: "hero",
    }),
    defineField({ name: "heroCtaPrimary", type: "link", group: "hero" }),
    defineField({ name: "heroCtaSecondary", type: "link", group: "hero" }),
    defineField({
      name: "heroFeaturedProduct",
      title: "Featured product (floating card)",
      type: "reference",
      to: [{ type: "product" }],
      group: "hero",
    }),

    // Trust bar ------------------------------------------------------
    defineField({
      name: "trustBarItems",
      type: "array",
      group: "trustBar",
      of: [
        {
          type: "object",
          name: "trustBarItem",
          fields: [
            { name: "iconName", type: "string" },
            { name: "title", type: "string" },
            { name: "copy", type: "string" },
          ],
          preview: { select: { title: "title", subtitle: "copy" } },
        },
      ],
    }),

    // Shop by category -------------------------------------------------
    defineField({
      name: "shopByCategoryEyebrow",
      type: "string",
      group: "shopByCategory",
    }),
    defineField({
      name: "shopByCategoryTiles",
      type: "array",
      group: "shopByCategory",
      of: [
        {
          type: "object",
          name: "categoryTile",
          fields: [
            { name: "category", type: "reference", to: [{ type: "category" }] },
            {
              name: "imageOverride",
              type: "image",
              options: { hotspot: true },
            },
          ],
          preview: {
            select: { title: "category.title", media: "imageOverride" },
          },
        },
      ],
    }),

    // Garden Studio ------------------------------------------------
    defineField({ name: "gardenStudioEyebrow", type: "string", group: "gardenStudio" }),
    defineField({ name: "gardenStudioHeadline", type: "string", group: "gardenStudio" }),
    defineField({ name: "gardenStudioBody", type: "text", rows: 3, group: "gardenStudio" }),
    defineField({
      name: "gardenStudioBeforeImage",
      title: "Before image (slider)",
      type: "image",
      options: { hotspot: true },
      group: "gardenStudio",
    }),
    defineField({
      name: "gardenStudioAfterImage",
      title: "After image (slider)",
      type: "image",
      options: { hotspot: true },
      group: "gardenStudio",
    }),
    defineField({
      name: "gardenStudioImages",
      title: "Scene thumbnails",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
      group: "gardenStudio",
    }),
    defineField({ name: "gardenStudioCta", type: "link", group: "gardenStudio" }),

    // Designed for living ------------------------------------------
    defineField({
      name: "designedForLivingHeadline",
      type: "string",
      group: "designedForLiving",
    }),
    defineField({
      name: "designedForLivingCards",
      type: "array",
      group: "designedForLiving",
      of: [
        {
          type: "object",
          name: "livingCard",
          fields: [
            { name: "title", type: "string" },
            { name: "copy", type: "string" },
            { name: "image", type: "image", options: { hotspot: true } },
          ],
          preview: { select: { title: "title", media: "image" } },
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Homepage" };
    },
  },
});
