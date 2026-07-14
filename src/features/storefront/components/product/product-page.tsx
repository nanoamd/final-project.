import { AppLink } from "@/components/ui/app-link";
import { ProductGallery } from "@/features/storefront/components/product/product-gallery";
import { ProductSummary } from "@/features/storefront/components/product/product-summary";
import { ProductTabs } from "@/features/storefront/components/product/product-tabs";
import { RelatedProducts } from "@/features/storefront/components/product/related-products";
import { getRelatedProducts } from "@/features/storefront/data/catalog";
import type { Product } from "@/types/catalog";

/**
 * Product — the warm, editorial detail page on off-white. A gallery and a
 * configurable summary sit above a tabbed information band and a "you may also
 * like" carousel. The header inverts to its light theme on these routes.
 */
export function ProductDetail({ product }: { product: Product }) {
  const related = getRelatedProducts(product, 4);

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
          <ProductGallery
            image={product.image}
            illustration={product.illustration}
            name={product.name}
          />
          <ProductSummary product={product} />
        </div>
      </div>

      <ProductTabs product={product} />

      <RelatedProducts products={related} />
    </div>
  );
}
