import { FeaturedProducts } from "@/features/storefront/components/home/featured-products";
import { Hero } from "@/features/storefront/components/home/hero";
import { RitualPillars } from "@/features/storefront/components/home/ritual-pillars";

/**
 * Homepage in transition to the photography-led direction: hero, the
 * scroll-animated ritual pillars, then the product grid. The older
 * illustration-based sections (value prop, why-choose-us, buying guides,
 * journal signup) are paused while the visual language is rebuilt around real
 * photography — they still exist and can be reintroduced once reskinned.
 */
export function HomePage() {
  return (
    <>
      <Hero />
      <RitualPillars />
      <FeaturedProducts />
    </>
  );
}
