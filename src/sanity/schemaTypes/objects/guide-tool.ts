import { defineField, defineType } from "sanity";

/**
 * An embedded calculator inside a buying guide.
 *
 * The guides state the arithmetic and then linked out to /tools to run it,
 * which asks the reader to leave the page they came to read. Damien asked for
 * the tool to sit in the guide instead, at the point where the guide has just
 * given the rule it computes.
 *
 * The value stored is only the tool's name. Which component that maps to, and
 * where its full page lives, is code — a CMS field is a bad place to keep a
 * component reference, and a guide should not break when a tool is renamed.
 */
export const guideTool = defineType({
  name: "guideTool",
  title: "Embedded calculator",
  type: "object",
  fields: [
    defineField({
      name: "tool",
      title: "Calculator",
      type: "string",
      options: {
        list: [
          { title: "Wall clock size and height", value: "wall-clock-size" },
          { title: "Vase size and stems", value: "vase-size" },
          { title: "Planter size and compost", value: "planter-size" },
          { title: "Pendant light size and drop", value: "pendant-light" },
          { title: "Mirror size and hanging height", value: "mirror-size" },
          { title: "Dining set space (garden)", value: "dining-space" },
          {
            title: "Dining table size and seating (indoor)",
            value: "dining-table-space",
          },
          { title: "Patio heater output", value: "patio-heat" },
          {
            title: "Garden furniture material",
            value: "furniture-material",
          },
          { title: "Bed size and room fit", value: "bed-size" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "caption",
      title: "Heading",
      type: "string",
      description:
        "Optional. Overrides the tool's own name, so the heading can be phrased as the question the guide has just raised.",
    }),
  ],
  preview: {
    select: { tool: "tool", caption: "caption" },
    prepare: ({ tool, caption }) => ({
      title: caption || "Embedded calculator",
      subtitle: tool,
    }),
  },
});
