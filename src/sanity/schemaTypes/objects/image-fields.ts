import type { PreviewValue } from "sanity";

/**
 * The fields every image on this site carries, and the preview that makes an
 * empty one legible.
 *
 * Kaiku has no photography of its own yet, and articles are being written
 * ahead of it. `brief` is how that works without losing anything: at the exact
 * point a picture belongs, the article says what that picture should show,
 * written by whoever wrote the surrounding paragraph and while they still had
 * it in their head. Filling it in later is then finding the shot — not
 * re-reading the piece and deciding where images would help.
 *
 * Nothing renders until an asset is there, so an unfilled brief costs a reader
 * nothing and gives Google nothing to index. It is visible in Studio only.
 */
export const IMAGE_FIELDS = [
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
];

/** Reads "IMAGE NEEDED — <the brief>" until the space is filled. */
export const imagePreview = {
  select: { media: "asset", alt: "alt", caption: "caption", brief: "brief" },
  prepare: (value: Record<string, unknown>): PreviewValue => {
    const alt = typeof value.alt === "string" ? value.alt : "";
    const caption = typeof value.caption === "string" ? value.caption : "";
    const brief = typeof value.brief === "string" ? value.brief : "";
    if (value.media) {
      return {
        // Studio resolves the asset reference itself; the declared type only
        // admits a ReactNode, hence the cast.
        media: value.media as PreviewValue["media"],
        title: caption || alt || "Image",
        subtitle: alt || undefined,
      };
    }
    return {
      title: `IMAGE NEEDED — ${brief || alt || "no brief written"}`,
      subtitle: "Empty. Drop a photo on this block to fill it.",
    };
  },
};
