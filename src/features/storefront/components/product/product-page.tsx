import { SectionHeading } from "@/components/shared/section-heading";
import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { ProductFaqs } from "@/features/storefront/components/product/product-faq";
import { ProductGallery } from "@/features/storefront/components/product/product-gallery";
import { ProductSpecs } from "@/features/storefront/components/product/product-specs";
import { ProductSummary } from "@/features/storefront/components/product/product-summary";
import { RelatedProducts } from "@/features/storefront/components/product/related-products";
import { getRelatedProducts } from "@/features/storefront/data/catalog";
import type { Product } from "@/types/catalog";

export function ProductDetail({ product }: { product: Product }) {
  const related = getRelatedProducts(product, 3);

  return (
    <>
      <Section spacing="compact">
        <Container>
          <nav className="text-muted flex items-center gap-2 text-[13px]">
            <AppLink href="/shop" className="hover:text-ink">
              Shop
            </AppLink>
            <span aria-hidden>/</span>
            <AppLink
              href={`/shop/${product.category}`}
              className="hover:text-ink"
            >
              {product.categoryName}
            </AppLink>
            <span aria-hidden>/</span>
            <span className="text-ink">{product.name}</span>
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
            <ProductGallery
              illustration={product.illustration}
              name={product.name}
            />
            <ProductSummary product={product} />
          </div>
        </Container>
      </Section>

      <Section className="border-line bg-paper border-t">
        <Container>
          <ProductSpecs product={product} />
        </Container>
      </Section>

      <Section className="border-line border-t">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <SectionHeading eyebrow="Questions" title="Frequently asked" />
            <ProductFaqs faqs={product.faqs} />
          </div>
        </Container>
      </Section>

      <RelatedProducts products={related} />
    </>
  );
}
