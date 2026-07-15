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
