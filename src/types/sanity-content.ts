/**
 * Types returned by the GROQ query layer (src/lib/sanity/queries/*.ts).
 *
 * Deliberately separate from src/types/catalog.ts, which still describes the
 * shape the *live* storefront renders today (backed by the static catalog).
 * Frontend rewiring swaps components over to these shapes one page at a time;
 * until then, both type sets exist side by side without colliding.
 *
 * Image fields are resolved to a plain URL string inside the GROQ projection
 * itself (`asset->url`), not shipped as raw Sanity asset references.
 */
import type { PortableTextBlock } from "@portabletext/types";

export interface SanityProductSpec {
  label: string;
  value: string;
}

export interface SanityProductFaq {
  question: string;
  answer: string;
}

export interface SanityProductOption {
  label: string;
  values: string[];
}

export interface SanityDimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
}

export interface SanityWeight {
  value?: number;
  unit?: string;
}

export type StockStatus =
  | "In Stock"
  | "Out of Stock"
  | "Backorder"
  | "Made to Order";

export interface SanityProductDownload {
  label?: string;
  url: string | null;
}

export interface SanityBrand {
  slug: string;
  name: string;
  logo?: string | null;
}

export interface SanitySupplier {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  defaultLeadTimeDays?: number;
}

export interface SanityDepartment {
  slug: string;
  name: string;
  description?: string;
  image?: string | null;
  order: number;
}

export interface SanityCategory {
  slug: string;
  name: string;
  tagline?: string;
  description: string;
  departmentSlug?: string | null;
  departmentName?: string | null;
  iconName?: string;
  /** Editorial override — show as coming-soon even if products exist. */
  comingSoon: boolean;
  /** Live count via GROQ count(), not editor-entered. */
  productCount: number;
  image?: string | null;
}

export interface SanityProduct {
  slug: string;
  name: string;
  category: string;
  categoryName: string;
  brand?: SanityBrand | null;
  tagline?: string;
  summary: string;
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  badges?: string[];
  highlights: string[];
  specs: SanityProductSpec[];
  options?: SanityProductOption[];
  gallery: string[];
  image?: string | null;
  sku?: string;
  gtin?: string;
  mpn?: string;
  supplier?: SanitySupplier | null;
  dimensions?: SanityDimensions;
  weight?: SanityWeight;
  deliveryLeadTime?: string;
  stockStatus: StockStatus;
  stockQuantity?: number;
  deliveryNotes?: string;
  warrantyNotes?: string;
  downloads?: SanityProductDownload[];
  relatedSlugs?: string[];
  rating?: number;
  reviewCount?: number;
  faqs: SanityProductFaq[];
}

export interface SanityCollection {
  slug: string;
  title: string;
  description?: string;
  image?: string | null;
  productSlugs: string[];
}

export interface SanityLink {
  label: string;
  href: string;
}

export interface SanityAuthor {
  slug: string;
  name: string;
  avatar?: string | null;
  role?: string;
  bio?: string;
}

export interface SanityPost {
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string | null;
  body: PortableTextBlock[];
  author?: SanityAuthor | null;
  publishedAt: string;
  tags?: string[];
}

export interface SanityBuyingGuide {
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string | null;
  body: PortableTextBlock[];
  author?: SanityAuthor | null;
  publishedAt: string;
}

export interface SanityPage {
  slug: string;
  title: string;
  intro?: string;
  body: PortableTextBlock[];
}

export interface SanityFaq {
  question: string;
  answer: string;
  topic: string;
}

export interface TrustBarItem {
  iconName: string;
  title: string;
  copy: string;
}

export interface CategoryTile {
  categorySlug: string;
  categoryName: string;
  image?: string | null;
}

export interface LivingCard {
  title: string;
  copy: string;
  image?: string | null;
}

export interface SanityHomepage {
  heroEyebrow?: string;
  heroHeadline?: string;
  heroHighlight?: string;
  heroSubcopy?: string;
  heroImage?: string | null;
  heroCtaPrimary?: SanityLink | null;
  heroCtaSecondary?: SanityLink | null;
  heroFeaturedProductSlug?: string | null;
  trustBarItems?: TrustBarItem[];
  shopByCategoryEyebrow?: string;
  shopByCategoryTiles?: CategoryTile[];
  gardenStudioEyebrow?: string;
  gardenStudioHeadline?: string;
  gardenStudioBody?: string;
  gardenStudioBeforeImage?: string | null;
  gardenStudioAfterImage?: string | null;
  gardenStudioImages?: string[];
  gardenStudioCta?: SanityLink | null;
  designedForLivingHeadline?: string;
  designedForLivingCards?: LivingCard[];
}

export interface NavLinkNode {
  label: string;
  href: string;
  children?: SanityLink[];
}

export interface FooterColumn {
  title: string;
  links: SanityLink[];
}

export interface SanityNavigation {
  headerLinks: NavLinkNode[];
  collectionsBarLinks: SanityLink[];
  footerColumns: FooterColumn[];
}

export interface SanitySiteSettings {
  siteName?: string;
  legalName?: string;
  tagline?: string;
  description?: string;
  logo?: string | null;
  email?: string;
  phone?: string;
}

export interface SanitySeoDefaults {
  defaultMetaTitleTemplate?: string;
  defaultMetaDescription?: string;
  defaultOgImage?: string | null;
}
