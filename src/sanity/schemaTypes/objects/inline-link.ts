import { defineField, defineType } from "sanity";

/**
 * A link inside a sentence.
 *
 * Named `inlineLink` rather than `link` because `link` is already taken by the
 * navigation/CTA object, which is a different thing: a label plus a reference
 * picker. Sanity resolves annotation types by name globally, so leaving the
 * block's default annotation in place would have handed the editor that
 * object — three fields, none of them `href` — while the renderer reads
 * `href`. Nothing in the dataset used an annotation yet, so this is the moment
 * to name it unambiguously rather than the moment to discover the collision.
 *
 * A plain path rather than a reference, because a guide links to categories,
 * tools and other guides as often as to products, and because hand-editing a
 * path is faster than opening a picker.
 */
export const inlineLink = defineType({
  name: "inlineLink",
  title: "Link",
  type: "object",
  fields: [
    defineField({
      name: "href",
      title: "Link to",
      type: "string",
      description:
        "A path on this site — /shop/planters, /shop/planters/zircon-large-planter, /learn/choosing-a-planter — or a full https:// address.",
      validation: (rule) => rule.required(),
    }),
  ],
});
