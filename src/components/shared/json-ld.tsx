import { siteConfig } from "@/config/site";
import type { StockStatus } from "@/types/sanity-content";

/**
 * JSON-LD is injected via `dangerouslySetInnerHTML`, so any `<` in the
 * serialized data (e.g. inside a product description) must be escaped —
 * otherwise it could close the `<script>` tag early. This is the standard
 * safe-serialization approach for JSON-LD in a script element.
 */
function jsonLdScript(data: object) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

/**
 * Sitewide Organization schema — rendered once in the root layout. `logo`
 * is deliberately omitted: there's no real logo file in the repo yet, and
 * Google explicitly recommends against pointing this at a placeholder.
 */
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: siteConfig.url,
    description: siteConfig.description,
    email: siteConfig.email,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={jsonLdScript(data)}
    />
  );
}

/**
 * Sitewide WebSite + SearchAction schema — tells Google the site has an
 * internal search it can offer as a sitelinks searchbox. Rendered once in
 * the root layout, alongside OrganizationJsonLd.
 */
export function WebsiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={jsonLdScript(data)}
    />
  );
}

export interface BreadcrumbItem {
  name: string;
  /** Absolute or site-relative URL. Relative paths are resolved against
   * siteConfig.url. */
  url: string;
}

/** Reusable BreadcrumbList schema — pair with a matching visible <nav>. */
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http")
        ? item.url
        : `${siteConfig.url}${item.url}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={jsonLdScript(data)}
    />
  );
}

const AVAILABILITY_BY_STOCK_STATUS: Record<StockStatus, string> = {
  "In Stock": "https://schema.org/InStock",
  "Out of Stock": "https://schema.org/OutOfStock",
  Backorder: "https://schema.org/BackOrder",
  "Made to Order": "https://schema.org/PreOrder",
  // Not yet actually orderable (see the stockStatus schema/UI elsewhere in
  // the app) — OutOfStock is the honest mapping, not PreOrder, since
  // customers can't actually buy it yet.
  "Coming Soon": "https://schema.org/OutOfStock",
};

export interface ProductJsonLdInput {
  name: string;
  description: string;
  image?: string | null;
  sku?: string;
  gtin?: string;
  mpn?: string;
  brandName?: string;
  price: number;
  currency: string;
  stockStatus: StockStatus;
  url: string;
  rating?: number;
  reviewCount?: number;
}

/** Product schema for a single product detail page. */
export function ProductJsonLd({ product }: { product: ProductJsonLdInput }) {
  const url = product.url.startsWith("http")
    ? product.url
    : `${siteConfig.url}${product.url}`;

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    ...(product.image ? { image: [product.image] } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.gtin ? { gtin: product.gtin } : {}),
    ...(product.mpn ? { mpn: product.mpn } : {}),
    ...(product.brandName
      ? { brand: { "@type": "Brand", name: product.brandName } }
      : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: product.currency,
      price: product.price,
      availability: AVAILABILITY_BY_STOCK_STATUS[product.stockStatus],
    },
    ...(product.rating && product.reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={jsonLdScript(data)}
    />
  );
}

/** FAQPage schema — pass the same real Sanity FAQ data already rendered on
 * the page. Never call this with placeholder/fallback copy. */
export function FaqJsonLd({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={jsonLdScript(data)}
    />
  );
}
