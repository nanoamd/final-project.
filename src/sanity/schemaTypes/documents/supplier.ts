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
    /**
     * The supplier's carriage terms, which supersede `carriageIncludedInCost`
     * for anything more complex than a yes/no — a weight-banded courier rate or
     * a carriage-paid threshold cannot be expressed as a boolean.
     *
     * scripts/apply-supplier-shipping-rules.ts derives each product's
     * `shippingCost` from this, so a change to a supplier's terms is one edit
     * here rather than a pass over every product they supply.
     */
    defineField({
      name: "shippingRule",
      title: "Carriage terms",
      type: "shippingRule",
    }),
    /**
     * Which marketplaces this supplier's goods may be resold on.
     *
     * Dropship suppliers commonly forbid Amazon and eBay in their trade terms,
     * and breaching that gets the trade account closed rather than generating a
     * warning. So this is recorded per supplier — it is their rule, not a
     * per-product one — and read by `scripts/marketplace-eligible-products.ts`.
     *
     * **Unset means unknown, and unknown is treated as not permitted.** An
     * empty list must never be read as "anything goes": the cost of wrongly
     * listing is losing the supplier, and the cost of wrongly withholding is a
     * delayed listing. Only a marketplace explicitly ticked here, with its
     * source recorded below, counts as permission.
     */
    /**
     * A surcharge for breaking a wholesale pack — ordering one unit of
     * something the supplier sells in sixes or twelves.
     *
     * Premier Housewares state it in their own trade FAQ: "you can split
     * packs, but a 10% surcharge will apply, this will be automatically
     * added depending on the quantity you add to your shopping basket".
     * On a dropship account every order is a split pack by definition, so
     * for pack items this is a permanent 10% on cost, not an edge case.
     *
     * The RATE is recorded here because it is a supplier's rule. WHICH
     * products it applies to is a per-product fact (`packQuantity`), and
     * until that is known the margin report shows both cases rather than
     * picking one.
     */
    defineField({
      name: "splitPackSurchargeRate",
      title: "Split-pack surcharge (decimal, e.g. 0.1 for 10%)",
      type: "number",
      description:
        "Charged when you order fewer than a full wholesale pack. Leave unset if they do not charge one. Only applies to products with a packQuantity above 1.",
      validation: (rule) => rule.min(0).max(1),
    }),
    defineField({
      name: "marketplacesAllowed",
      title: "Marketplaces this supplier permits",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: ["eBay", "Amazon", "OnBuy", "Etsy"],
      },
      description:
        "Tick only what their trade terms actually permit. Leave empty if you have not checked — empty is treated as 'not permitted', never as 'allowed'.",
    }),
    defineField({
      name: "marketplacePolicySource",
      title: "Where that came from",
      type: "string",
      description:
        "The clause, page or email that says so — e.g. 'Trade T&Cs cl. 7.2' or 'email from Sam, 3 Sept'. Without a source this is a guess.",
    }),
    defineField({ name: "notes", type: "text", rows: 3 }),
  ],
  preview: {
    select: { title: "name", subtitle: "contactName" },
  },
});
