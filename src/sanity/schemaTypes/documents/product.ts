import { PackageIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

import {
  COLOUR_TAGS,
  MATERIAL_TAGS,
  ROOM_TAGS,
  USE_TAGS,
} from "@/lib/catalog/facets";
import { CostPriceInput } from "@/sanity/components/cost-price-input";
import { MarginDisplay } from "@/sanity/components/margin-display";

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  icon: PackageIcon,
  groups: [
    /**
     * Identity is the tab you land on, so it holds only what is needed to get a
     * product listed: what it is, where it goes, and its name.
     *
     * The summary and the full description used to sit here too. Damien, while
     * listing products: "stop making everything scroll when doing it its making
     * uploading products really confusing". He was right — a three-row textarea
     * and a full rich-text editor sat between the title and everything else, so
     * every product opened with two large boxes in front of the fields that
     * actually needed filling in. They have their own tab now.
     */
    { name: "identity", title: "Identity", default: true },
    { name: "copy", title: "Copy" },
    { name: "commerce", title: "Pricing" },
    { name: "identifiers", title: "Identifiers & Supplier" },
    { name: "logistics", title: "Logistics" },
    { name: "merchandising", title: "Merchandising" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    // Identity ----------------------------------------------------------
    defineField({
      name: "title",
      type: "string",
      group: "identity",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "identity",
      options: {
        /**
         * Derived from the title with the brand suffix removed.
         *
         * Sanity's default `source: "title"` slugifies the whole string, and
         * every product title ends "| Kaiku" — which slugifies to "-or-kaiku".
         * Pressing Generate in Studio produced live URLs like
         * `rhombus-metal-privacy-screen-with-stand-black-or-kaiku`, on
         * published products, silently changing the address a page had been
         * indexed under.
         */
        source: (doc) =>
          String((doc as { title?: unknown }).title ?? "")
            .replace(/\s*\|\s*Kaiku(?:\s+Tagline)?\s*$/i, "")
            .trim(),
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      type: "reference",
      group: "identity",
      to: [{ type: "category" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "additionalCategories",
      title: "Also shown in these categories",
      type: "array",
      group: "identity",
      of: [{ type: "reference", to: [{ type: "category" }] }],
      description:
        "Optional — list any other categories this product should also appear in, besides its primary category above (e.g. a bathroom cabinet that's also general Interior Furniture). The product's own URL still uses the primary category.",
    }),
    defineField({
      name: "brand",
      type: "reference",
      group: "identity",
      to: [{ type: "brand" }],
    }),

    // Copy ----------------------------------------------------------------
    // Kept off the Identity tab so listing a product is a short form.
    defineField({ name: "tagline", type: "string", group: "copy" }),
    defineField({
      name: "summary",
      title: "Short summary",
      type: "text",
      rows: 3,
      group: "copy",
    }),
    defineField({
      name: "description",
      title: "Full description",
      type: "richText",
      group: "copy",
    }),

    // Commerce ------------------------------------------------------------
    defineField({
      name: "price",
      title: "Price",
      type: "number",
      group: "commerce",
      validation: (rule) => rule.required().positive(),
    }),
    defineField({
      name: "compareAtPrice",
      title: "Compare-at price (was/now)",
      type: "number",
      group: "commerce",
    }),
    defineField({
      name: "costPrice",
      title: "Cost price",
      type: "number",
      group: "commerce",
      components: { input: CostPriceInput },
      description:
        "The TRUE landed cost — including any VAT the supplier charges that Kaiku can't reclaim (Kaiku is not VAT-registered). Premier Housewares invoice 20% on top of their trade list price: type their list price in here, then use the +20% VAT button beside the box rather than doing the sum by hand.",
    }),
    defineField({
      name: "costPriceVatCorrected",
      title: "Cost price already includes supplier VAT",
      type: "boolean",
      group: "commerce",
      hidden: true,
      description:
        "Set automatically by scripts/fix-premier-housewares-margins.ts once costPrice has had the supplier's VAT added. Stops a future run of that script adding the 20% a second time.",
    }),
    defineField({
      name: "shippingCost",
      title: "Shipping cost",
      type: "number",
      group: "commerce",
      description:
        "What the supplier charges to ship this item to the customer (e.g. AW Dropship's per-parcel courier rate). Not shown on the storefront — internal only.",
    }),
    defineField({
      name: "currency",
      type: "string",
      group: "commerce",
      initialValue: "GBP",
      options: { list: ["GBP", "EUR", "USD"] },
    }),
    defineField({
      name: "marginDisplay",
      title: "Margin",
      type: "string",
      group: "commerce",
      components: { field: MarginDisplay },
      readOnly: true,
    }),

    // Identifiers & Supplier ----------------------------------------------
    defineField({
      name: "sku",
      title: "SKU",
      type: "string",
      group: "identifiers",
    }),
    defineField({
      name: "gtin",
      title: "GTIN / EAN",
      type: "string",
      group: "identifiers",
    }),
    defineField({
      name: "mpn",
      title: "MPN",
      type: "string",
      group: "identifiers",
    }),
    /**
     * The supplier's own product code, kept alongside our `sku`.
     *
     * `sku` is ours (KK-CT-ABB-BRN-001) and deliberately so — it is what goes to
     * Google and on an invoice. But it shares nothing with the supplier's code
     * (D.I. Designs call the same table CT-04B), which leaves no key at all
     * linking a product on the site to the same product in a supplier's data.
     * Re-importing then creates a second draft of a table already on sale, and
     * nothing catches it: the titles differ in word order ("Abberley Brown
     * Coffee Table" against "Abberley Coffee Table in Brown"), so the slugs
     * differ too.
     *
     * import-supplier-products.ts writes this and matches on it, so every future
     * import of a supplier's range is de-duplicated against what is already
     * listed. Also what makes reordering possible without hunting through emails.
     */
    defineField({
      name: "supplierSku",
      title: "Supplier's product code",
      type: "string",
      group: "identifiers",
      description:
        "The code the supplier uses for this item, e.g. D.I. Designs' CT-04B. Not ours and not shown on the storefront — it is how a re-import recognises a product we already list, and how you reorder it.",
    }),
    defineField({
      name: "supplier",
      type: "reference",
      group: "identifiers",
      to: [{ type: "supplier" }],
    }),
    defineField({
      name: "sourceUrl",
      title: "Source URL",
      type: "url",
      group: "identifiers",
      description:
        "The supplier page this product was imported from, if created via the admin URL importer.",
    }),

    // Logistics -------------------------------------------------------------
    defineField({ name: "dimensions", type: "dimensions", group: "logistics" }),
    defineField({ name: "weight", type: "weight", group: "logistics" }),
    defineField({
      name: "deliveryLeadTime",
      title: "Delivery lead time",
      type: "string",
      group: "logistics",
      description: 'Free text, e.g. "3–6 weeks".',
    }),
    defineField({
      name: "stockStatus",
      title: "Stock status",
      type: "string",
      group: "logistics",
      options: {
        list: [
          "In Stock",
          "Out of Stock",
          "Backorder",
          "Made to Order",
          "Coming Soon",
        ],
      },
      initialValue: "In Stock",
    }),
    defineField({
      name: "stockQuantity",
      title: "Stock quantity",
      type: "number",
      group: "logistics",
    }),
    defineField({
      name: "deliveryNotes",
      title: "Delivery copy",
      type: "text",
      rows: 3,
      group: "logistics",
      description:
        "Anything specific to this piece. The lead time, availability and " +
        "delivery method are shown automatically above it, so do not repeat them.",
    }),
    defineField({
      name: "returnsNotes",
      title: "Returns copy",
      type: "text",
      rows: 3,
      group: "logistics",
      description:
        "Only where this piece differs — a made-to-order item that cannot be " +
        "returned, for instance. Left empty, the page shows the standard " +
        "14-day wording, which is what keeps the section consistent.",
    }),
    defineField({
      name: "warrantyNotes",
      title: "Warranty copy",
      type: "text",
      rows: 3,
      group: "logistics",
    }),

    // Merchandising ---------------------------------------------------------
    defineField({
      name: "gallery",
      type: "array",
      group: "merchandising",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            { name: "alt", title: "Alt text", type: "string" },
            {
              name: "optionValue",
              title: "Shows for option value",
              type: "string",
              description:
                'Type one of this product\'s option values exactly (e.g. "Whitewash") to show this photo only when a customer picks that value. Leave blank to show it for every selection.',
            },
            {
              name: "isStudioShot",
              title: "Plain/studio background photo",
              type: "boolean",
              initialValue: false,
              description:
                "Tick this for the plain white/neutral-background product photo. Product cards whose main photo is a lifestyle/action shot will swap to whichever gallery image has this ticked when a customer hovers over the card.",
            },
          ],
        },
      ],
    }),
    /**
     * One video per product, shown as the second item in the gallery. Self
     * hosted through Sanity's asset CDN rather than an embed, so there is no
     * third-party player, no cookie banner consequence and no YouTube branding
     * on a product page.
     *
     * Run supplier footage through scripts/prepare-product-videos.ts first: it
     * trims the branded end card, re-encodes for the web and writes the poster
     * frame. A 40 MB supplier MP4 becomes roughly 3 MB.
     */
    defineField({
      name: "video",
      title: "Product video",
      type: "object",
      group: "merchandising",
      description:
        "Optional. Appears after the first photo in the gallery. Prepare the " +
        "file with scripts/prepare-product-videos.ts before uploading — raw " +
        "supplier videos are far too large and carry an end card.",
      options: { collapsible: true, collapsed: true },
      fields: [
        {
          name: "file",
          title: "Video file (MP4)",
          type: "file",
          options: { accept: "video/mp4" },
        },
        {
          name: "poster",
          title: "Poster image",
          description:
            "The still shown before playback. prepare-product-videos.ts " +
            "writes one alongside each video; without it the first frame is " +
            "used, which is often black.",
          type: "image",
          options: { hotspot: true },
        },
        {
          name: "alt",
          title: "Description",
          type: "string",
          description:
            "What the video shows, for screen readers and for the thumbnail's " +
            'label — e.g. "Pergola being assembled and the canopy drawn across".',
        },
      ],
    }),
    defineField({
      name: "badges",
      title: "Badges",
      type: "array",
      group: "merchandising",
      of: [{ type: "string" }],
      description: 'Short neutral descriptors, e.g. "2–3 person".',
    }),
    defineField({
      name: "highlights",
      title: "Feature highlights",
      type: "array",
      group: "merchandising",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "styleTags",
      title: "Style tags",
      type: "array",
      group: "merchandising",
      of: [{ type: "string" }],
      description:
        'Free-text facets for shop navigation, e.g. "Vintage & Reclaimed", "Coffee Table", "Modern". A product can carry several — they power the category drill-down filters.',
    }),

    // Filter facets --------------------------------------------------------
    // Written by scripts/derive-product-tags.ts from what the document already
    // says about itself, and constrained to the vocabulary in
    // src/lib/catalog/facets.ts — the same list the storefront's filter bar is
    // built from. Constraining both to one source is the point: without it the
    // script writes "Grey", an editor types "Gray", the filter looks for
    // "grey", and a shopper filtering for grey furniture is told there is none.
    defineField({
      name: "primaryColour",
      title: "Primary colour",
      type: "string",
      group: "merchandising",
      options: { list: [...COLOUR_TAGS] },
      description:
        "The colour this piece is, as listed and photographed — the swatch a " +
        "card shows. Left empty when the document does not say clearly enough; " +
        "an empty swatch is better than a wrong one.",
    }),
    defineField({
      name: "colourTags",
      title: "Colours available",
      type: "array",
      group: "merchandising",
      of: [{ type: "string", options: { list: [...COLOUR_TAGS] } }],
      options: { layout: "tags" },
      description: "Every colour this piece genuinely comes in, primary first.",
    }),
    defineField({
      name: "materialTags",
      title: "Materials",
      type: "array",
      group: "merchandising",
      of: [{ type: "string", options: { list: [...MATERIAL_TAGS] } }],
      options: { layout: "tags" },
      description:
        "What it is actually made of. A material the piece only imitates — " +
        "marble-effect glass, rattan-effect resin — is deliberately excluded.",
    }),
    defineField({
      name: "roomTags",
      title: "Rooms",
      type: "array",
      group: "merchandising",
      of: [{ type: "string", options: { list: [...ROOM_TAGS] } }],
      options: { layout: "tags" },
      description:
        "Rooms this belongs in, in a shopper's words rather than ours.",
    }),
    defineField({
      name: "useTags",
      title: "Product type",
      type: "array",
      group: "merchandising",
      of: [{ type: "string", options: { list: [...USE_TAGS] } }],
      options: { layout: "tags" },
      description: "What the thing is for — Coffee table, Storage, Lighting.",
    }),
    defineField({
      name: "specs",
      title: "Specifications",
      type: "array",
      group: "merchandising",
      of: [{ type: "productSpec" }],
    }),
    defineField({
      name: "options",
      title: "Configurable options",
      type: "array",
      group: "merchandising",
      of: [{ type: "productOption" }],
    }),
    defineField({
      name: "downloads",
      title: "Downloads (PDFs)",
      type: "array",
      group: "merchandising",
      of: [
        {
          type: "object",
          name: "download",
          fields: [
            { name: "label", type: "string" },
            { name: "file", type: "file" },
          ],
        },
      ],
    }),
    defineField({
      name: "relatedProducts",
      title: "Related products",
      type: "array",
      group: "merchandising",
      of: [{ type: "reference", to: [{ type: "product" }] }],
      description:
        "Falls back to other products in the same category if left empty.",
    }),
    defineField({
      name: "faqs",
      title: "FAQs",
      type: "array",
      group: "merchandising",
      of: [{ type: "faqEntry" }],
    }),
    defineField({
      name: "rating",
      type: "number",
      group: "merchandising",
      validation: (rule) => rule.min(0).max(5),
    }),
    defineField({
      name: "reviewCount",
      title: "Review count",
      type: "number",
      group: "merchandising",
    }),

    defineField({ name: "seo", type: "seo", group: "seo" }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "sku",
      media: "gallery.0",
    },
  },
});
