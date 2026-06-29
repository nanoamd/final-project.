import { notFound } from "next/navigation";

import { PageIntro } from "@/components/shared/page-intro";
import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { CategoryBrowser } from "@/features/storefront/components/category/category-browser";
import { CategoryEducation } from "@/features/storefront/components/category/category-education";
import {
  getCategory,
  getProductsByCategory,
} from "@/features/storefront/data/catalog";

export function CategoryPage({ slug }: { slug: string }) {
  const category = getCategory(slug);
  if (!category) notFound();

  const products = getProductsByCategory(slug);

  return (
    <>
      <PageIntro
        eyebrow={
          <span className="flex items-center gap-2">
            <AppLink href="/shop" className="hover:text-ink">
              Shop
            </AppLink>
            <span aria-hidden>/</span>
            <span className="text-ink">{category.name}</span>
          </span>
        }
        title={category.name}
        intro={category.description}
      />
      <Section>
        <Container>
          <CategoryBrowser products={products} />
        </Container>
      </Section>
      <CategoryEducation />
    </>
  );
}
