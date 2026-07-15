import { TruckIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

/**
 * Structured supplier reference data — referenced by products rather than a
 * bare string, so lead time / contact details are entered once per supplier.
 */
export const supplier = defineType({
  name: "supplier",
  title: "Supplier",
  type: "document",
  icon: TruckIcon,
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "contactName", type: "string" }),
    defineField({ name: "email", type: "string" }),
    defineField({ name: "phone", type: "string" }),
    defineField({
      name: "defaultLeadTimeDays",
      title: "Default lead time (days)",
      type: "number",
    }),
    defineField({ name: "notes", type: "text", rows: 3 }),
  ],
  preview: {
    select: { title: "name", subtitle: "contactName" },
  },
});
