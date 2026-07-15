import { author } from "./documents/author";
import { brand } from "./documents/brand";
import { buyingGuide } from "./documents/buying-guide";
import { category } from "./documents/category";
import { collection } from "./documents/collection";
import { department } from "./documents/department";
import { faq } from "./documents/faq";
import { page } from "./documents/page";
import { post } from "./documents/post";
import { product } from "./documents/product";
import { supplier } from "./documents/supplier";
import { dimensions } from "./objects/dimensions";
import { faqEntry } from "./objects/faq-entry";
import { link } from "./objects/link";
import { productOption } from "./objects/product-option";
import { productSpec } from "./objects/product-spec";
import { richText } from "./objects/rich-text";
import { seo } from "./objects/seo";
import { weight } from "./objects/weight";
import { homepage } from "./singletons/homepage";
import { navigation } from "./singletons/navigation";
import { seoDefaults } from "./singletons/seo-defaults";
import { siteSettings } from "./singletons/site-settings";

export const SINGLETON_TYPES = new Set([
  "homepage",
  "navigation",
  "siteSettings",
  "seoDefaults",
]);

export const schemaTypes = [
  // Shared objects
  seo,
  link,
  dimensions,
  weight,
  productSpec,
  productOption,
  faqEntry,
  richText,
  // Documents
  department,
  category,
  collection,
  product,
  brand,
  supplier,
  author,
  post,
  buyingGuide,
  faq,
  page,
  // Singletons
  homepage,
  navigation,
  siteSettings,
  seoDefaults,
];
