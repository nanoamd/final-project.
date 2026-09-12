import { companyDetails, siteConfig } from "@/config/site";
import { handlingDays, schemaOrgAvailability } from "@/lib/catalog/delivery";
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
function shippingDetailsFor(handling: { min: number; max: number } | null) {
  return {
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
      // Handling used to be omitted here on the grounds that one figure would
      // be wrong for most of a catalogue spanning 2 days to 6 weeks — true,
      // which is why this is now per product from the same rule the feed uses
      // rather than a constant. Search Console was reporting the omission as
      // "Missing field 'handlingTime'".
      ...(handling
        ? {
            handlingTime: {
              "@type": "QuantitativeValue",
              minValue: handling.min,
              maxValue: handling.max,
              unitCode: "DAY",
            },
          }
        : {}),
      // Courier time, which genuinely is a constant.
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 2,
        maxValue: 5,
        unitCode: "DAY",
      },
    },
  };
}

/**
 * `ReturnFeesCustomerResponsibility`, not `ReturnShippingFees`.
 *
 * Search Console reported "Missing field 'returnShippingFeesAmount'", and the
 * honest fix is not to invent an amount — it is that the previous value was
 * the wrong one. `ReturnShippingFees` means the merchant charges a stated fee
 * for the return, which is why Google then wants the figure.
 * `ReturnFeesCustomerResponsibility` means the customer arranges and pays for
 * return carriage themselves, which is exactly what /returns says happens on a
 * change of mind, and it takes no amount because Kaiku charges none.
 *
 * A faulty, damaged or incorrect item is covered by Kaiku either way; this
 * field describes the change-of-mind case, which is the one the policy makes
 * the customer's responsibility.
 */
const RETURN_POLICY = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "GB",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 14,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
};

export interface ProductJsonLdInput {
  name: string;
  description: string;
  image?: string | null;
  /** Every gallery photo. Google reads multiple images and recommends them. */
  images?: string[];
  sku?: string;
  gtin?: string;
  mpn?: string;
  brandName?: string;
  price: number;
  currency: string;
  /** Null on the importer-created products that never got one set. */
  stockStatus: StockStatus | null | undefined;
  url: string;
  rating?: number;
  reviewCount?: number;
  /** From `colourTags` — one of the attributes Google matches queries against. */
  colours?: string[];
  /** From `materialTags`, same reason. */
  materials?: string[];
  width?: number;
  height?: number;
  dimensionUnit?: string;
  /** The delivery window this product's page states, e.g. "3–4 weeks". */
  deliveryWindow?: string | null;
}

/**
 * schema.org expects a UN/CEFACT unit code, not "cm". Anything unrecognised
 * returns null and the measurement is omitted rather than sent with a unit
 * Google cannot read.
 */
function unitCodeFor(unit: string | undefined): string | null {
  switch (unit?.trim().toLowerCase()) {
    case "cm":
    case "cms":
    case "centimetre":
    case "centimeter":
      return "CMT";
    case "mm":
      return "MMT";
    case "m":
      return "MTR";
    case "in":
    case "inch":
    case "inches":
      return "INH";
    default:
      return null;
  }
}

function quantitative(value: number | undefined, unitCode: string | null) {
  if (typeof value !== "number" || !unitCode) return undefined;
  return { "@type": "QuantitativeValue", value, unitCode };
}

/** Product schema for a single product detail page. */
export function ProductJsonLd({ product }: { product: ProductJsonLdInput }) {
  const url = product.url.startsWith("http")
    ? product.url
    : `${siteConfig.url}${product.url}`;

  /**
   * Every distinct gallery photo, not just the hero. Google reads `image` as a
   * list and recommends supplying more than one; 808 of 907 products have a
   * second photo that was being withheld from it.
   */
  const images = [
    ...new Set([product.image, ...(product.images ?? [])].filter(Boolean)),
  ] as string[];

  const unitCode = unitCodeFor(product.dimensionUnit);
  const width = quantitative(product.width, unitCode);
  const height = quantitative(product.height, unitCode);

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    ...(images.length ? { image: images } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.gtin ? { gtin: product.gtin } : {}),
    ...(product.mpn ? { mpn: product.mpn } : {}),
    ...(product.brandName
      ? { brand: { "@type": "Brand", name: product.brandName } }
      : {}),
    // Colour and material are two of the attributes Google matches a query
    // against — "grey glazed vase", "oak console table" — and they were being
    // left for it to infer from prose. Joined with "/" where a product has
    // several, which is the convention Merchant Center documents.
    ...(product.colours?.length ? { color: product.colours.join("/") } : {}),
    ...(product.materials?.length
      ? { material: product.materials.join("/") }
      : {}),
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: product.currency,
      price: product.price,
      availability: schemaOrgAvailability(product.stockStatus),
      // The feed has always sent condition; the page never did, leaving Google
      // to assume it on the one path it actually reads.
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: shippingDetailsFor(handlingDays(product.deliveryWindow)),
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
