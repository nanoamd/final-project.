import { author } from "./documents/author";
import { brand } from "./documents/brand";
import { buyingGuide } from "./documents/buying-guide";
import { category } from "./documents/category";
import { collection } from "./documents/collection";
import { contactSubmission } from "./documents/contact-submission";
import { department } from "./documents/department";
import { emailTemplate } from "./documents/email-template";
import { faq } from "./documents/faq";
import { newsletterSubscriber } from "./documents/newsletter-subscriber";
import { page } from "./documents/page";
import { post } from "./documents/post";
import { priceAdjustment } from "./documents/price-adjustment";
import { product } from "./documents/product";
import { quoteRequest } from "./documents/quote-request";
import { skuAssignment } from "./documents/sku-assignment";
import { supplier } from "./documents/supplier";
import { dimensions } from "./objects/dimensions";
import { faqEntry } from "./objects/faq-entry";
import { link } from "./objects/link";
import { productOption } from "./objects/product-option";
import { productSpec } from "./objects/product-spec";
import { richText } from "./objects/rich-text";
import { seo } from "./objects/seo";
import { shippingRule } from "./objects/shipping-rule";
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
  shippingRule,
  faqEntry,
  richText,
  // Documents
  department,
  category,
  collection,
  product,
  priceAdjustment,
  emailTemplate,
  skuAssignment,
  brand,
  supplier,
  author,
  post,
  buyingGuide,
  faq,
  page,
  contactSubmission,
  quoteRequest,
  newsletterSubscriber,
  // Singletons
  homepage,
  navigation,
  siteSettings,
  seoDefaults,
];
