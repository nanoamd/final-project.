import type { Metadata } from "next";

import { CategoryCard } from "@/components/shared/category-card";
import { PageIntro } from "@/components/shared/page-intro";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { categories } from "@/features/storefront";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Outdoor saunas, sauna heaters, cold plunge and chillers — the foundations of the garden wellness ritual.",
};

export default function ShopPage() {
  return (
    <>
      <PageIntro
        eyebrow="Shop"
        title="The collection"
        intro="The foundations of the garden wellness ritual — each chosen, correctly sized and supported for the long term."
      />
      <Section>
        <Container>
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2">
            {categories.map((category) => (
              <CategoryCard
                key={category.slug}
                category={category}
                aspect="aspect-[5/4]"
              />
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
