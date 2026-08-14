import { companyDetails, siteConfig } from "@/config/site";
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
    // The trader's own name, because Kaiku is a sole trader rather than a company.
    legalName: siteConfig.legalName,
    url: siteConfig.url,
    description: siteConfig.description,
    email: siteConfig.email,
    // A geographic address is what Merchant Centre and Google's trust signals look
    // for when deciding whether a shop is a real business, and what the law requires
    // of a distance seller. It was in the footer as prose and nowhere a machine could
    // read it.
    address: {
      "@type": "PostalAddress",
      streetAddress: companyDetails.address.line1,
      addressLocality: companyDetails.address.town,
      postalCode: companyDetails.address.postcode,
      addressCountry: "GB",
    },
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

/**
 * Delivery and returns, attached to every Offer.
 *
 * Google surfaces both as annotations under a product in Shopping and in free
 * listings — "Free delivery" and "14-day returns" appear beside the price — so
 * omitting them costs click-through on results we already rank for. They are
 * also the two warnings the Rich Results Test raises on an Offer that has
 * neither.
 *
 * Both describe what actually happens rather than what would look best.
 * Checkout charges £0 on every item (see createCheckoutSession — one fixed
 * shipping option at zero, with delivery folded into the retail price), and the
 * 14 days and the faulty-item terms are lifted from /returns.
 *
 * Deliberately no `priceValidUntil`. Google only warns when it is absent, and
 * any date put there would be invented — the same mistake as the seeded star
 * ratings, in a smaller way.
 */
const SHIPPING_DETAILS = {
  "@type": "OfferShippingDetails",
  shippingRate: {
    "@type": "MonetaryAmount",
    value: 0,
    currency: "GBP",
  },
  shippingDestination: {
    "@type": "DefinedRegion",
    addressCountry: "GB",
  },
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    // Courier time only. Handling — the supplier's lead time, 2 days to 6 weeks
    // across this catalogue — is sent per product in the Merchant feed instead,
    // because one figure here would be wrong for most of the range.
    transitTime: {
      "@type": "QuantitativeValue",
      minValue: 2,
      maxValue: 5,
      unitCode: "DAY",
    },
  },
};

const RETURN_POLICY = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "GB",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 14,
  returnMethod: "https://schema.org/ReturnByMail",
  // Change-of-mind returns are at the customer's cost; we cover carriage only
  // when an item arrives faulty, damaged or incorrect. Stating the generous
  // half here and not the other would be the thing a customer discovers later.
  returnFees: "https://schema.org/ReturnShippingFees",
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
      shippingDetails: SHIPPING_DETAILS,
      hasMerchantReturnPolicy: RETURN_POLICY,
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
