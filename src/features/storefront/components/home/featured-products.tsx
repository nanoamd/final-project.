import { ProductCard } from "@/components/shared/product-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getFeaturedProducts } from "@/features/storefront/data/catalog";

export function FeaturedProducts() {
  const products = getFeaturedProducts(4);

  return (
    <Section className="border-line bg-paper border-y">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            className="max-w-2xl"
            eyebrow="Outdoor saunas"
            title="A considered starting point"
            intro="A small, carefully chosen selection — the rest of the range is matched to you through guided buying."
          />
          <AppLink
            href="/shop/outdoor-saunas"
            className={buttonVariants({ variant: "quiet" })}
          >
            View all saunas
          </AppLink>
        </div>
        <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
