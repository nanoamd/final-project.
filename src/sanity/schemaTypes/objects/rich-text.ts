import { defineArrayMember, defineType } from "sanity";

import { IMAGE_FIELDS, imagePreview } from "./image-fields";

/**
 * Shared portable-text body used by pages, posts and buying guides — standard
 * prose blocks plus inline images. Defined once so future block types (e.g.
 * an embedded product callout) land everywhere at once.
 */
export const richText = defineType({
  name: "richText",
  title: "Body",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      // Replaces Sanity's default annotation set on purpose — see
      // `inline-link.ts` for the name collision that would otherwise hand the
      // editor the navigation link object instead.
      marks: { annotations: [{ name: "inlineLink", type: "inlineLink" }] },
    }),
    // A reference table. Buying guides lead with numbers, and numbers in a
    // table are usable in a way the same numbers in a paragraph are not.
    defineArrayMember({ type: "guideTable" }),
    defineArrayMember({ type: "guideTool" }),
    // Routes onward, near the top, for a reader who came for an answer and
    // would otherwise have to reach the bottom of the page to find the shop.
    defineArrayMember({ type: "guideLinkRow" }),
    /**
     * A picture, or a reserved space for one. See `image-fields.ts` for why an
     * empty one is worth having.
     */
    defineArrayMember({
      type: "image",
      options: { hotspot: true },
      fields: IMAGE_FIELDS,
      preview: imagePreview,
    }),
  ],
});
