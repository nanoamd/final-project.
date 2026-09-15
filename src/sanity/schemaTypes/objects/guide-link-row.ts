import { defineField, defineType } from "sanity";

/**
 * A row of category links, for the top of a guide.
 *
 * A guide that ranks brings a reader who is researching, not shopping. They
 * arrived for an answer, and the ordinary route onward — a related-products
 * grid at the very bottom — is reached by the small fraction who read to the
 * end. Putting the routes out near the top costs nothing and catches the rest.
 *
 * Deliberately a small number of links rather than a menu. Four is a choice; a
 * dozen is a navigation bar, which the page already has.
 */
export const guideLinkRow = defineType({
  name: "guideLinkRow",
  title: "Category links",
  type: "object",
  fields: [
    defineField({
      name: "intro",
      title: "Line above the links",
      type: "string",
      description:
        "Optional. Something like 'Looking for a planter rather than an answer?'",
    }),
    defineField({
      name: "links",
      title: "Links",
      type: "array",
      validation: (rule) => rule.max(6),
      of: [
        {
          type: "object",
          name: "guideLink",
          fields: [
            defineField({
              name: "label",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "href",
              type: "string",
              description: "A path on this site, e.g. /shop/planters",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: "label", subtitle: "href" } },
        },
      ],
    }),
  ],
  preview: {
    select: { links: "links" },
    prepare: ({ links }: { links?: unknown[] }) => ({
      title: `Category links (${links?.length ?? 0})`,
    }),
  },
});
