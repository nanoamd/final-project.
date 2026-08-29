import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * A small reference table inside a buying guide.
 *
 * Damien pointed at a competitor's table lamp guide as the shape he wants, and
 * the thing that makes it work is that the numbers arrive as a table in the
 * first screen rather than as prose three paragraphs down. "Sofa side table,
 * 55 to 60cm, lamp 60 to 76cm, shade 33 to 40cm" is a row someone can act on;
 * the same information in a sentence is something they have to hold in their
 * head.
 *
 * Deliberately plain — headers and rows of strings, no cell formatting, no
 * merged cells. A guide table is a reference, and every feature added to it is
 * a way for one to end up looking different from the next.
 */
export const guideTable = defineType({
  name: "guideTable",
  title: "Reference table",
  type: "object",
  fields: [
    defineField({
      name: "caption",
      title: "Caption",
      type: "string",
      description:
        "Optional line above the table saying what it shows, e.g. “Lamp height by surface”.",
    }),
    defineField({
      name: "headers",
      title: "Column headings",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      validation: (rule) => rule.required().min(2).max(5),
    }),
    defineField({
      name: "rows",
      title: "Rows",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "guideTableRow",
          fields: [
            defineField({
              name: "cells",
              type: "array",
              of: [defineArrayMember({ type: "string" })],
            }),
          ],
          preview: {
            select: { cells: "cells" },
            prepare: ({ cells }) => ({
              title: Array.isArray(cells) ? cells.join(" · ") : "Row",
            }),
          },
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: { caption: "caption", rows: "rows" },
    prepare: ({ caption, rows }) => ({
      title: caption || "Reference table",
      subtitle: `${Array.isArray(rows) ? rows.length : 0} rows`,
    }),
  },
});
