import { defineField, defineType } from "sanity";

/** A configurable choice on the product page, e.g. Size: [Small, Medium, Large]. */
export const productOption = defineType({
  name: "productOption",
  title: "Option",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      description: 'e.g. "Size" or "Heater option"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "values",
      title: "Values",
      type: "array",
      of: [{ type: "string" }],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: { title: "label", values: "values" },
    prepare({ title, values }) {
      return { title, subtitle: (values ?? []).join(", ") };
    },
  },
});
