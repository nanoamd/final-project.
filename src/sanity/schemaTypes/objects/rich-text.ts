import { defineArrayMember, defineType } from "sanity";

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
    defineArrayMember({ type: "block" }),
    // A reference table. Buying guides lead with numbers, and numbers in a
    // table are usable in a way the same numbers in a paragraph are not.
    defineArrayMember({ type: "guideTable" }),
    defineArrayMember({ type: "guideTool" }),
    defineArrayMember({
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          title: "Alt text",
          type: "string",
        },
      ],
    }),
  ],
});
