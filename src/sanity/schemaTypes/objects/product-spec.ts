import { defineField, defineType } from "sanity";

/** A single free-form spec-sheet row, e.g. "Capacity" / "2–3 people". */
export const productSpec = defineType({
  name: "productSpec",
  title: "Specification",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "value",
      title: "Value",
      type: "string",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "value" },
  },
});
