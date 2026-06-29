import { BuyingGuides } from "@/features/storefront/components/home/buying-guides";
import { EditorialSection } from "@/features/storefront/components/home/editorial-section";
import { FeaturedCategories } from "@/features/storefront/components/home/featured-categories";
import { FeaturedProducts } from "@/features/storefront/components/home/featured-products";
import { GuidedBuyingCta } from "@/features/storefront/components/home/guided-buying-cta";
import { Hero } from "@/features/storefront/components/home/hero";
import { JournalSignup } from "@/features/storefront/components/home/journal-signup";
import { ValueProposition } from "@/features/storefront/components/home/value-proposition";
import { WhyChooseUs } from "@/features/storefront/components/home/why-choose-us";

export function HomePage() {
  return (
    <>
      <Hero />
      <ValueProposition />
      <FeaturedCategories />
      <EditorialSection />
      <FeaturedProducts />
      <WhyChooseUs />
      <BuyingGuides />
      <GuidedBuyingCta />
      <JournalSignup />
    </>
  );
}
