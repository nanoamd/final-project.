import { defineField, defineType } from "sanity";

export const dimensions = defineType({
  name: "dimensions",
  title: "Dimensions",
  type: "object",
  fields: [
    defineField({ name: "length", title: "Length", type: "number" }),
    defineField({ name: "width", title: "Width", type: "number" }),
    defineField({ name: "height", title: "Height", type: "number" }),
    defineField({
      name: "unit",
      title: "Unit",
      type: "string",
      options: { list: ["mm", "cm", "m"] },
      initialValue: "cm",
    }),
  ],
  options: { collapsible: true, collapsed: true, columns: 4 },
});
