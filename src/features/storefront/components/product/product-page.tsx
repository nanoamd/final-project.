import { AppLink } from "@/components/ui/app-link";
import { ProductGallery } from "@/features/storefront/components/product/product-gallery";
import { ProductSummary } from "@/features/storefront/components/product/product-summary";
import { ProductTabs } from "@/features/storefront/components/product/product-tabs";
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

  return (
    <div className="bg-canvas text-ink">
      <div className="mx-auto max-w-[1280px] px-6 pt-8 sm:px-8 lg:px-12">
        <nav className="text-muted flex flex-wrap items-center gap-2 text-[12px]">
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
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="mt-8 grid gap-10 pb-16 lg:grid-cols-2 lg:gap-14">
          <ProductGallery images={product.gallery} name={product.name} />
          <ProductSummary product={product} />
        </div>
      </div>

      <ProductTabs product={product} />

      <RelatedProducts products={related} />

      <RelatedContent
        buyingGuides={relatedContent.buyingGuides}
        posts={relatedContent.posts}
        productSlug={product.slug}
        departmentSlug={product.departmentSlug}
      />
    </div>
  );
}
