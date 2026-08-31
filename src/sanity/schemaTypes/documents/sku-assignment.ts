import { HashIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

/**
 * A record of one product code being assigned or changed, written by
 * scripts/assign-skus.ts — never edited by hand.
 *
 * Same reasoning as `priceAdjustment`: a code that ends up on an invoice, in a
 * Merchant Center listing or in a supplier reorder needs to be traceable to
 * the moment it changed and the reason it changed, not just to whatever it
 * happens to be today.
 */
export const skuAssignment = defineType({
  name: "skuAssignment",
  title: "SKU Assignment",
  type: "document",
  icon: HashIcon,
  fields: [
    defineField({
      name: "product",
      type: "reference",
      to: [{ type: "product" }],
      // Weak: a strong reference from this audit trail once blocked Damien
      // from publishing a draft it had touched, because Sanity won't delete
      // a document something still strongly references, and publishing a
      // draft deletes it as part of that same transaction. A log should
      // never be able to hold the thing it's logging hostage.
      weak: true,
      validation: (rule) => rule.required(),
    }),
    // Denormalised so the log still reads if the product is later renamed or
    // deleted.
    defineField({ name: "productTitle", type: "string" }),
    defineField({
      name: "previousSku",
      type: "string",
      description: "Empty where the product had no code before.",
    }),
    defineField({
      name: "newSku",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "reason",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "source",
      type: "string",
      description: "The script responsible.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "assignedAt",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    {
      title: "Newest first",
      name: "assignedAtDesc",
      by: [{ field: "assignedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "productTitle",
      previousSku: "previousSku",
      newSku: "newSku",
    },
    prepare: ({ title, previousSku, newSku }) => ({
      title,
      subtitle: previousSku ? `${previousSku} → ${newSku}` : `→ ${newSku}`,
    }),
  },
});
