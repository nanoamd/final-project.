import { FeaturedProductSection } from "@/features/storefront/components/home/featured-product";
import { getHomepage } from "@/lib/sanity/queries/homepage";
import { getProduct } from "@/lib/sanity/queries/product";

/**
 * A second, hand-picked homepage spotlight — distinct from the automatic
 * flagship section (highest-priced buyable product) and the hero's small
 * floating card. Set via the Homepage singleton's "Featured product"
 * field in Studio; renders nothing until an editor pins one.
 */
export async function CuratedFeaturedProduct() {
  const homepage = await getHomepage();
  if (!homepage?.curatedFeaturedProductSlug) return null;

  const product = await getProduct(homepage.curatedFeaturedProductSlug);
  if (!product?.image) return null;

  return (
    <FeaturedProductSection
      product={{ ...product, image: product.image }}
      eyebrow="Featured"
    />
  );
}
