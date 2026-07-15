import { defineField, defineType } from "sanity";

export const weight = defineType({
  name: "weight",
  title: "Weight",
  type: "object",
  fields: [
    defineField({ name: "value", title: "Value", type: "number" }),
    defineField({
      name: "unit",
      title: "Unit",
      type: "string",
      options: { list: ["kg", "g"] },
      initialValue: "kg",
    }),
  ],
  options: { columns: 2 },
});
