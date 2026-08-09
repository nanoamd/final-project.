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
    /**
     * Whether carriage is inside the trade price or billed on top. This lives on
     * the supplier because it is a fact about their terms, not about any one
     * product — and because without it a product's `shippingCost` of 0 is
     * ambiguous. It could mean "they deliver free" or "nobody has worked it out
     * yet", and those give very different margins. SaunaPlunge include delivery
     * in the trade price; D.I. Designs bill £80 an item separately.
     *
     * scripts/margin-report.ts reads this: when carriage is included, a missing
     * or zero shippingCost is taken at face value; when it is not, the product's
     * margin is reported as a best case until a real figure is entered.
     */
    defineField({
      name: "carriageIncludedInCost",
      title: "Carriage included in the trade price?",
      type: "boolean",
      description:
        "On: the cost price already covers delivery to the customer, so a shipping cost of 0 on their products is real. Off or unset: they bill carriage separately, and a product with no shipping cost recorded has an overstated margin.",
    }),
    defineField({ name: "notes", type: "text", rows: 3 }),
  ],
  preview: {
    select: { title: "name", subtitle: "contactName" },
  },
});
