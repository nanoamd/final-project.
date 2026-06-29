import { CategoryCard } from "@/components/shared/category-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getFeaturedCategories } from "@/features/storefront/data/catalog";

export function FeaturedCategories() {
  const categories = getFeaturedCategories();

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="The collection"
          title="Explore by category"
          intro="Four foundations of the garden wellness ritual — each chosen, correctly sized, and supported with the same care."
        />
        <div className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2">
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
  );
}
