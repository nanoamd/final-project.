import type { PreviewValue } from "sanity";
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
    // Routes onward, near the top, for a reader who came for an answer and
    // would otherwise have to reach the bottom of the page to find the shop.
    defineArrayMember({ type: "guideLinkRow" }),
    /**
     * A picture, or a reserved space for one.
     *
     * `brief` is what makes an empty one useful. A guide written without
     * photography can still say, at the exact point in the text where a
     * picture belongs, what that picture should show — so filling it in later
     * is a matter of taking or finding the shot, not re-reading the article
     * and deciding where images would help. The renderer draws nothing until
     * an asset is there, so a brief that is never filled costs a reader
     * nothing; it is only visible here, in Studio.
     */
    defineArrayMember({
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          title: "Alt text",
          type: "string",
          description:
            "What the picture shows, for a reader who cannot see it. Describe the thing, not the file.",
        },
        {
          name: "caption",
          title: "Caption",
          type: "string",
          description:
            "Optional. Printed under the picture. A caption that repeats the alt text is worth deleting.",
        },
        {
          name: "brief",
          title: "What this picture should show",
          type: "text",
          rows: 3,
          description:
            "The shot this space is reserved for. Written when the article was, so it survives until someone takes the photo.",
        },
      ],
      preview: {
        select: {
          media: "asset",
          alt: "alt",
          caption: "caption",
          brief: "brief",
        },
        prepare: (value: Record<string, unknown>): PreviewValue => {
          const media = value.media;
          const alt = typeof value.alt === "string" ? value.alt : "";
          const caption =
            typeof value.caption === "string" ? value.caption : "";
          const brief = typeof value.brief === "string" ? value.brief : "";
          if (media) {
            return {
              // Studio resolves the asset reference itself; the declared
              // type only admits a ReactNode, hence the cast.
              media: media as PreviewValue["media"],
              title: caption || alt || "Image",
              subtitle: alt || undefined,
            };
          }
          return {
            title: `IMAGE NEEDED — ${brief || alt || "no brief written"}`,
            subtitle: "Empty. Drop a photo on this block to fill it.",
          };
        },
      },
    }),
  ],
});
