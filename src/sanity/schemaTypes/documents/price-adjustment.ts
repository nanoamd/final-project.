import { TrendingUpIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

/**
 * A record of one automated price change, written by
 * scripts/audit-and-fix-margins.ts — never edited by hand.
 *
 * Damien's own rule, verbatim: "I need to know why Kaiku is charging £63
 * rather than £57 — not discover six months later that an AI script changed
 * it." Every field here exists to answer that question without needing to
 * trust anyone's memory of why: what it was, what it became, what it was
 * costing to fulfil at the time, and the arithmetic that connects the two.
 *
 * This only ever touches the customer-facing selling price, never
 * `costPrice` — the trade cost is a fact about the supplier, not a lever to
 * pull, and this document type has no field that could record a cost change
 * because none should ever happen this way.
 */
export const priceAdjustment = defineType({
  name: "priceAdjustment",
  title: "Price Adjustment",
  type: "document",
  icon: TrendingUpIcon,
  fields: [
    defineField({
      name: "product",
      type: "reference",
      to: [{ type: "product" }],
      // Weak, for the same reason skuAssignment's product reference is: a
      // strong reference from an audit log can block Sanity from deleting
      // the draft it points at, which is exactly what publishing a draft
      // does as part of its own transaction. See sku-assignment.ts.
      weak: true,
      validation: (rule) => rule.required(),
    }),
    // Denormalised so the log still reads if the product is later renamed,
    // recategorised or deleted.
    defineField({ name: "productTitle", type: "string" }),
    defineField({ name: "sku", type: "string" }),
    defineField({ name: "supplierSku", type: "string" }),
    defineField({
      name: "previousPrice",
      type: "number",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "newPrice",
      type: "number",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "costPrice", type: "number" }),
    defineField({ name: "shippingCost", type: "number" }),
    defineField({
      name: "previousMarginPct",
      title: "Previous margin (%)",
      type: "number",
    }),
    defineField({
      name: "newMarginPct",
      title: "New margin (%)",
      type: "number",
    }),
    defineField({
      name: "compareAtPriceCleared",
      title: "Compare-at price cleared",
      type: "boolean",
      description:
        "True when this adjustment also removed a stale compareAtPrice — one that no longer exceeds the new selling price, so it would have shown a false discount.",
      initialValue: false,
    }),
    defineField({
      name: "reason",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "source",
      type: "string",
      description: "The script or process responsible, e.g. a file path.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "adjustedAt",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    {
      title: "Newest first",
      name: "adjustedAtDesc",
      by: [{ field: "adjustedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "productTitle",
      previousPrice: "previousPrice",
      newPrice: "newPrice",
    },
    prepare: ({ title, previousPrice, newPrice }) => ({
      title,
      subtitle: `£${previousPrice} → £${newPrice}`,
    }),
  },
});
