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

export interface SanityProductVideo {
  /** Sanity asset CDN URL for the MP4. */
  url: string;
  /** Still shown before playback. Without one the browser shows the first
   * frame, which on supplier footage is frequently black. */
  poster?: string | null;
  /** What the video shows — used as the thumbnail's accessible label. */
  alt?: string | null;
}

export interface SanityProductGalleryImage {
  url: string;
  /** Editor-entered per-photo alt text (e.g. "Reclaimed teak dining table,
   * top view") — falls back to the product name in components when empty,
   * so it's always safe to render even for photos an editor hasn't
   * described yet. */
  alt?: string;
  /** Matches one of the product's option values (e.g. "Whitewash") when
   * this photo should only show for that selection; unset shows always. */
  optionValue?: string | null;
  /** Editor-tagged plain/studio background photo — the hover-swap target
   * for cards whose main photo is a lifestyle/action shot. */
  isStudioShot?: boolean;
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
  "In Stock" | "Out of Stock" | "Backorder" | "Made to Order" | "Coming Soon";

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
  /**
   * Whether this room occupies a top-level navigation slot.
   *
   * False means it keeps its page, its URL and its categories but is reached
   * through a parent room instead — for ranges too small to earn a slot beside
   * Living Room. Defaults to true in the projection, so a room saved before this
   * field existed is unaffected.
   */
  showInMainNav?: boolean;
}

export interface SanityCategory {
  slug: string;
  name: string;
  tagline?: string;
  description: string;
  departmentSlug?: string | null;
  departmentName?: string | null;
  /**
   * Every room this category is shoppable from, primary first.
   *
   * Filter on this rather than `departmentSlug` when deciding whether a category
   * belongs to a room: a category can be reached from several, and
   * `departmentSlug` only ever holds the first.
   */
  departmentSlugs?: string[] | null;
  /**
   * Selectable from its rooms, but kept out of their combined product grids —
   * so tapping Sauna shows saunas, not four bottles of oil beside a £5,279 cabin.
   */
  excludeFromRoomGrid?: boolean | null;
  iconName?: string;
  /** Editorial override — show as coming-soon even if products exist. */
  comingSoon: boolean;
  /** Live count via GROQ count(), not editor-entered. */
  productCount: number;
  /**
   * The category's own page content — introduction, buying guidance, FAQs and the
   * categories to send someone to next.
   *
   * All optional: a category without them renders exactly as it did before, which
   * is what lets the copy be written a few categories at a time rather than all 43
   * before anything ships.
   */
  intro?: PortableTextBlock[] | null;
  buyingGuide?: PortableTextBlock[] | null;
  faqs?: { question: string; answer: string }[] | null;
  relatedCategories?:
    | ({
        slug: string;
        name: string;
        description?: string;
        stocked?: boolean;
      } | null)[]
    | null;
  image?: string | null;
}

export interface SanityProduct {
  slug: string;
  name: string;
  category: string;
  categoryName: string;
  additionalCategorySlugs?: string[];
  brand?: SanityBrand | null;
  tagline?: string;
  summary: string;
  description?: PortableTextBlock[];
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  badges?: string[];
  highlights: string[];
  styleTags?: string[];
  /** Derived filter facets — see scripts/derive-product-tags.ts and the
   *  vocabulary in src/lib/catalog/facets.ts. Derived, not editorial: they are
   *  rewritten from the document's own text, so an override belongs in the text. */
  primaryColour?: string | null;
  colourTags?: string[];
  materialTags?: string[];
  roomTags?: string[];
  useTags?: string[];
  specs: SanityProductSpec[];
  options?: SanityProductOption[];
  gallery: SanityProductGalleryImage[];
  /** One optional product video, shown after the first photo in the gallery.
   * Null unless a file has actually been uploaded — the query filters out the
   * empty object an editor leaves behind by opening the field. */
  video?: SanityProductVideo | null;
  image?: string | null;
  /** Same photo as `image`, except zoomed to whatever crop/hotspot an
   * editor has set on that gallery image in Studio, cropped to a 4:5
   * ratio — use this (not `image`) for 4:5 card/grid thumbnails
   * specifically (e.g. the shop grid). Falls back to the exact same value
   * as `image` when no hotspot is set, so it's always safe to use in
   * place of it. Never used for the full product-detail gallery, which
   * always shows the untouched original photo. */
  cardImage?: string | null;
  /** Same as `cardImage`, cropped to 4:3 instead — use this for the
   * homepage Flagship/curated spotlight and the "Product of the Week"
   * sidebar card, which both render in a 4:3 box. Using the 4:5 `cardImage`
   * there would force a second, unintended crop on top of the editor's own
   * hotspot crop. */
  cardImageWide?: string | null;
  /** Same as `cardImage`, cropped to 1:1 instead — use this for the
   * square shop-all/search grid tiles, for the same reason as
   * `cardImageWide`. */
  cardImageSquare?: string | null;
  /** The photo a card swaps to on hover: the product in a real setting.
   *
   * Position one is the clean catalogue shot, so the hover is the first
   * gallery image *not* tagged `isStudioShot` — the room photography. Falls
   * back to the second image when every photo is a catalogue shot, so a card
   * still reveals another angle rather than nothing. Null only when the
   * product has a single photo. Cropped to 4:5, matching `cardImage`. */
  hoverImage?: string | null;
  /** `hoverImage` cropped to 4:3, matching `cardImageWide`. */
  hoverImageWide?: string | null;
  /** `hoverImage` cropped to 1:1, matching `cardImageSquare`. */
  hoverImageSquare?: string | null;
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
  /** Per-product returns copy. Empty means the page shows the standard
   *  14-day wording, which is what keeps the section consistent. */
  returnsNotes?: string;
  warrantyNotes?: string;
  downloads?: SanityProductDownload[];
  relatedSlugs?: string[];
  rating?: number;
  reviewCount?: number;
  faqs: SanityProductFaq[];
  departmentSlug?: string | null;
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

export interface SanityRelatedProductRef {
  slug: string;
}

export interface SanityRelatedCategoryRef {
  slug: string;
  name: string;
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
  relatedProducts?: SanityRelatedProductRef[];
}

export interface SanityBuyingGuide {
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string | null;
  body: PortableTextBlock[];
  author?: SanityAuthor | null;
  publishedAt: string;
  relatedCategory?: SanityRelatedCategoryRef | null;
  relatedProducts?: SanityRelatedProductRef[];
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
  curatedFeaturedProductSlug?: string | null;
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
