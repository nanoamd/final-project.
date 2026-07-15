import type { StructureResolver } from "sanity/structure";

import { SINGLETON_TYPES } from "./schemaTypes";

/**
 * Desk structure — pins the four singletons to a single fixed document each
 * (hidden from the generic list) and groups everything else into Catalog /
 * Content / Site sections instead of one flat alphabetical list.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Homepage")
        .id("homepage")
        .child(
          S.document().schemaType("homepage").documentId("homepage"),
        ),
      S.listItem()
        .title("Navigation")
        .id("navigation")
        .child(
          S.document().schemaType("navigation").documentId("navigation"),
        ),
      S.listItem()
        .title("Site Settings")
        .id("siteSettings")
        .child(
          S.document().schemaType("siteSettings").documentId("siteSettings"),
        ),
      S.listItem()
        .title("SEO Defaults")
        .id("seoDefaults")
        .child(
          S.document().schemaType("seoDefaults").documentId("seoDefaults"),
        ),
      S.divider(),
      S.listItem()
        .title("Catalog")
        .child(
          S.list()
            .title("Catalog")
            .items([
              S.documentTypeListItem("department").title("Departments"),
              S.documentTypeListItem("category").title("Categories"),
              S.documentTypeListItem("collection").title("Collections"),
              S.documentTypeListItem("product").title("Products"),
              S.documentTypeListItem("brand").title("Brands"),
              S.documentTypeListItem("supplier").title("Suppliers"),
            ]),
        ),
      S.listItem()
        .title("Content")
        .child(
          S.list()
            .title("Content")
            .items([
              S.documentTypeListItem("post").title("Blog Posts"),
              S.documentTypeListItem("buyingGuide").title("Buying Guides"),
              S.documentTypeListItem("author").title("Authors"),
              S.documentTypeListItem("faq").title("FAQs"),
              S.documentTypeListItem("page").title("Pages"),
            ]),
        ),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) =>
          item.getId() && !SINGLETON_TYPES.has(item.getId() as string) &&
          ![
            "department",
            "category",
            "collection",
            "product",
            "brand",
            "supplier",
            "post",
            "buyingGuide",
            "author",
            "faq",
            "page",
          ].includes(item.getId() as string),
      ),
    ]);
