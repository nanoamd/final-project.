import { defineField, defineType } from "sanity";

/**
 * What a supplier charges Kaiku to carry a product. Entered once per supplier,
 * not per product — see src/lib/suppliers/shipping-rules.ts for the resolver
 * and the reasoning.
 *
 * **Never shown to a customer and never added to a price.** Delivery is free on
 * every product; this is the carriage cost that comes out of Kaiku's margin, and
 * it exists so a margin figure is real rather than optimistic.
 */
export const shippingRule = defineType({
  name: "shippingRule",
  title: "Shipping rule",
  type: "object",
  description:
    "What this supplier charges Kaiku for carriage. Internal only — the customer always gets free UK delivery, so this comes out of margin.",
  fields: [
    defineField({
      name: "kind",
      title: "How they charge",
      type: "string",
      options: {
        list: [
          {
            title: "Carriage included in the trade price",
            value: "included",
          },
          { title: "Flat charge per order", value: "flatPerOrder" },
          { title: "Flat charge per item", value: "flatPerItem" },
          { title: "By item weight (bands)", value: "weightBands" },
          {
            title: "Free over an order value, otherwise flat",
            value: "freeOverOrderValue",
          },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "amount",
      title: "Amount (£)",
      type: "number",
      description: "For a flat per-order or per-item charge.",
      hidden: ({ parent }) =>
        parent?.kind !== "flatPerOrder" && parent?.kind !== "flatPerItem",
      validation: (rule) =>
        rule.custom((value, context) => {
          const kind = (context.parent as { kind?: string } | undefined)?.kind;
          if (kind !== "flatPerOrder" && kind !== "flatPerItem") return true;
          if (typeof value !== "number") return "Enter the amount they charge.";
          return value >= 0 || "An amount cannot be negative.";
        }),
    }),
    defineField({
      name: "bands",
      title: "Weight bands",
      type: "array",
      description:
        "Lightest first. Each band's weight is its upper limit, inclusive. A product heavier than the last band is treated as unknown rather than free — add a band for it, or leave it to be quoted.",
      hidden: ({ parent }) => parent?.kind !== "weightBands",
      of: [
        {
          type: "object",
          name: "weightBand",
          fields: [
            {
              name: "maxKg",
              title: "Up to and including (kg)",
              type: "number",
              validation: (rule) => rule.required().positive(),
            },
            {
              name: "amount",
              title: "Charge (£)",
              type: "number",
              validation: (rule) => rule.required().min(0),
            },
          ],
          preview: {
            select: { maxKg: "maxKg", amount: "amount" },
            prepare: ({ maxKg, amount }) => ({
              title: `≤ ${maxKg}kg — £${amount}`,
            }),
          },
        },
      ],
    }),
    defineField({
      name: "threshold",
      title: "Free over (£)",
      type: "number",
      hidden: ({ parent }) => parent?.kind !== "freeOverOrderValue",
    }),
    defineField({
      name: "amountBelowThreshold",
      title: "Charge below the threshold (£)",
      type: "number",
      hidden: ({ parent }) => parent?.kind !== "freeOverOrderValue",
    }),
    defineField({
      name: "notes",
      type: "text",
      rows: 2,
      description:
        "Anything the shape above cannot express — remote-postcode surcharges, pallet terms, minimum orders.",
    }),
  ],
});
