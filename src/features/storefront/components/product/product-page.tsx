import { BreadcrumbJsonLd, ProductJsonLd } from "@/components/shared/json-ld";
import { AppLink } from "@/components/ui/app-link";
import { ProductDetailInteractive } from "@/features/storefront/components/product/product-detail-interactive";
import { ProductTabs } from "@/features/storefront/components/product/product-tabs";
import { RecentlyViewed } from "@/features/storefront/components/product/recently-viewed";
import { RelatedContent } from "@/features/storefront/components/product/related-content";
import { RelatedProducts } from "@/features/storefront/components/product/related-products";
import { getRelatedProducts } from "@/lib/sanity/queries/product";
import { getRelatedContentForProduct } from "@/lib/sanity/queries/related-content";
import type { SanityProduct } from "@/types/sanity-content";

/**
 * Product — the warm, editorial detail page on off-white. A gallery and a
 * configurable summary sit above a tabbed information band and a "you may also
 * like" carousel. The header inverts to its light theme on these routes.
 */
export async function ProductDetail({ product }: { product: SanityProduct }) {
  const [related, relatedContent] = await Promise.all([
    getRelatedProducts(product, 4),
    getRelatedContentForProduct({
      productSlug: product.slug,
      categorySlug: product.category,
    }),
  ]);

  const productUrl = `/shop/${product.category}/${product.slug}`;
  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "All Collections", url: "/shop" },
    { name: product.categoryName, url: `/shop/${product.category}` },
    { name: product.name, url: productUrl },
  ];

  return (
    // pb-20 reserves room for ProductSummary's fixed mobile "Add to Basket"
    // bar, so it never ends up overlapping RelatedProducts/RecentlyViewed at
    // the very bottom of the page — lg:pb-0 since that bar is mobile-only.
    <div className="bg-canvas text-ink pb-20 lg:pb-0">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ProductJsonLd
        product={{
          name: product.name,
          description: product.summary,
          image: product.image ?? product.gallery?.[0]?.url,
          sku: product.sku,
          gtin: product.gtin,
          mpn: product.mpn,
          brandName: product.brand?.name,
          price: product.price,
          currency: product.currency,
          stockStatus: product.stockStatus,
          url: productUrl,
          rating: product.rating,
          reviewCount: product.reviewCount,
        }}
      />
      <div className="mx-auto max-w-[1280px] px-6 pt-8 sm:px-8 lg:px-12">
        <nav
          aria-label="Breadcrumb"
          className="text-muted flex flex-wrap items-center gap-2 text-[12px]"
        >
          <AppLink href="/" className="hover:text-ink transition-colors">
            Home
          </AppLink>
          <span aria-hidden>/</span>
          <AppLink href="/shop" className="hover:text-ink transition-colors">
            All Collections
          </AppLink>
          <span aria-hidden>/</span>
          <AppLink
            href={`/shop/${product.category}`}
            className="hover:text-ink transition-colors"
          >
            {product.categoryName}
          </AppLink>
          <span aria-hidden>/</span>
          <span className="text-ink" aria-current="page">
            {product.name}
          </span>
        </nav>

        <div className="mt-8 grid gap-10 pb-16 lg:grid-cols-2 lg:gap-14">
          <ProductDetailInteractive product={product} />
        </div>
      </div>

      <RelatedContent
        buyingGuides={relatedContent.buyingGuides}
        posts={relatedContent.posts}
        productSlug={product.slug}
        departmentSlug={product.departmentSlug}
      />

      <ProductTabs product={product} />

      <RelatedProducts products={related} />

      <RecentlyViewed product={product} />
    </div>
  );
}
